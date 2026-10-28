import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBytecode,
  useSwitchChain,
} from 'wagmi';
import { isAddress, type Address, type Hex } from 'viem';
import { toast } from 'sonner';
import {
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Receipt,
  Coins,
  AlertTriangle,
} from 'lucide-react';
import {
  USDC_ADDRESS,
  PAYMENT_ROUTER_ABI,
  ERC20_ABI,
  parseUsdc,
  formatUsdc,
  generatePaymentId,
  DEFAULT_ROUTER_ADDRESS,
  EXPLORER_URL,
  type StoredPayment,
  STORAGE_PAYMENTS_KEY,
  ARC_TESTNET_CHAIN_ID,
} from '../contracts/paymentRouter';

interface PayTabProps {
  routerAddress: Address;
  onPaymentSuccess?: (payment: StoredPayment) => void;
  onSelectPaymentForRefund?: (paymentId: Hex) => void;
}

export const PayTab: React.FC<PayTabProps> = ({
  routerAddress,
  onPaymentSuccess,
}) => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [merchant, setMerchant] = useState('');
  const [amountStr, setAmountStr] = useState('10.00');
  const [paymentIdHex, setPaymentIdHex] = useState<Hex>(() => generatePaymentId().paymentId);
  const [idPreimage, setIdPreimage] = useState(() => generatePaymentId().preimage);
  const [copiedId, setCopiedId] = useState(false);
  const [lastPayment, setLastPayment] = useState<StoredPayment | null>(null);

  const handleRegenerateId = () => {
    const { paymentId, preimage } = generatePaymentId(address);
    setPaymentIdHex(paymentId);
    setIdPreimage(preimage);
  };

  const isWrongNetwork = Boolean(isConnected && chainId && chainId !== ARC_TESTNET_CHAIN_ID);
  const isRouterConfigured = routerAddress && routerAddress !== DEFAULT_ROUTER_ADDRESS;

  // Verify on-chain deployment of the configured router contract
  const { data: routerBytecode } = useBytecode({
    address: routerAddress,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!isRouterConfigured },
  });

  const isRouterDeployed = Boolean(isRouterConfigured && routerBytecode && routerBytecode !== '0x');
  const parsedAmount = parseUsdc(amountStr);

  // Read user's USDC balance
  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isWrongNetwork },
  });

  // Read current allowance for PaymentRouter
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isRouterDeployed ? [address, routerAddress] : undefined,
    query: { enabled: !!address && isRouterDeployed && !isWrongNetwork },
  });

  const currentAllowance = (allowanceRaw as bigint | undefined) ?? 0n;
  const userBalance = (usdcBalanceRaw as bigint | undefined) ?? 0n;
  const needsApproval = parsedAmount > 0n && currentAllowance < parsedAmount;
  const hasInsufficientBalance = parsedAmount > 0n && userBalance < parsedAmount;

  // Approve Contract Write
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  // Wait for approval confirmation
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // Refetch allowance after approval succeeds
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('USDC allowance approved!');
      void refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Pay Contract Write
  const {
    writeContract: writePay,
    data: payTxHash,
    isPending: isPayPending,
    error: payError,
  } = useWriteContract();

  // Wait for pay confirmation
  const { isLoading: isPayConfirming, isSuccess: isPaySuccess } = useWaitForTransactionReceipt({
    hash: payTxHash,
  });

  // Handle successful payment
  useEffect(() => {
    if (isPaySuccess && payTxHash && address && isAddress(merchant)) {
      const record: StoredPayment = {
        paymentId: paymentIdHex,
        payer: address,
        merchant: merchant as Address,
        amount: amountStr,
        amountRaw: parsedAmount.toString(),
        timestamp: Date.now(),
        txHash: payTxHash,
        status: 'Paid',
      };

      setTimeout(() => {
        setLastPayment(record);
        handleRegenerateId();
      }, 0);
      toast.success(`Payment of ${amountStr} USDC confirmed on Arc!`);

      // Save to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_PAYMENTS_KEY);
        const list: StoredPayment[] = stored ? JSON.parse(stored) : [];
        const updated = [record, ...list.filter((p) => p.paymentId !== record.paymentId)].slice(0, 50);
        localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to store payment record', e);
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(record);
      }
    }
  }, [isPaySuccess, payTxHash]);

  const handleApprove = () => {
    if (!isRouterConfigured) {
      toast.error('Please configure a valid PaymentRouter address in settings first.');
      return;
    }
    // Approve the exact amount needed or standard max
    writeApprove({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [routerAddress, parsedAmount],
    });
  };

  const handlePay = () => {
    if (!isRouterConfigured) {
      toast.error('Please configure a valid PaymentRouter address in settings first.');
      return;
    }
    if (!isAddress(merchant)) {
      toast.error('Invalid merchant address.');
      return;
    }
    if (parsedAmount <= 0n) {
      toast.error('Amount must be greater than zero.');
      return;
    }
    if (!paymentIdHex || paymentIdHex.length !== 66) {
      toast.error('Invalid 32-byte payment ID.');
      return;
    }

    writePay({
      address: routerAddress,
      abi: PAYMENT_ROUTER_ABI,
      functionName: 'pay',
      args: [paymentIdHex, USDC_ADDRESS, merchant as Address, parsedAmount],
    });
  };

  const copyPaymentId = () => {
    if (paymentIdHex) {
      void navigator.clipboard.writeText(paymentIdHex);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.info('Payment ID copied to clipboard');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Checkout Form */}
      <div className="lg:col-span-7 bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A3038]">
          <div>
            <h2 className="text-base font-semibold text-[#F3F4F6] flex items-center gap-2">
              <span>Send USDC Checkout</span>
            </h2>
            <p className="text-xs text-[#737B87]">Funds route directly to the merchant without router custody</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#191D23] text-[#22C55E] border border-[#2A3038] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Non-Custodial
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {/* Merchant Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                Merchant Recipient Address
              </label>
              {address && (
                <button
                  type="button"
                  onClick={() => setMerchant(address)}
                  className="text-xs text-[#D6A23D] hover:underline"
                >
                  Use my address (for self-test)
                </button>
              )}
            </div>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value.trim())}
              placeholder="0x..."
              className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none transition"
            />
            {merchant && !isAddress(merchant) && (
              <p className="mt-1 text-xs text-[#EF4444] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Invalid EVM address
              </p>
            )}
          </div>

          {/* Amount in USDC */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                Amount (USDC)
              </label>
              <span className="text-xs text-[#737B87]">
                Balance: {formatUsdc(userBalance)} USDC
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md pl-3.5 pr-16 py-2 font-mono text-sm font-semibold text-[#F3F4F6] outline-none transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#191D23] border border-[#2A3038] px-2 py-0.5 rounded text-xs font-medium text-[#D6A23D]">
                <Coins className="w-3 h-3" /> USDC
              </div>
            </div>

            {/* Quick amount chips */}
            <div className="flex items-center gap-2 mt-2">
              {['5', '10', '25', '50', '100'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(val)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#0B0D10] hover:bg-[#191D23] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2A3038] transition"
                >
                  ${val}
                </button>
              ))}
              {userBalance > 0n && (
                <button
                  type="button"
                  onClick={() => setAmountStr(formatUsdc(userBalance))}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#191D23] text-[#D6A23D] border border-[#2A3038] hover:bg-[#2A3038] transition ml-auto"
                >
                  Max
                </button>
              )}
            </div>

            {hasInsufficientBalance && (
              <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Insufficient USDC balance for this transfer
              </p>
            )}
          </div>

          {/* Payment ID (Unique 32-byte hash) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                  Payment ID (bytes32)
                </label>
                <span
                  title="A cryptographically unique identifier seeded with your wallet and timestamp to prevent mempool front-running"
                  className="text-[#737B87] hover:text-[#F3F4F6] cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#D6A23D]" />
                </span>
              </div>
              <button
                type="button"
                onClick={handleRegenerateId}
                className="text-xs text-[#D6A23D] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> New Unique ID
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={paymentIdHex}
                onChange={(e) => setPaymentIdHex(e.target.value as Hex)}
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md pl-3.5 pr-10 py-2 font-mono text-xs text-[#F3F4F6] outline-none transition"
              />
              <button
                type="button"
                onClick={copyPaymentId}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#737B87] hover:text-[#F3F4F6] rounded transition"
                title="Copy payment ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-[#737B87] truncate font-mono">
              Preimage: {idPreimage || 'Custom bytes32 hash'}
            </p>
          </div>

          {/* Payment Summary / Fee Breakdown */}
          <div className="bg-[#0B0D10] rounded-md p-3.5 border border-[#2A3038] text-xs space-y-1.5">
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Checkout Subtotal</span>
              <span className="font-mono text-[#F3F4F6]">${amountStr || '0.00'} USDC</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>CheetahPay Router Fee</span>
              <span className="font-medium text-[#22C55E]">0.00 USDC (0%)</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Merchant Receives (Direct)</span>
              <span className="font-mono font-semibold text-[#F3F4F6]">${amountStr || '0.00'} USDC</span>
            </div>
            <div className="pt-2 border-t border-[#2A3038] flex justify-between items-center text-[#737B87]">
              <span>Current Router Allowance</span>
              <span className="font-mono text-[#9CA3AF]">{formatUsdc(currentAllowance)} USDC</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {!isConnected ? (
              <div className="text-center p-3.5 bg-[#0B0D10] rounded-md border border-[#2A3038]">
                <p className="text-xs text-[#737B87]">Connect your wallet to proceed with payment</p>
              </div>
            ) : isWrongNetwork ? (
              <div className="p-3.5 bg-[#191D23] border border-[#2A3038] rounded-md space-y-2">
                <div className="flex items-center gap-2 text-[#D6A23D] font-medium text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D6A23D]" />
                  <span>Incompatible Network Detected</span>
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                  Your wallet is connected to Chain ID {chainId}. Non-custodial USDC payments require Arc Testnet (Chain ID {ARC_TESTNET_CHAIN_ID}).
                </p>
                <button
                  type="button"
                  onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
                  className="w-full py-2 px-3 rounded-md bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-semibold text-xs transition"
                >
                  Switch to Arc Testnet
                </button>
              </div>
            ) : !isRouterDeployed ? (
              <div className="p-3.5 bg-[#191D23] border border-[#2A3038] rounded-md space-y-2">
                <div className="flex items-center gap-2 text-[#D6A23D] font-medium text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D6A23D]" />
                  <span>PaymentRouter Contract Undeployed on Arc Testnet (Deployment Blocker)</span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                  The configured router address <code className="text-[#F3F4F6]">{routerAddress}</code> contains no deployed contract bytecode on Arc Testnet (Chain ID {ARC_TESTNET_CHAIN_ID}). Transactions cannot be executed against an undeployed address.
                </p>
                <div className="p-2.5 bg-[#0B0D10] border border-[#2A3038] rounded-md text-[10px] text-[#737B87] space-y-1 font-mono">
                  <div className="text-[#F3F4F6] font-sans font-medium">To Deploy PaymentRouter:</div>
                  <div>1. Verify 27 tests: <span className="text-[#D6A23D]">npm run contracts:test</span></div>
                  <div>2. Deploy: <span className="text-[#D6A23D]">npm run compass:deploy PaymentRouter ...</span></div>
                  <div>3. Configure the deployed address in Router Config above</div>
                </div>
              </div>
            ) : needsApproval ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApprovePending || isApproveConfirming || hasInsufficientBalance}
                className="w-full py-2.5 px-4 rounded-md font-semibold text-xs text-[#0B0D10] bg-[#D6A23D] hover:bg-[#C29132] transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isApprovePending || isApproveConfirming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving USDC Allowance...</span>
                  </>
                ) : (
                  <>
                    <span>Step 1: Approve {amountStr} USDC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={
                  isPayPending ||
                  isPayConfirming ||
                  !isAddress(merchant) ||
                  parsedAmount <= 0n ||
                  hasInsufficientBalance
                }
                className="w-full py-2.5 px-4 rounded-md font-semibold text-xs text-[#0B0D10] bg-[#D6A23D] hover:bg-[#C29132] transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isPayPending || isPayConfirming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing USDC Transfer on Arc...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay {amountStr} USDC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {/* Error notifications */}
            {(approveError || payError) && (
              <div className="mt-3 p-3 bg-[#191D23] border border-[#2A3038] rounded-md text-xs text-[#EF4444]">
                <p className="font-semibold mb-1">Transaction Failed:</p>
                <p className="font-mono text-[11px] truncate">
                  {(approveError || payError)?.message || 'Contract reverted.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info & Live Receipt Column */}
      <div className="lg:col-span-5 space-y-6">
        {/* Latest Payment Receipt */}
        {lastPayment ? (
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A3038]">
              <div className="w-7 h-7 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#22C55E]">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-semibold text-sm text-[#F3F4F6]">Confirmed Payment Receipt</h3>
            </div>

            <div className="space-y-2.5 text-xs bg-[#0B0D10] p-4 rounded-md border border-[#2A3038]">
              <div className="flex justify-between items-center pb-2 border-b border-[#2A3038]">
                <span className="text-[#737B87]">Status</span>
                <span className="px-2 py-0.5 rounded bg-[#191D23] text-[#22C55E] border border-[#2A3038] font-medium text-[10px]">
                  CONFIRMED (ON-CHAIN)
                </span>
              </div>
              <div>
                <span className="text-[#737B87] block mb-0.5">Payment ID:</span>
                <span className="font-mono text-[#F3F4F6] text-xs break-all">{lastPayment.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B87]">Amount Sent:</span>
                <span className="font-mono font-semibold text-[#F3F4F6]">{lastPayment.amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B87]">Merchant Recipient:</span>
                <span className="font-mono text-[#9CA3AF]">
                  {lastPayment.merchant.slice(0, 6)}...{lastPayment.merchant.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B87]">Payer (You):</span>
                <span className="font-mono text-[#9CA3AF]">
                  {lastPayment.payer.slice(0, 6)}...{lastPayment.payer.slice(-4)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#2A3038]">
                <a
                  href={`${EXPLORER_URL}/tx/${lastPayment.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D6A23D] hover:underline flex items-center gap-1 font-mono text-xs"
                >
                  View on Arc Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
            <h3 className="font-semibold text-sm text-[#F3F4F6] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D6A23D]" /> How CheetahPay Checkout Works
            </h3>
            <ul className="space-y-3 text-xs text-[#9CA3AF] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong className="text-[#F3F4F6]">Unique Payment ID:</strong> Each checkout has a deterministic 32-byte hash that locks the payment details on-chain.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong className="text-[#F3F4F6]">Direct Transfer:</strong> USDC moves straight from your wallet to the merchant’s address in one atomic transaction.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong className="text-[#F3F4F6]">Refund Enforceability:</strong> Only the verified merchant can issue refunds, and cannot refund more than the original amount.
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Security & Token Card */}
        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 text-xs text-[#737B87] space-y-2">
          <div className="flex justify-between">
            <span>Arc Chain ID:</span>
            <span className="font-mono text-[#F3F4F6]">5042002</span>
          </div>
          <div className="flex justify-between">
            <span>Official USDC Contract:</span>
            <span className="font-mono text-[#D6A23D]">0x3600...0000</span>
          </div>
          <div className="flex justify-between">
            <span>Decimals:</span>
            <span className="text-[#F3F4F6] font-mono">6 decimals</span>
          </div>
          <div className="flex justify-between">
            <span>Custody Model:</span>
            <span className="text-[#22C55E] font-medium">100% Non-Custodial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
