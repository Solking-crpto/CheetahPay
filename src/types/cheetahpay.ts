import type { Address } from 'viem';

export type MainNavigationTab =
  | 'overview'
  | 'fund'
  | 'pay-zcash'
  | 'invoices'
  | 'transactions'
  | 'settings'
  | 'legacy-arc';

export type PaymentRail = 'fiat-onramp' | 'arc-usdc' | 'zcash-shield';

/* ==========================================================================
   Web2 -> Web3: Fiat Funding Types
   ========================================================================== */

export type FiatFundingStatus =
  | 'CREATED'
  | 'QUOTED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_VERIFIED'
  | 'CRYPTO_DELIVERY_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REQUIRES_ACTION';

export type FiatPaymentMethod = 'card' | 'bank_sepa' | 'bank_ach' | 'apple_pay';

export type TargetCryptoAsset = 'USDC' | 'ZEC' | 'ETH' | 'BTC';

export interface FiatQuoteRequest {
  sourceCurrency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  sourceAmount: number;
  targetAsset: TargetCryptoAsset;
  paymentMethod: FiatPaymentMethod;
  destinationWallet: string;
}

export interface FiatFeeBreakdown {
  processingFee: number;
  networkFee: number;
  providerMargin: number;
  totalFee: number;
}

export interface FiatQuote {
  id: string;
  createdAt: number;
  expiresAt: number;
  sourceCurrency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  sourceAmount: number;
  targetAsset: TargetCryptoAsset;
  targetAmount: number;
  exchangeRate: number;
  fees: FiatFeeBreakdown;
  paymentMethod: FiatPaymentMethod;
  destinationWallet: string;
  estimatedDeliverySeconds: number;
  minAmount: number;
  maxAmount: number;
}

export interface FiatFundingRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  quote: FiatQuote;
  status: FiatFundingStatus;
  provider: 'circle' | 'stripe' | 'moonpay' | 'sandbox';
  providerReference: string;
  deliveryTxHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  proofOfSettlement?: {
    verifiedAt: number;
    verifier: string;
    settlementBatchId?: string;
  };
}

/* ==========================================================================
   CheetahPay Shield: Zcash Checkout Types
   ========================================================================== */

export type ZcashNetwork = 'testnet' | 'mainnet';

export type ZcashAddressType =
  | 'shielded_unified'
  | 'shielded_sapling'
  | 'transparent';

export type ZcashPaymentStatus =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'AWAITING_WALLET_VERIFICATION'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

export interface ZcashPrivacyRating {
  addressType: ZcashAddressType;
  isShielded: boolean;
  capabilityLevel:
    | 'Shielded Receiver Capable (Unified)'
    | 'Shielded Receiver Capable (Sapling)'
    | 'Transparent Only (Public Ledger)';
  level: string;
  transactionPrivacyNotice: string;
  description: string;
  metadataVisibility: {
    senderAddress: 'Concealed (if sender shields)' | 'Public';
    recipientAddress: 'Concealed by receiver pool' | 'Public';
    amount: 'Encrypted in note (if shielded)' | 'Public';
    memoData: 'Encrypted 512-byte payload (if shielded)' | 'Public / Not Supported';
  };
}

export interface ZcashVerificationResult {
  found: boolean;
  confirmations: number;
  blockNumber?: number;
  networkTime?: number;
  raw?: unknown;
  error?: string;
  settlementScope: 'transparent_verified' | 'shielded_cryptographic_inclusion' | 'unconfirmed' | 'mismatch';
  detailsMessage: string;
  matchedTransparentOutput?: {
    address: string;
    value: string;
  };
}

export interface ZcashInvoice {
  invoiceId: string;
  createdAt: number;
  expiresAt: number;
  merchantAddress: string;
  addressType: ZcashAddressType;
  amountZec: string;
  amountUsd: string;
  memo: string;
  encodedMemoHex?: string;
  zip321Uri: string;
  itemDescription: string;
  merchantName: string;
  network: ZcashNetwork;
  status: ZcashPaymentStatus;
  txid?: string;
  confirmations: number;
  requiredConfirmations: number;
  blockHeight?: number;
  explorerUrl?: string;
  settlementDetails?: string;
  verificationScope?: 'transparent_verified' | 'shielded_cryptographic_inclusion' | 'unconfirmed' | 'mismatch';
}

/* ==========================================================================
   Unified Cross-Rail Transaction Model
   ========================================================================== */

export interface UnifiedTransaction {
  id: string;
  timestamp: number;
  rail: PaymentRail;
  type: 'deposit' | 'merchant-payment' | 'refund' | 'shield-payment';
  sourceAsset: string;
  targetAsset: string;
  sourceAmount: string;
  targetAmount: string;
  fromAddress: string;
  toAddress: string;
  status: 'Completed' | 'Pending' | 'Confirming' | 'Refunded' | 'Failed';
  txHash?: string;
  explorerUrl?: string;
  memoOrReference?: string;
  provenance: 'onchain-verified' | 'provider-pending' | 'network-pending' | 'invoice-created' | 'sandbox-simulation';
}

/* ==========================================================================
   Provider & System Configuration
   ========================================================================== */

export interface SystemConfig {
  fiatOnramp: {
    provider: 'circle' | 'stripe' | 'moonpay' | 'sandbox';
    isSandbox: boolean;
    apiKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
  };
  zcash: {
    network: ZcashNetwork;
    defaultMerchantUnifiedAddress: string;
    defaultMerchantTransparentAddress: string;
    testnetExplorerUrl: string;
    mainnetExplorerUrl: string;
    requiredConfirmations: number;
  };
  arcRouter: {
    address: Address;
    chainId: number;
    usdcAddress: Address;
    explorerUrl: string;
    rpcUrl: string;
  };
}
