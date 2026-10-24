// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {PaymentRouter} from "../PaymentRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ─── Minimal mock ERC-20 ──────────────────────────────────────────────────────

/**
 * @dev Minimal ERC-20 mock used to simulate Arc USDC in a local test fork.
 *      The real Arc USDC address (0x3600...0000) is deployed only on live Arc
 *      networks.  In Foundry's local anvil environment the address has no code,
 *      so we `vm.etch` our mock bytecode there.
 */
contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8  public decimals = 6;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

// ─── Reentrancy attacker ──────────────────────────────────────────────────────

/**
 * @dev Attempts reentrancy during a `pay` call by re-entering `pay` inside a
 *      mock transferFrom hook.  Since the mock is a separate contract we test
 *      reentrancy by having the attacker contract attempt a second pay inside
 *      the first, using a different mock that calls back into PaymentRouter.
 */
contract ReentrancyMockUSDC {
    PaymentRouter private target;
    address private merchant;
    bool private attacking;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    uint8 public decimals = 6;
    string public name = "ReentrancyUSDC";
    string public symbol = "rUSDC";

    function setTarget(PaymentRouter _target, address _merchant) external {
        target = _target;
        merchant = _merchant;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    /// @dev On the first call, attempt re-entry.  The nonReentrant guard must
    ///      revert the inner call.
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        if (!attacking) {
            attacking = true;
            // Re-entrant call — must revert because of nonReentrant
            try target.pay(
                bytes32("reentrant"),
                address(this),
                merchant,
                amount
            ) {} catch {}
            attacking = false;
        }
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ─── Test contract ────────────────────────────────────────────────────────────

/**
 * @title  PaymentRouterTest
 * @notice Foundry unit tests covering all 15 specified test cases plus helpers.
 *
 * Test naming convention: test_<description>
 * Revert tests:           test_revert_<description>
 */
contract PaymentRouterTest is Test {

    // ── Constants ─────────────────────────────────────────────────────────────

    /// Arc USDC ERC-20 address — the contract under test accepts only this.
    address constant USDC_ADDR = 0x3600000000000000000000000000000000000000;

    /// A different, non-USDC address used to test unsupported-token rejection.
    address constant FAKE_TOKEN = address(0xdEaD);

    uint256 constant ONE_USDC = 1e6;   // 1 USDC in 6-decimal units

    // ── Actors ────────────────────────────────────────────────────────────────

    address owner    = makeAddr("owner");
    address payer    = makeAddr("payer");
    address merchant = makeAddr("merchant");
    address attacker = makeAddr("attacker");
    address stranger = makeAddr("stranger");

    // ── State ─────────────────────────────────────────────────────────────────

    PaymentRouter router;
    MockUSDC      usdc;

    // ── Setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        // Deploy the mock USDC and etch its bytecode to the canonical Arc address.
        usdc = new MockUSDC();
        vm.etch(USDC_ADDR, address(usdc).code);
        // After etching, reassign the interface pointer so our helpers use the
        // etched address directly.
        usdc = MockUSDC(USDC_ADDR);

        // Deploy the router with `owner` as the Ownable owner.
        vm.prank(owner);
        router = new PaymentRouter(owner);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// Mint `amount` USDC to `account` and approve the router.
    function _fund(address account, uint256 amount) internal {
        usdc.mint(account, amount);
        vm.prank(account);
        usdc.approve(address(router), amount);
    }

    /// Execute a successful pay from `payer` to `merchant`.
    function _pay(
        bytes32 id,
        address _payer,
        address _merchant,
        uint256 amount
    ) internal {
        _fund(_payer, amount);
        vm.prank(_payer);
        router.pay(id, USDC_ADDR, _merchant, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Successful payment and correct direct transfer
    // ─────────────────────────────────────────────────────────────────────────

    function test_payment_transfersDirectlyToMerchant() public {
        uint256 amount = 100 * ONE_USDC;
        bytes32 id = keccak256("pay-001");

        uint256 merchantBefore = usdc.balanceOf(merchant);
        uint256 payerBefore    = usdc.balanceOf(payer);
        _fund(payer, amount);

        vm.prank(payer);
        router.pay(id, USDC_ADDR, merchant, amount);

        // Merchant received funds directly; router holds nothing.
        assertEq(usdc.balanceOf(merchant), merchantBefore + amount, "merchant balance");
        assertEq(usdc.balanceOf(payer),    payerBefore,             "payer balance after mint was consumed");
        assertEq(usdc.balanceOf(address(router)), 0,                "router must hold nothing");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Correct Paid event emission
    // ─────────────────────────────────────────────────────────────────────────

    function test_payment_emitsPaidEvent() public {
        uint256 amount = 50 * ONE_USDC;
        bytes32 id = keccak256("pay-002");
        _fund(payer, amount);

        vm.expectEmit(true, true, true, true);
        emit PaymentRouter.Paid(id, payer, merchant, USDC_ADDR, amount);

        vm.prank(payer);
        router.pay(id, USDC_ADDR, merchant, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Duplicate payment ID
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_duplicatePaymentId() public {
        bytes32 id = keccak256("pay-003");
        _pay(id, payer, merchant, 10 * ONE_USDC);

        // Second call with the same ID must revert.
        _fund(payer, 10 * ONE_USDC);
        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(PaymentRouter.DuplicatePaymentId.selector, id)
        );
        router.pay(id, USDC_ADDR, merchant, 10 * ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Zero amount and invalid addresses
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_zeroAmount() public {
        _fund(payer, ONE_USDC);
        bytes32 id = keccak256("pay-004a");

        vm.prank(payer);
        vm.expectRevert(PaymentRouter.ZeroAmount.selector);
        router.pay(id, USDC_ADDR, merchant, 0);
    }

    function test_revert_zeroMerchantAddress() public {
        _fund(payer, ONE_USDC);
        bytes32 id = keccak256("pay-004b");

        vm.prank(payer);
        vm.expectRevert(PaymentRouter.ZeroAddress.selector);
        router.pay(id, USDC_ADDR, address(0), ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Unsupported or incorrect token
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_unsupportedToken() public {
        _fund(payer, ONE_USDC);
        bytes32 id = keccak256("pay-005");

        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(
                PaymentRouter.UnsupportedToken.selector,
                FAKE_TOKEN
            )
        );
        router.pay(id, FAKE_TOKEN, merchant, ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Payment without sufficient allowance or balance
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_insufficientAllowance() public {
        bytes32 id = keccak256("pay-006a");
        // Mint balance but do NOT approve.
        usdc.mint(payer, 100 * ONE_USDC);

        vm.prank(payer);
        vm.expectRevert();   // SafeERC20 wraps the internal revert
        router.pay(id, USDC_ADDR, merchant, 100 * ONE_USDC);
    }

    function test_revert_insufficientBalance() public {
        bytes32 id = keccak256("pay-006b");
        // Approve but do not mint.
        vm.prank(payer);
        usdc.approve(address(router), 100 * ONE_USDC);

        vm.prank(payer);
        vm.expectRevert();
        router.pay(id, USDC_ADDR, merchant, 100 * ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Unauthorized refund
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_unauthorizedRefund() public {
        bytes32 id = keccak256("pay-007");
        _pay(id, payer, merchant, 50 * ONE_USDC);

        _fund(stranger, 50 * ONE_USDC);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                PaymentRouter.NotMerchant.selector,
                id,
                stranger
            )
        );
        router.refund(id, 50 * ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 8: Refund exceeding remaining refundable amount
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_refundExceedsRemaining() public {
        bytes32 id = keccak256("pay-008");
        uint256 amount = 100 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        // Merchant approves more than the original payment.
        _fund(merchant, amount + ONE_USDC);

        vm.prank(merchant);
        vm.expectRevert(
            abi.encodeWithSelector(
                PaymentRouter.RefundExceedsRemaining.selector,
                id,
                amount + ONE_USDC,
                amount
            )
        );
        router.refund(id, amount + ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 9: Multiple valid partial refunds
    // ─────────────────────────────────────────────────────────────────────────

    function test_partialRefunds_accumulateCorrectly() public {
        bytes32 id = keccak256("pay-009");
        uint256 amount = 90 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        // Refund 1: 30 USDC
        _fund(merchant, 30 * ONE_USDC);
        vm.prank(merchant);
        router.refund(id, 30 * ONE_USDC);
        assertEq(router.remainingRefundable(id), 60 * ONE_USDC, "after first partial");

        // Refund 2: 30 USDC
        _fund(merchant, 30 * ONE_USDC);
        vm.prank(merchant);
        router.refund(id, 30 * ONE_USDC);
        assertEq(router.remainingRefundable(id), 30 * ONE_USDC, "after second partial");

        // Refund 3: 30 USDC (full)
        _fund(merchant, 30 * ONE_USDC);
        vm.prank(merchant);
        router.refund(id, 30 * ONE_USDC);
        assertEq(router.remainingRefundable(id), 0, "after full refund");

        PaymentRouter.Payment memory pmt = router.getPayment(id);
        assertEq(
            uint256(pmt.status),
            uint256(PaymentRouter.PaymentStatus.FullyRefunded),
            "status must be FullyRefunded"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 10: Duplicate refund attempts (after full refund)
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_refundAfterFullRefund() public {
        bytes32 id = keccak256("pay-010");
        uint256 amount = 20 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        // Full refund.
        _fund(merchant, amount);
        vm.prank(merchant);
        router.refund(id, amount);

        // Second refund attempt on a fully-refunded payment must revert.
        _fund(merchant, ONE_USDC);
        vm.prank(merchant);
        vm.expectRevert(
            abi.encodeWithSelector(
                PaymentRouter.RefundExceedsRemaining.selector,
                id,
                ONE_USDC,
                0
            )
        );
        router.refund(id, ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 11: Insufficient merchant balance or allowance for refund
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_refund_merchantInsufficientAllowance() public {
        bytes32 id = keccak256("pay-011a");
        uint256 amount = 40 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        // Mint merchant balance but no approval.
        usdc.mint(merchant, amount);

        vm.prank(merchant);
        vm.expectRevert();
        router.refund(id, amount);
    }

    function test_revert_refund_merchantInsufficientBalance() public {
        bytes32 id = keccak256("pay-011b");
        uint256 amount = 40 * ONE_USDC;
        // Use a separate payer/merchant pair so we control merchant's balance.
        address merchantB2 = makeAddr("merchantB2");
        address payerB2    = makeAddr("payerB2");
        _pay(id, payerB2, merchantB2, amount);

        // merchantB2 now has `amount` USDC from the payment.
        // Transfer it away so the balance is zero.
        vm.prank(merchantB2);
        usdc.transfer(makeAddr("sink"), amount);
        assertEq(usdc.balanceOf(merchantB2), 0, "merchant drained");

        // Approve the router but have zero balance.
        vm.prank(merchantB2);
        usdc.approve(address(router), amount);

        vm.prank(merchantB2);
        vm.expectRevert();
        router.refund(id, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 12: Correct Refunded event emission
    // ─────────────────────────────────────────────────────────────────────────

    function test_refund_emitsRefundedEvent() public {
        bytes32 id = keccak256("pay-012");
        uint256 amount = 25 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        _fund(merchant, amount);

        vm.expectEmit(true, true, true, true);
        emit PaymentRouter.Refunded(id, merchant, payer, amount);

        vm.prank(merchant);
        router.refund(id, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 13: Paused payment and refund operations
    // ─────────────────────────────────────────────────────────────────────────

    function test_revert_payWhilePaused() public {
        vm.prank(owner);
        router.pause();

        bytes32 id = keccak256("pay-013a");
        _fund(payer, 10 * ONE_USDC);

        vm.prank(payer);
        vm.expectRevert(); // Pausable.EnforcedPause
        router.pay(id, USDC_ADDR, merchant, 10 * ONE_USDC);
    }

    function test_revert_refundWhilePaused() public {
        // Complete a payment before pausing.
        bytes32 id = keccak256("pay-013b");
        _pay(id, payer, merchant, 10 * ONE_USDC);

        vm.prank(owner);
        router.pause();

        _fund(merchant, 10 * ONE_USDC);
        vm.prank(merchant);
        vm.expectRevert(); // Pausable.EnforcedPause
        router.refund(id, 10 * ONE_USDC);
    }

    function test_resumeAfterUnpause() public {
        vm.prank(owner);
        router.pause();

        vm.prank(owner);
        router.unpause();

        // Operations must succeed after unpause.
        bytes32 id = keccak256("pay-013c");
        _pay(id, payer, merchant, 5 * ONE_USDC);

        PaymentRouter.Payment memory pmt = router.getPayment(id);
        assertEq(pmt.amount, 5 * ONE_USDC, "payment recorded post-unpause");
    }

    function test_revert_nonOwnerCannotPause() public {
        vm.prank(attacker);
        vm.expectRevert(); // Ownable.OwnableUnauthorizedAccount
        router.pause();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 14: Reentrancy resistance
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Deploy a PaymentRouter that accepts the reentrancy mock token
     *      (via vm.etch at USDC_ADDR), then attempt a re-entrant `pay`.
     *      The nonReentrant guard must block the inner call.
     */
    function test_reentrancyGuard_blocksDuringPay() public {
        // Deploy the reentrancy mock and etch it over the USDC address.
        ReentrancyMockUSDC reentrantUSDC = new ReentrancyMockUSDC();
        vm.etch(USDC_ADDR, address(reentrantUSDC).code);
        ReentrancyMockUSDC rUSDC = ReentrancyMockUSDC(USDC_ADDR);

        // Deploy a fresh router pointing at the same USDC address.
        vm.prank(owner);
        PaymentRouter reentrantRouter = new PaymentRouter(owner);

        rUSDC.setTarget(reentrantRouter, merchant);
        rUSDC.mint(payer, 100 * ONE_USDC);

        vm.prank(payer);
        rUSDC.approve(address(reentrantRouter), 100 * ONE_USDC);

        bytes32 id = keccak256("pay-014");

        // The outer pay should succeed; the inner re-entrant pay must be blocked.
        vm.prank(payer);
        reentrantRouter.pay(id, USDC_ADDR, merchant, 10 * ONE_USDC);

        // The re-entrant call used id "reentrant" — it must NOT have been recorded.
        PaymentRouter.Payment memory p = reentrantRouter.getPayment(bytes32("reentrant"));
        assertEq(
            uint256(p.status),
            uint256(PaymentRouter.PaymentStatus.NonExistent),
            "re-entrant payment must not be recorded"
        );

        // Restore the standard mock for subsequent tests.
        vm.etch(USDC_ADDR, address(new MockUSDC()).code);
        usdc = MockUSDC(USDC_ADDR);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 15: Isolation between separate payment IDs
    // ─────────────────────────────────────────────────────────────────────────

    function test_isolation_separatePaymentIds() public {
        bytes32 idA = keccak256("pay-015A");
        bytes32 idB = keccak256("pay-015B");

        address merchantA = makeAddr("merchantA");
        address merchantB = makeAddr("merchantB");
        address payerA    = makeAddr("payerA");
        address payerB    = makeAddr("payerB");

        uint256 amountA = 70 * ONE_USDC;
        uint256 amountB = 30 * ONE_USDC;

        _pay(idA, payerA, merchantA, amountA);
        _pay(idB, payerB, merchantB, amountB);

        // Verify independent records.
        PaymentRouter.Payment memory pmtA = router.getPayment(idA);
        PaymentRouter.Payment memory pmtB = router.getPayment(idB);

        assertEq(pmtA.payer,    payerA,   "payerA");
        assertEq(pmtA.merchant, merchantA,"merchantA");
        assertEq(pmtA.amount,   amountA,  "amountA");

        assertEq(pmtB.payer,    payerB,   "payerB");
        assertEq(pmtB.merchant, merchantB,"merchantB");
        assertEq(pmtB.amount,   amountB,  "amountB");

        // Refund on idA does not affect idB.
        _fund(merchantA, amountA);
        vm.prank(merchantA);
        router.refund(idA, amountA);

        assertEq(router.remainingRefundable(idA), 0,       "idA fully refunded");
        assertEq(router.remainingRefundable(idB), amountB, "idB unaffected");

        // MerchantA cannot refund idB.
        _fund(merchantA, amountB);
        vm.prank(merchantA);
        vm.expectRevert(
            abi.encodeWithSelector(
                PaymentRouter.NotMerchant.selector,
                idB,
                merchantA
            )
        );
        router.refund(idB, amountB);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Additional: state assertions and correct record fields
    // ─────────────────────────────────────────────────────────────────────────

    function test_paymentRecord_fieldsAreCorrect() public {
        bytes32 id = keccak256("pay-rec");
        uint256 amount = 77 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        PaymentRouter.Payment memory pmt = router.getPayment(id);
        assertEq(pmt.paymentId,    id,      "paymentId");
        assertEq(pmt.payer,        payer,   "payer");
        assertEq(pmt.merchant,     merchant,"merchant");
        assertEq(pmt.amount,       amount,  "amount");
        assertEq(pmt.totalRefunded,0,       "totalRefunded initial");
        assertEq(
            uint256(pmt.status),
            uint256(PaymentRouter.PaymentStatus.Paid),
            "status Paid"
        );
    }

    function test_refundRecord_updatesCorrectly() public {
        bytes32 id = keccak256("pay-rref");
        uint256 amount = 60 * ONE_USDC;
        _pay(id, payer, merchant, amount);

        _fund(merchant, 20 * ONE_USDC);
        vm.prank(merchant);
        router.refund(id, 20 * ONE_USDC);

        PaymentRouter.Payment memory pmt = router.getPayment(id);
        assertEq(pmt.totalRefunded, 20 * ONE_USDC, "totalRefunded after partial");
        assertEq(
            uint256(pmt.status),
            uint256(PaymentRouter.PaymentStatus.Paid),
            "still Paid after partial refund"
        );
    }

    function test_revert_refundOnNonExistentPayment() public {
        bytes32 ghost = keccak256("nonexistent");
        _fund(stranger, ONE_USDC);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                PaymentRouter.PaymentNotFound.selector,
                ghost
            )
        );
        router.refund(ghost, ONE_USDC);
    }

    function test_revert_zeroRefundAmount() public {
        bytes32 id = keccak256("zero-refund");
        _pay(id, payer, merchant, 10 * ONE_USDC);

        vm.prank(merchant);
        vm.expectRevert(PaymentRouter.ZeroAmount.selector);
        router.refund(id, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fuzz: pay amount is correctly recorded
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_payment_amountRecorded(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint128).max);
        bytes32 id = keccak256(abi.encode(amount, block.timestamp));
        _fund(payer, amount);
        vm.prank(payer);
        router.pay(id, USDC_ADDR, merchant, amount);
        assertEq(router.getPayment(id).amount, amount, "fuzz amount recorded");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fuzz: cumulative refund never exceeds original amount
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_refundNeverExceedsOriginal(
        uint256 amount,
        uint256 refund1,
        uint256 refund2
    ) public {
        vm.assume(amount  > 0    && amount  < type(uint128).max);
        vm.assume(refund1 > 0    && refund1 <= amount);
        vm.assume(refund2 > 0    && refund2 <= amount - refund1);

        bytes32 id = keccak256(abi.encode(amount, refund1, refund2));
        _pay(id, payer, merchant, amount);

        _fund(merchant, refund1);
        vm.prank(merchant);
        router.refund(id, refund1);

        _fund(merchant, refund2);
        vm.prank(merchant);
        router.refund(id, refund2);

        uint256 totalRefunded = router.getPayment(id).totalRefunded;
        assertLe(totalRefunded, amount, "cumulative refund <= original");
    }
}
