import type {
  FiatQuoteRequest,
  FiatQuote,
  FiatFundingRecord,
  FiatFundingStatus,
  TargetCryptoAsset,
} from '../types/cheetahpay.ts';

const STORAGE_FUNDING_KEY = 'cheetahpay_fiat_funding_records';
const inMemoryFundingRecords: Map<string, FiatFundingRecord> = new Map();

// Reference exchange rates (Base USD)
const ASSET_RATES: Record<TargetCryptoAsset, number> = {
  USDC: 1.0,
  ZEC: 32.5,
  ETH: 2650.0,
  BTC: 68500.0,
};

// Currency conversion to USD
const FIAT_TO_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.29,
  CAD: 0.72,
};

// Network delivery fee estimates (in USD)
const NETWORK_FEES_USD: Record<TargetCryptoAsset, number> = {
  USDC: 0.05, // Arc Testnet L2 USDC is ultra-low gas
  ZEC: 0.001, // Zcash network fee standard 0.0001 ZEC (~$0.003)
  ETH: 1.25,
  BTC: 2.10,
};

export class FiatOnrampService {
  /**
   * Check whether live provider credentials (e.g. Circle / Stripe / MoonPay) are configured.
   */
  public static checkProviderStatus() {
    const hasCircleKey = Boolean(
      (typeof process !== 'undefined' && process.env?.CIRCLE_API_KEY) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('cheetahpay_circle_api_key'))
    );
    const hasStripeKey = Boolean(
      (typeof process !== 'undefined' && process.env?.STRIPE_PUBLISHABLE_KEY) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('cheetahpay_stripe_key'))
    );

    return {
      providerName: hasCircleKey ? 'Circle On-Ramp' : hasStripeKey ? 'Stripe Crypto' : 'Unconfigured Gateway',
      isLive: hasCircleKey || hasStripeKey,
      isConfigured: hasCircleKey || hasStripeKey,
      hasCircleKey,
      hasStripeKey,
      blocker: !hasCircleKey && !hasStripeKey
        ? 'Missing CIRCLE_API_KEY or STRIPE_PUBLISHABLE_KEY. Fiat on-ramping requires institutional business verification and active gateway API credentials.'
        : null,
      settlementVerificationEngine: 'CheetahPay Authoritative Verifier v2.4',
    };
  }

  /**
   * Probe provider API connectivity directly.
   */
  public static async testCircleConnection(apiKey: string): Promise<{
    connected: boolean;
    statusCode: number;
    message: string;
  }> {
    if (!apiKey.trim()) {
      return {
        connected: false,
        statusCode: 400,
        message: 'No API key provided.',
      };
    }

    try {
      const response = await fetch('https://api.circle.com/v1/ping', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        return {
          connected: true,
          statusCode: response.status,
          message: 'Successfully authenticated with Circle API endpoint.',
        };
      } else {
        const body = await response.text();
        return {
          connected: false,
          statusCode: response.status,
          message: `Circle API rejected request: ${response.statusText} (${body.slice(0, 100)})`,
        };
      }
    } catch (err: unknown) {
      return {
        connected: false,
        statusCode: 0,
        message: err instanceof Error ? err.message : 'Network failure connecting to Circle API',
      };
    }
  }

  /**
   * Calculate institutional-grade quote with full fee transparency.
   */
  public static getQuote(req: FiatQuoteRequest): FiatQuote {
    const fiatMultiplier = FIAT_TO_USD_RATES[req.sourceCurrency] ?? 1.0;

    // Minimum $20, Maximum $10,000
    const minAmount = 20 / fiatMultiplier;
    const maxAmount = 10000 / fiatMultiplier;

    if (req.sourceAmount < minAmount) {
      throw new Error(`Minimum order amount is ${minAmount.toFixed(2)} ${req.sourceCurrency}`);
    }
    if (req.sourceAmount > maxAmount) {
      throw new Error(`Maximum order amount is ${maxAmount.toFixed(2)} ${req.sourceCurrency}`);
    }

    // Fee structure according to payment rail
    let processingFeePct = 0.029; // 2.9% standard card
    let processingFeeFixed = 0.30;

    if (req.paymentMethod === 'bank_sepa') {
      processingFeePct = 0.005; // 0.5%
      processingFeeFixed = 1.00;
    } else if (req.paymentMethod === 'bank_ach') {
      processingFeePct = 0.008; // 0.8%
      processingFeeFixed = 1.00;
    } else if (req.paymentMethod === 'apple_pay') {
      processingFeePct = 0.029;
      processingFeeFixed = 0.30;
    }

    const processingFee = Number((req.sourceAmount * processingFeePct + processingFeeFixed).toFixed(2));
    const providerMargin = Number((req.sourceAmount * 0.004).toFixed(2)); // 0.4% institutional spread
    const networkFee = Number((NETWORK_FEES_USD[req.targetAsset] / fiatMultiplier).toFixed(2));
    const totalFee = Number((processingFee + providerMargin + networkFee).toFixed(2));

    const netFiatToConvert = Math.max(0, req.sourceAmount - totalFee);
    const netUsdToConvert = netFiatToConvert * fiatMultiplier;
    const targetAssetPriceUsd = ASSET_RATES[req.targetAsset];
    const targetAmountRaw = netUsdToConvert / targetAssetPriceUsd;

    // Precision formatting
    const targetAmount = req.targetAsset === 'USDC'
      ? Number(targetAmountRaw.toFixed(2))
      : Number(targetAmountRaw.toFixed(6));

    const estimatedDeliverySeconds = req.paymentMethod.startsWith('bank') ? 86400 : 180;

    const id = `QUOTE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minute validity
      sourceCurrency: req.sourceCurrency,
      sourceAmount: req.sourceAmount,
      targetAsset: req.targetAsset,
      targetAmount,
      exchangeRate: targetAssetPriceUsd / fiatMultiplier,
      fees: {
        processingFee,
        networkFee,
        providerMargin,
        totalFee,
      },
      paymentMethod: req.paymentMethod,
      destinationWallet: req.destinationWallet,
      estimatedDeliverySeconds,
      minAmount,
      maxAmount,
    };
  }

  /**
   * Create an initial funding record in CREATED state.
   */
  public static createFundingRecord(quote: FiatQuote): FiatFundingRecord {
    const statusInfo = this.checkProviderStatus();
    const id = `FUND-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const providerRef = statusInfo.isLive
      ? `pending_session_${id}`
      : `unconfigured_gateway_${id}`;

    const record: FiatFundingRecord = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      quote,
      status: 'AWAITING_PAYMENT',
      provider: statusInfo.isLive ? 'circle' : 'sandbox',
      providerReference: providerRef,
    };

    this.saveRecord(record);
    return record;
  }

  /**
   * Transition state machine following strict financial settlement flow.
   */
  public static transitionState(
    record: FiatFundingRecord,
    nextState: FiatFundingStatus,
    extra?: Partial<FiatFundingRecord>
  ): FiatFundingRecord {
    // Valid transitions
    const validTransitions: Record<FiatFundingStatus, FiatFundingStatus[]> = {
      CREATED: ['QUOTED', 'CANCELLED'],
      QUOTED: ['AWAITING_PAYMENT', 'EXPIRED', 'CANCELLED'],
      AWAITING_PAYMENT: ['PAYMENT_PROCESSING', 'CANCELLED', 'EXPIRED', 'FAILED'],
      PAYMENT_PROCESSING: ['PAYMENT_VERIFIED', 'FAILED', 'REQUIRES_ACTION'],
      PAYMENT_VERIFIED: ['CRYPTO_DELIVERY_PENDING', 'FAILED'],
      CRYPTO_DELIVERY_PENDING: ['COMPLETED', 'FAILED'],
      COMPLETED: [],
      FAILED: ['AWAITING_PAYMENT'], // Allow retry
      CANCELLED: [],
      EXPIRED: [],
      REQUIRES_ACTION: ['PAYMENT_PROCESSING', 'CANCELLED', 'FAILED'],
    };

    const allowed = validTransitions[record.status];
    if (!allowed || !allowed.includes(nextState)) {
      throw new Error(`Invalid state transition from ${record.status} to ${nextState}`);
    }

    const updated: FiatFundingRecord = {
      ...record,
      ...extra,
      status: nextState,
      updatedAt: Date.now(),
    };

    if (extra?.deliveryTxHash) {
      updated.deliveryTxHash = extra.deliveryTxHash;
      updated.explorerUrl = record.quote.targetAsset === 'USDC'
        ? `https://explorer.testnet.arc.io/tx/${extra.deliveryTxHash}`
        : record.quote.targetAsset === 'ZEC'
        ? `https://sochain.com/testnet/zec/tx/${extra.deliveryTxHash}`
        : `https://sepolia.etherscan.io/tx/${extra.deliveryTxHash}`;
    }

    if (extra?.proofOfSettlement) {
      updated.proofOfSettlement = extra.proofOfSettlement;
    }

    this.saveRecord(updated);
    return updated;
  }

  public static getSavedRecords(): FiatFundingRecord[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_FUNDING_KEY);
        if (data) return JSON.parse(data) as FiatFundingRecord[];
      }
    } catch {
      // fallback to memory
    }
    return Array.from(inMemoryFundingRecords.values());
  }

  public static saveRecord(record: FiatFundingRecord): void {
    inMemoryFundingRecords.set(record.id, record);
    try {
      if (typeof localStorage !== 'undefined') {
        const records = this.getSavedRecords();
        const filtered = records.filter((r) => r.id !== record.id);
        localStorage.setItem(STORAGE_FUNDING_KEY, JSON.stringify([record, ...filtered].slice(0, 50)));
      }
    } catch (e) {
      console.error('Failed to save fiat funding record', e);
    }
  }
}
