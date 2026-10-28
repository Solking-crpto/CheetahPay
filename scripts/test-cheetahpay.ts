import assert from 'node:assert/strict';
import { FiatOnrampService } from '../src/services/fiatOnrampService.ts';
import {
  ZcashShieldService,
  ZEC_DEFAULT_TESTNET_UNIFIED,
  ZEC_DEFAULT_TESTNET_TRANSPARENT,
} from '../src/services/zcashShieldService.ts';
import { TransactionLedger } from '../src/services/transactionLedger.ts';

console.log('Starting CheetahPay Multi-Rail Automated Test Suite...\n');

/* ==========================================================================
   1. FiatOnrampService Tests
   ========================================================================== */
console.log('1. Testing FiatOnrampService Quote Engine...');

// Test 1: Minimum Limit Rejection
assert.throws(
  () => {
    FiatOnrampService.getQuote({
      sourceCurrency: 'USD',
      sourceAmount: 10, // Below $20 minimum
      targetAsset: 'USDC',
      paymentMethod: 'card',
      destinationWallet: '0x1234567890123456789012345678901234567890',
    });
  },
  /Minimum order amount is 20.00 USD/,
  'Should reject amounts below minimum limit'
);

// Test 2: Maximum Limit Rejection
assert.throws(
  () => {
    FiatOnrampService.getQuote({
      sourceCurrency: 'USD',
      sourceAmount: 15000, // Above $10,000 maximum
      targetAsset: 'USDC',
      paymentMethod: 'card',
      destinationWallet: '0x1234567890123456789012345678901234567890',
    });
  },
  /Maximum order amount is 10000.00 USD/,
  'Should reject amounts above maximum limit'
);

// Test 3: Card Fee Calculation ($100 order: 2.9% + $0.30 = $3.20 processing fee)
const cardQuote = FiatOnrampService.getQuote({
  sourceCurrency: 'USD',
  sourceAmount: 100,
  targetAsset: 'USDC',
  paymentMethod: 'card',
  destinationWallet: '0x1234567890123456789012345678901234567890',
});
assert.equal(cardQuote.fees.processingFee, 3.20, 'Card processing fee should match 2.9% + $0.30');
assert.equal(cardQuote.fees.providerMargin, 0.40, 'Provider margin should be 0.4% ($0.40)');
assert.ok(cardQuote.targetAmount > 90 && cardQuote.targetAmount < 100, 'Net USDC target amount is correct');
assert.ok(cardQuote.expiresAt > Date.now(), 'Quote should set future expiration time');
console.log('  ✓ Quote calculations and limits verified.');

// Test 4: Fiat State Machine Transitions
console.log('\n2. Testing Fiat Settlement State Machine...');
const fundingRecord = FiatOnrampService.createFundingRecord(cardQuote);
assert.equal(fundingRecord.status, 'AWAITING_PAYMENT');

// Disallow skipping directly to COMPLETED
assert.throws(
  () => {
    FiatOnrampService.transitionState(fundingRecord, 'COMPLETED');
  },
  /Invalid state transition from AWAITING_PAYMENT to COMPLETED/,
  'Should reject skipping verification steps'
);

// Valid progression: AWAITING_PAYMENT -> PAYMENT_PROCESSING -> PAYMENT_VERIFIED -> CRYPTO_DELIVERY_PENDING -> COMPLETED
let state = FiatOnrampService.transitionState(fundingRecord, 'PAYMENT_PROCESSING');
assert.equal(state.status, 'PAYMENT_PROCESSING');

state = FiatOnrampService.transitionState(state, 'PAYMENT_VERIFIED');
assert.equal(state.status, 'PAYMENT_VERIFIED');

state = FiatOnrampService.transitionState(state, 'CRYPTO_DELIVERY_PENDING');
assert.equal(state.status, 'CRYPTO_DELIVERY_PENDING');

state = FiatOnrampService.transitionState(state, 'COMPLETED', {
  deliveryTxHash: `0x${'a'.repeat(64)}`,
  proofOfSettlement: {
    verifiedAt: Date.now(),
    verifier: 'Circle Mint Authoritative Ledger',
    settlementBatchId: 'BATCH-TEST-001',
  },
});
assert.equal(state.status, 'COMPLETED');
assert.ok(state.deliveryTxHash && state.deliveryTxHash.startsWith('0x'), 'Completed record must have delivery tx hash');
assert.ok(state.proofOfSettlement?.verifier, 'Completed record must have verified proof of settlement');
console.log('  ✓ Strict fail-closed state transitions and settlement proof verified.');

/* ==========================================================================
   2. ZcashShieldService Tests
   ========================================================================== */
console.log('\n3. Testing ZcashShieldService Address Classification & Privacy Analysis...');

// Unified Testnet
const unifiedTest = ZcashShieldService.classifyAddress(ZEC_DEFAULT_TESTNET_UNIFIED);
assert.equal(unifiedTest.addressType, 'shielded_unified');
assert.equal(unifiedTest.network, 'testnet');
assert.equal(unifiedTest.isValid, true);

// Sapling Mainnet
const saplingMain = ZcashShieldService.classifyAddress('zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8emcvtqp9ccytnhfil6x0x signature_test_76_chars_sample_1234567890');
assert.equal(saplingMain.addressType, 'shielded_sapling');
assert.equal(saplingMain.network, 'mainnet');

// Transparent Testnet
const transparentTest = ZcashShieldService.classifyAddress(ZEC_DEFAULT_TESTNET_TRANSPARENT);
assert.equal(transparentTest.addressType, 'transparent');
assert.equal(transparentTest.network, 'testnet');
assert.equal(transparentTest.isValid, true);

// Privacy Rating Analysis: Unified must have shielded receiver capability with descriptive notice
const unifiedRating = ZcashShieldService.getPrivacyRating(ZEC_DEFAULT_TESTNET_UNIFIED);
assert.equal(unifiedRating.isShielded, true);
assert.equal(unifiedRating.capabilityLevel, 'Shielded Receiver Capable (Unified)');
assert.ok(
  unifiedRating.transactionPrivacyNotice.includes('Shielded address format — transaction privacy not yet verified'),
  'Notice must explicitly state transaction privacy is not yet verified'
);
assert.ok(unifiedRating.metadataVisibility.amount.includes('Encrypted'));
assert.ok(unifiedRating.metadataVisibility.memoData.includes('Encrypted'));

// Privacy Rating Analysis: Transparent address MUST NOT claim shielded (public metadata)
const transparentRating = ZcashShieldService.getPrivacyRating(ZEC_DEFAULT_TESTNET_TRANSPARENT);
assert.equal(transparentRating.isShielded, false, 'Transparent address must never be marked shielded');
assert.equal(transparentRating.capabilityLevel, 'Transparent Only (Public Ledger)');
assert.ok(
  transparentRating.transactionPrivacyNotice.includes('Transparent address format — all transaction metadata is public'),
  'Notice must clearly indicate public ledger visibility'
);
assert.equal(transparentRating.metadataVisibility.amount, 'Public');
assert.equal(transparentRating.metadataVisibility.senderAddress, 'Public');

// Rejection of invalid addresses
const invalidAddr = ZcashShieldService.classifyAddress('invalid_address_format');
assert.equal(invalidAddr.isValid, false, 'Invalid address must fail validation');
assert.ok(invalidAddr.error, 'Must provide reason for invalid address');

console.log('  ✓ Zcash address classification & strict transparent vs. shielded privacy guarantees verified.');

// Test ZIP-321 URI Generation & Parsing
console.log('\n4. Testing ZIP-321 Payment Request URI Generation & Parsing...');
const zipUri = ZcashShieldService.generateZip321Uri({
  address: ZEC_DEFAULT_TESTNET_UNIFIED,
  amountZec: '1.250000',
  memo: 'Order #CP-9021',
  message: 'Payment for API Access',
});

assert.ok(zipUri.startsWith(`zcash:${ZEC_DEFAULT_TESTNET_UNIFIED}`), 'URI must start with zcash:<address>');
assert.ok(zipUri.includes('amount=1.250000'), 'URI must encode requested amount');
assert.ok(zipUri.includes('memo='), 'URI must contain base64url encoded memo');
assert.ok(zipUri.includes('message=Payment%20for%20API%20Access'), 'URI must URL-encode message');

// Round-trip ZIP-321 Parsing
const parsed = ZcashShieldService.parseZip321Uri(zipUri);
assert.equal(parsed.isValid, true, 'Standard ZIP-321 URI must parse successfully');
assert.equal(parsed.address, ZEC_DEFAULT_TESTNET_UNIFIED, 'Parsed address must match generated address');
assert.equal(parsed.amountZec, '1.250000', 'Parsed amount must match generated amount');
assert.equal(parsed.memo, 'Order #CP-9021', 'Parsed base64url memo must decode to original text');
assert.equal(parsed.message, 'Payment for API Access', 'Parsed message must match');

// Fail-closed ZIP-321 Parsing tests
assert.equal(ZcashShieldService.parseZip321Uri('bitcoin:123').isValid, false, 'Non-zcash URI must fail');
assert.equal(ZcashShieldService.parseZip321Uri('zcash:').isValid, false, 'Empty address must fail');
assert.equal(ZcashShieldService.parseZip321Uri('zcash:tmP3A9Y4YqS4yN8D2qZ9yR4vT8mK6bL1x2Y?amount=invalid').isValid, false, 'Invalid amount must fail');
console.log('  ✓ ZIP-321 URI generation, parsing, and round-trip decoding verified.');

// Test Invoice Lifecycle & Confirmation Tracker
console.log('\n5. Testing Zcash Invoice Lifecycle & Confirmation Tracker...');
const inv = ZcashShieldService.createInvoice({
  merchantAddress: ZEC_DEFAULT_TESTNET_UNIFIED,
  amountZec: '0.750000',
  itemDescription: 'Annual License',
});
assert.equal(inv.status, 'AWAITING_PAYMENT');
assert.equal(inv.confirmations, 0);

const submitted = ZcashShieldService.submitPaymentTx(inv.invoiceId, '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');
assert.equal(submitted.status, 'SUBMITTED');
assert.ok(submitted.explorerUrl?.includes('sochain.com/testnet/zec/tx'), 'Must construct active SoChain testnet block explorer URL');

// Test network verification response for unbroadcasted / invalid hash
const netCheck = await ZcashShieldService.verifyTxOnNetwork('invalid_short_hash');
assert.equal(netCheck.found, false, 'Invalid hash should fail closed without confirming');
assert.ok(netCheck.error, 'Invalid hash should return descriptive error');

// Test network verification on real live Zcash Testnet transaction
// NOTE: Tx a8810b4b... is a mined testnet block reward transaction used specifically
// to verify live SoChain REST integration, block height parsing, and confirmation tracking.
// It proves network connectivity and live telemetry, not an end-to-end CheetahPay invoice payment.
const realTxCheck = await ZcashShieldService.verifyTxOnNetwork('a8810b4b9b0ad01336103dc8fb09936da2a7b25cee78e588edc381ad7872719f');
assert.equal(realTxCheck.found, true, 'Real Zcash Testnet transaction must be found on live network');
assert.ok(realTxCheck.confirmations > 0, 'Real transaction must have > 0 confirmations');
assert.equal(realTxCheck.blockNumber, 4548318, 'Block number must match authoritative block height');
assert.ok(realTxCheck.settlementScope, 'Must define settlementScope');

// Test Transparent Mismatch Detection (Fail-Closed)
// Create transparent invoice expecting a specific merchant address
const transparentInv = ZcashShieldService.createInvoice({
  merchantAddress: ZEC_DEFAULT_TESTNET_TRANSPARENT,
  amountZec: '10.000000',
  itemDescription: 'Hardware Order',
});
// Submit real testnet transaction whose output pays to a different address (tmTwLU5Y...)
ZcashShieldService.submitPaymentTx(transparentInv.invoiceId, 'a8810b4b9b0ad01336103dc8fb09936da2a7b25cee78e588edc381ad7872719f');
const { invoice: failedInvoice, verification: mismatchVerif } = await ZcashShieldService.verifyAndAdvanceInvoice(transparentInv.invoiceId);
assert.equal(mismatchVerif.settlementScope, 'mismatch', 'Must detect transparent recipient mismatch');
assert.equal(failedInvoice.status, 'FAILED', 'Transparent invoice with mismatch must fail closed');
assert.ok(failedInvoice.settlementDetails?.includes('Recipient mismatch'), 'Must record recipient mismatch reason');

// Test advancing shielded invoice with verified transaction inclusion
// Shielded notes cannot be decrypted by public explorers; therefore, status transitions to AWAITING_WALLET_VERIFICATION
ZcashShieldService.submitPaymentTx(inv.invoiceId, 'a8810b4b9b0ad01336103dc8fb09936da2a7b25cee78e588edc381ad7872719f');
const { invoice: verifiedInvoice, verification: shieldedVerif } = await ZcashShieldService.verifyAndAdvanceInvoice(inv.invoiceId);
assert.equal(verifiedInvoice.status, 'AWAITING_WALLET_VERIFICATION', 'Shielded invoice must transition to AWAITING_WALLET_VERIFICATION (not falsely CONFIRMED without wallet note decryption)');
assert.ok(verifiedInvoice.confirmations >= 3, 'Invoice must have >= 3 required confirmations');
assert.equal(shieldedVerif.settlementScope, 'shielded_cryptographic_inclusion', 'Shielded payment must report cryptographic inclusion');
assert.ok(verifiedInvoice.settlementDetails?.includes('zk-SNARKs'), 'Must document zk-SNARK note privacy boundary');

// Test Transparent Matching (Authoritative CONFIRMED)
// Transaction a8810b4b... pays 0.26041666 to tmTwLU5Y855hfBZ25ZaWuTvcrqjrCMFAZR9
const matchingTransparentInv = ZcashShieldService.createInvoice({
  merchantAddress: 'tmTwLU5Y855hfBZ25ZaWuTvcrqjrCMFAZR9',
  amountZec: '0.260416',
  itemDescription: 'Matched Transparent Order',
});
ZcashShieldService.submitPaymentTx(matchingTransparentInv.invoiceId, 'a8810b4b9b0ad01336103dc8fb09936da2a7b25cee78e588edc381ad7872719f');
const { invoice: confirmedTransparentInv, verification: matchVerif } = await ZcashShieldService.verifyAndAdvanceInvoice(matchingTransparentInv.invoiceId);
assert.equal(matchVerif.settlementScope, 'transparent_verified', 'Must authoritatively match transparent output');
assert.equal(confirmedTransparentInv.status, 'CONFIRMED', 'Matching transparent invoice must advance to CONFIRMED');
assert.ok(confirmedTransparentInv.settlementDetails?.includes('Output pays'), 'Must document transparent match details');

console.log('  ✓ Zcash invoice lifecycle, ZIP-321 parsing, transparent mismatch detection, and shielded verification logic verified.');

/* ==========================================================================
   3. TransactionLedger Tests
   ========================================================================== */
console.log('\n6. Testing Unified Transaction Ledger...');
const csv = TransactionLedger.exportToCsv();
assert.ok(csv.startsWith('ID,Timestamp,Rail,Type,Source Asset,Source Amount,Target Asset,Target Amount'), 'CSV headers must match schema');
console.log('  ✓ Ledger CSV export structure verified.');

console.log('\n======================================================');
console.log('ALL CHEETAHPAY MULTI-RAIL UNIT & INTEGRATION TESTS PASSED');
console.log('======================================================');
