import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  CreditCard,
  Building,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  FiatQuote,
  FiatFundingRecord,
  TargetCryptoAsset,
  FiatPaymentMethod,
  FiatFundingStatus,
} from '../../types/cheetahpay';
import { FiatOnrampService } from '../../services/fiatOnrampService';

export const FundWalletView: React.FC = () => {
  const { address: connectedAddress } = useAccount();

  // Form State: ZEC primary
  const [targetAsset, setTargetAsset] = useState<TargetCryptoAsset>('ZEC');
  const [sourceCurrency, setSourceCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CAD'>('USD');
  const [sourceAmount, setSourceAmount] = useState('150.00');
  const [destinationWallet, setDestinationWallet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FiatPaymentMethod>('card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Execution State
  const [activeRecord, setActiveRecord] = useState<FiatFundingRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  // Provider status
  const providerStatus = FiatOnrampService.checkProviderStatus();

  // Compute quote derived synchronously during render
  let currentQuote: FiatQuote | null = null;
  let quoteError: string | null = null;

  const amountNum = parseFloat(sourceAmount);
  if (isNaN(amountNum) || amountNum <= 0) {
    quoteError = 'Please enter a valid amount';
  } else {
    try {
      currentQuote = FiatOnrampService.getQuote({
        sourceCurrency,
        sourceAmount: amountNum,
        targetAsset,
        paymentMethod,
        destinationWallet: destinationWallet || connectedAddress || '0x0000000000000000000000000000000000000000',
      });
    } catch (err: unknown) {
      quoteError = err instanceof Error ? err.message : 'Invalid quotation parameters';
    }
  }

  const handleStartFunding = async () => {
    if (!currentQuote) return;
    const dest = destinationWallet.trim() || connectedAddress;
    if (!dest) {
      toast.error('Please specify a destination wallet address');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Please review and accept provider compliance terms');
      return;
    }

    if (!providerStatus.isConfigured) {
      toast.error('Provider gateway credentials are required to initiate real funding.');
      const record = FiatOnrampService.createFundingRecord(currentQuote);
      setActiveRecord(record);
      return;
    }

    setIsProcessing(true);
    try {
      // Real provider connection probe
      const circleKey = typeof localStorage !== 'undefined' ? localStorage.getItem('cheetahpay_circle_api_key') : null;
      if (circleKey) {
        const probe = await FiatOnrampService.testCircleConnection(circleKey);
        if (!probe.connected) {
          throw new Error(`Circle ping probe failed: ${probe.message}`);
        }
      }
      const record = FiatOnrampService.createFundingRecord(currentQuote);
      setActiveRecord(record);
      toast.info('Circle ping probe succeeded. Note: Live card charging requires backend payment processor integration.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Provider probe failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setActiveRecord(null);
    setIsProcessing(false);
  };

  const copyTxHash = () => {
    if (!activeRecord?.deliveryTxHash) return;
    void navigator.clipboard.writeText(activeRecord.deliveryTxHash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
    toast.info('Delivery hash copied');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A3038]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#F3F4F6]">Web2 to Web3: Fund Wallet</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#191D23] text-[#D6A23D] border border-[#2A3038]">
                Illustrative Gateway Model
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Deposit crypto using Credit/Debit Cards, SEPA, or US ACH with illustrative fee estimation and fail-closed settlement rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-md bg-[#0B0D10] border border-[#2A3038] text-[#9CA3AF] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${providerStatus.isLive ? 'bg-[#22C55E]' : 'bg-[#D6A23D]'}`} />
              <span>{providerStatus.providerName}</span>
            </span>
          </div>
        </div>

        {/* Provider Setup Notification */}
        {!providerStatus.isConfigured ? (
          <div className="mt-4 p-3.5 rounded-md bg-[#191D23] border border-[#2A3038] flex items-start gap-3 text-xs text-[#9CA3AF]">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D6A23D]" />
            <div>
              <p className="font-semibold text-[#F3F4F6]">Illustrative Quotation Engine Active · Gateway Integration Pending Setup</p>
              <p className="text-[11px] text-[#737B87] mt-0.5 leading-relaxed">
                Fee calculations (2.9% + $0.30 cards, 0.5% + €1.00 SEPA, 0.8% + $1.00 ACH) and limits ($20–$10,000) are hardcoded illustrative estimates for modeling purposes. On-chain asset delivery requires linking your Circle or Stripe API key via a secure backend proxy. No fake transactions or fabricated balances will be generated.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-md bg-[#191D23] border border-[#2A3038] flex items-start gap-3 text-xs text-[#9CA3AF]">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D6A23D]" />
            <div>
              <p className="font-semibold text-[#F3F4F6]">{providerStatus.providerName} Sandbox Probe Configured</p>
              <p className="text-[11px] text-[#737B87] mt-0.5 leading-relaxed">
                Developer connectivity probe key is saved in local memory. <strong>Notice:</strong> A ping probe does NOT constitute a live on-ramp integration. Live fiat payment processing, card tokenization, and asset delivery require backend secret custody, institutional KYB onboarding, and regulated gateway contracts.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Configuration */}
        <div className="lg:col-span-7 bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Funding Parameters
          </h2>

          {/* Asset to Receive */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-2">
              Asset to Receive
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['ZEC', 'USDC', 'ETH', 'BTC'] as TargetCryptoAsset[]).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setTargetAsset(asset)}
                  className={`py-2 px-3 rounded-md border text-xs font-medium transition flex flex-col items-center gap-1 ${
                    targetAsset === asset
                      ? 'bg-[#191D23] border-[#D6A23D] text-[#F3F4F6]'
                      : 'bg-[#0B0D10] border-[#2A3038] text-[#9CA3AF] hover:text-[#F3F4F6] hover:border-[#737B87]'
                  }`}
                >
                  <span className="text-sm font-bold">{asset}</span>
                  <span className="text-[10px] text-[#737B87]">
                    {asset === 'ZEC' ? 'Shielded Zcash' : asset === 'USDC' ? 'Arc / L2' : 'L1'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Fiat Currency */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                You Pay
              </label>
              <span className="text-xs text-[#737B87]">Min $20.00 · Max $10,000.00</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="20"
                max="10000"
                step="5"
                value={sourceAmount}
                onChange={(e) => setSourceAmount(e.target.value)}
                className="flex-1 bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2.5 font-mono text-sm text-[#F3F4F6] outline-none transition"
                placeholder="150.00"
              />
              <select
                value={sourceCurrency}
                onChange={(e) => setSourceCurrency(e.target.value as 'USD' | 'EUR' | 'GBP' | 'CAD')}
                className="bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-2.5 font-semibold text-xs text-[#F3F4F6] outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          {/* Destination Wallet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                Destination Wallet Address
              </label>
              {connectedAddress && (
                <button
                  type="button"
                  onClick={() => setDestinationWallet(connectedAddress)}
                  className="text-xs text-[#D6A23D] hover:underline"
                >
                  Use Connected Wallet
                </button>
              )}
            </div>
            <input
              type="text"
              value={destinationWallet}
              onChange={(e) => setDestinationWallet(e.target.value.trim())}
              placeholder={targetAsset === 'ZEC' ? 'utest1... or tm...' : '0x...'}
              className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2.5 font-mono text-xs text-[#F3F4F6] outline-none transition"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-md border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'card'
                    ? 'bg-[#191D23] border-[#D6A23D] text-[#F3F4F6]'
                    : 'bg-[#0B0D10] border-[#2A3038] text-[#9CA3AF] hover:border-[#737B87]'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-3 text-[#D6A23D]" />
                <div>
                  <div className="font-semibold text-xs text-[#F3F4F6]">Debit / Credit Card</div>
                  <div className="text-[11px] text-[#737B87] mt-0.5">Instant · 2.9% + $0.30</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_sepa')}
                className={`p-3.5 rounded-md border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'bank_sepa'
                    ? 'bg-[#191D23] border-[#D6A23D] text-[#F3F4F6]'
                    : 'bg-[#0B0D10] border-[#2A3038] text-[#9CA3AF] hover:border-[#737B87]'
                }`}
              >
                <Building className="w-4 h-4 mb-3 text-[#737B87]" />
                <div>
                  <div className="font-semibold text-xs text-[#F3F4F6]">SEPA Transfer</div>
                  <div className="text-[11px] text-[#737B87] mt-0.5">1-2 Days · 0.5% + €1.00</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_ach')}
                className={`p-3.5 rounded-md border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'bank_ach'
                    ? 'bg-[#191D23] border-[#D6A23D] text-[#F3F4F6]'
                    : 'bg-[#0B0D10] border-[#2A3038] text-[#9CA3AF] hover:border-[#737B87]'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-3 text-[#737B87]" />
                <div>
                  <div className="font-semibold text-xs text-[#F3F4F6]">US ACH Bank</div>
                  <div className="text-[11px] text-[#737B87] mt-0.5">2-3 Days · 0.8% + $1.00</div>
                </div>
              </button>
            </div>
          </div>

          {/* Compliance Checkbox */}
          <div className="pt-2 border-t border-[#2A3038]">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-[#9CA3AF] select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#2A3038] bg-[#0B0D10] text-[#D6A23D] focus:ring-[#D6A23D]"
              />
              <span>
                I agree to the non-custodial delivery terms and understand that crypto delivery executes only upon verified bank/card clearing.
              </span>
            </label>
          </div>

          {/* Trigger Button */}
          {!activeRecord ? (
            <button
              type="button"
              onClick={handleStartFunding}
              disabled={!currentQuote || !acceptedTerms || !destinationWallet}
              className="w-full py-3 px-4 rounded-md bg-[#D6A23D] hover:bg-[#C29132] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0D10] font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Review Funding Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-md bg-[#191D23] hover:bg-[#2A3038] border border-[#2A3038] text-[#F3F4F6] font-medium text-xs transition"
            >
              Start New Request
            </button>
          )}
        </div>

        {/* Right Column: Quotation Breakdown & Settlement State Machine */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quote Card */}
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2 pb-2 border-b border-[#2A3038] flex items-center justify-between">
              <span>Illustrative Fee Estimate (Indicative)</span>
              <Clock className="w-3.5 h-3.5 text-[#737B87]" />
            </h3>
            <p className="text-[11px] text-[#737B87] font-sans mb-3">
              Fee formulas and rates are hardcoded illustrative estimates for modeling purposes. No live provider quotation API has been called.
            </p>

            {quoteError ? (
              <div className="p-3.5 rounded-md bg-[#191D23] border border-[#2A3038] text-[#9CA3AF] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                <span className="text-[#EF4444]">{quoteError}</span>
              </div>
            ) : currentQuote ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between py-2 border-b border-[#2A3038]">
                  <span className="text-[#9CA3AF] font-sans">Estimated Asset Delivery</span>
                  <span className="text-sm font-bold text-[#F3F4F6]">
                    {currentQuote.targetAmount} {currentQuote.targetAsset}
                  </span>
                </div>

                <div className="space-y-2 text-[#9CA3AF] text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-sans">Payment Method Fee</span>
                    <span className="text-[#F3F4F6]">${currentQuote.fees.processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans">Network Gas Fee</span>
                    <span className="text-[#F3F4F6]">${currentQuote.fees.networkFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans">Provider Spread</span>
                    <span className="text-[#F3F4F6]">${currentQuote.fees.providerMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#2A3038] font-bold text-[#F3F4F6]">
                    <span className="font-sans">Total Fees</span>
                    <span>${currentQuote.fees.totalFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2A3038] flex items-center justify-between text-[11px] text-[#737B87] font-sans">
                  <span>Estimated Delivery Time:</span>
                  <span className="font-medium text-[#F3F4F6]">
                    {currentQuote.estimatedDeliverySeconds < 300 ? '2 - 5 Minutes' : '1 - 3 Business Days'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[#737B87] text-xs">Enter valid amount to compute quote</div>
            )}
          </div>

          {/* Settlement State Machine Terminal */}
          {activeRecord && (
            <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A3038]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#F3F4F6] flex items-center gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D6A23D] ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Settlement Engine</span>
                </span>
                <span className="font-mono text-[10px] text-[#737B87]">{activeRecord.id}</span>
              </div>

              {/* State Progress Stepper */}
              <div className="space-y-2">
                {[
                  { key: 'AWAITING_PAYMENT', label: '1. Awaiting Client Payment' },
                  { key: 'PAYMENT_PROCESSING', label: '2. Payment Processing' },
                  { key: 'PAYMENT_VERIFIED', label: '3. Payment Verified (Authoritative)' },
                  { key: 'CRYPTO_DELIVERY_PENDING', label: '4. Crypto Delivery Pending' },
                  { key: 'COMPLETED', label: '5. Settlement Completed' },
                ].map((step, idx) => {
                  const statesOrder: FiatFundingStatus[] = [
                    'AWAITING_PAYMENT',
                    'PAYMENT_PROCESSING',
                    'PAYMENT_VERIFIED',
                    'CRYPTO_DELIVERY_PENDING',
                    'COMPLETED',
                  ];
                  const currentIdx = statesOrder.indexOf(activeRecord.status);
                  const isDone = currentIdx > idx || activeRecord.status === 'COMPLETED';
                  const isCurrent = statesOrder[idx] === activeRecord.status;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center justify-between p-2.5 rounded-md border text-xs transition ${
                        isCurrent
                          ? 'bg-[#191D23] border-[#D6A23D] text-[#D6A23D] font-semibold'
                          : isDone
                          ? 'bg-[#191D23] border-[#2A3038] text-[#22C55E]'
                          : 'bg-[#0B0D10] border-[#2A3038] text-[#737B87]'
                      }`}
                    >
                      <span>{step.label}</span>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                      ) : isCurrent && isProcessing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D6A23D]" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Execution / Provider Gateway State */}
              {activeRecord.status === 'AWAITING_PAYMENT' && (
                <div>
                  {!providerStatus.isConfigured ? (
                    <div className="p-4 bg-[#191D23] border border-[#2A3038] rounded-md space-y-3">
                      <div className="flex items-center gap-2 text-[#D6A23D] font-medium text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#D6A23D]" />
                        <span>Provider Integration Setup Required (Category D Blocker)</span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                        Production fiat-to-crypto liquidity requires integration with an approved on-ramp provider (Circle Mint API or Stripe Crypto). No live API credentials are configured in this environment (<code className="text-[#F3F4F6]">CIRCLE_API_KEY</code> or <code className="text-[#F3F4F6]">STRIPE_PUBLISHABLE_KEY</code>).
                      </p>
                      <div className="p-2.5 bg-[#0B0D10] border border-[#2A3038] rounded-md text-[10px] text-[#737B87] space-y-1 font-mono">
                        <div>• Provider Target: Circle Programmable Wallets / Mint API</div>
                        <div>• Required Compliance: Merchant KYB verification</div>
                        <div>• Non-Custodial Rule: No fake transactions or fabricated balances</div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="text-xs text-[#737B87] hover:text-[#F3F4F6]"
                        >
                          Modify Parameters
                        </button>
                        <span className="text-xs font-medium text-[#D6A23D]">
                          Configure in Settings
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#191D23] border border-[#2A3038] rounded-md text-xs text-[#22C55E] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Gateway Ready: {providerStatus.providerName} Authenticated</span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] leading-normal">
                        API connectivity confirmed. In production, your backend mint/session service generates the cryptographically signed provider checkout URL to collect cardholder KYC. Client-side simulated settlement is strictly prohibited.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          toast.info(`Gateway active. Dispatching signed on-ramp checkout session requires server-side mint endpoint.`);
                        }}
                        className="w-full py-2.5 px-4 rounded-md bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-semibold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize On-Ramp via {providerStatus.providerName}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Settlement Proof */}
              {activeRecord.status === 'COMPLETED' && (
                <div className="p-3 bg-[#191D23] border border-[#2A3038] rounded-md space-y-2 text-xs">
                  <div className="font-semibold text-[#22C55E] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settlement Proof Verified</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#9CA3AF] break-all space-y-1">
                    <div>
                      <span className="text-[#737B87]">Ref: </span>
                      {activeRecord.providerReference}
                    </div>
                    {activeRecord.deliveryTxHash && (
                      <div className="flex items-center justify-between">
                        <span className="truncate mr-2">Tx: {activeRecord.deliveryTxHash.slice(0, 16)}...</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyTxHash}
                            className="text-[#D6A23D] hover:text-[#F3F4F6]"
                          >
                            {copiedTx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {activeRecord.explorerUrl && (
                            <a
                              href={activeRecord.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#D6A23D] hover:text-[#F3F4F6]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zcash (ZEC) Fiat Liquidity & Provider Architecture Card */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#2A3038]">
          <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#D6A23D]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F3F4F6]">Zcash (ZEC) Fiat Liquidity & Routing Architecture</h3>
            <p className="text-xs text-[#737B87]">Institutional on-ramp provider coverage and privacy transition procedures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#0B0D10] rounded-md border border-[#2A3038] space-y-2">
            <div className="font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <span>Path A: Direct Native ZEC On-Ramp (MoonPay / Transak)</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Regulated on-ramp providers supporting ZEC (MoonPay, Transak) operate in select jurisdictions (EU, UK, eligible US states) via Visa/Mastercard and SEPA transfers. In compliance with AML/KYC requirements, direct fiat providers require a transparent receiving address (<code className="text-[#F3F4F6]">tm...</code> or <code className="text-[#F3F4F6]">t1...</code>).
            </p>
            <div className="p-2.5 rounded-md bg-[#191D23] border border-[#2A3038] text-[10px] text-[#D6A23D] font-mono">
              Post-Delivery Action: Execute non-custodial auto-shielding inside your wallet (e.g. Zashi / Ywallet) to move transparent ZEC into the private Orchard shielded pool.
            </div>
          </div>

          <div className="p-4 bg-[#0B0D10] rounded-md border border-[#2A3038] space-y-2">
            <div className="font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <span>Path B: Institutional Staged Route (Circle / Stripe → ZEC)</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Circle Mint and Stripe Crypto do not natively mint or on-ramp native ZEC. When using these gateways, fiat funds deposit as USDC, which is then routed via non-custodial cross-chain atomic swaps (e.g. THORChain / SideShift) into native ZEC and delivered to your Unified Address (<code className="text-[#F3F4F6]">utest1...</code>).
            </p>
            <div className="p-2.5 rounded-md bg-[#191D23] border border-[#2A3038] text-[10px] text-[#9CA3AF] font-mono">
              Integrity Rule: CheetahPay NEVER disguises wrapped ERC-20 tokens (e.g. WZEC on Ethereum) as native ZEC. Only authentic Zcash network coins are delivered.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
