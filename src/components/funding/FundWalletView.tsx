import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  CreditCard,
  Building,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  FiatQuote,
  TargetCryptoAsset,
  FiatPaymentMethod,
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
  const [acknowledgedDemo, setAcknowledgedDemo] = useState(false);
  const [, setHasCalculated] = useState(false);

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
        destinationWallet: destinationWallet.trim() || connectedAddress || '0x0000000000000000000000000000000000000000',
      });
    } catch (err: unknown) {
      quoteError = err instanceof Error ? err.message : 'Invalid quotation parameters';
    }
  }

  const handleCalculateEstimate = () => {
    if (!currentQuote) {
      toast.error(quoteError || 'Please enter an amount between $20.00 and $10,000.00');
      return;
    }
    if (!acknowledgedDemo) {
      toast.error('Please acknowledge that this is an illustrative demo estimate and live funding is unavailable.');
      return;
    }
    setHasCalculated(true);
    toast.success('Demo estimate calculated (Demo estimate — not a live quote)');
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
                Demo Calculator
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Illustrative fee and conversion calculator. Model crypto deposits using Credit/Debit Cards, SEPA, or US ACH.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-md bg-[#0B0D10] border border-[#2A3038] text-[#9CA3AF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D6A23D]" />
              <span>Live funding unavailable</span>
            </span>
          </div>
        </div>

        {/* Live Funding Unavailable Notification */}
        <div className="mt-4 p-4 rounded-md bg-[#191D23] border border-[#2A3038] flex items-start gap-3 text-xs text-[#9CA3AF]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D6A23D]" />
          <div className="space-y-1">
            <p className="font-semibold text-[#F3F4F6]">Live Funding Unavailable · Illustrative Demo Calculator Only</p>
            <p className="text-[11px] text-[#737B87] leading-relaxed">
              No live fiat-to-crypto gateway provider is connected. All exchange rates, fees (2.9% + $0.30 cards, 0.5% + €1.00 SEPA, 0.8% + $1.00 ACH), and delivery estimates are <strong>Demo estimate — not a live quote</strong>. No payment order, settlement intent, or balance is created, and no real funds will be charged or delivered.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Configuration */}
        <div className="lg:col-span-7 bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#2A3038]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Demo Calculation Parameters
            </h2>
            <span className="text-[10px] text-[#D6A23D] font-mono">
              Simulation Only
            </span>
          </div>

          {/* Asset to Receive */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-2">
              Asset to Model
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
                Hypothetical Amount
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                Destination Wallet Address (Optional)
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
            <p className="text-[11px] text-[#737B87] mb-2 leading-tight">
              Used solely to format estimate parameters. Entering an address does <strong>not</strong> initiate a transfer or lock funds.
            </p>
            <input
              type="text"
              value={destinationWallet}
              onChange={(e) => setDestinationWallet(e.target.value.trim())}
              placeholder={targetAsset === 'ZEC' ? 'utest1... or tm... (optional for demo estimate)' : '0x... (optional for demo estimate)'}
              className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2.5 font-mono text-xs text-[#F3F4F6] outline-none transition"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-2">
              Select Hypothetical Payment Rail
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
                  <div className="text-[10px] text-[#D6A23D] mt-1 font-mono">Demo estimate — not a live quote</div>
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
                  <div className="text-[10px] text-[#D6A23D] mt-1 font-mono">Demo estimate — not a live quote</div>
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
                  <div className="text-[10px] text-[#D6A23D] mt-1 font-mono">Demo estimate — not a live quote</div>
                </div>
              </button>
            </div>
          </div>

          {/* Demo Acknowledgment Checkbox */}
          <div className="pt-2 border-t border-[#2A3038]">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-[#9CA3AF] select-none">
              <input
                type="checkbox"
                checked={acknowledgedDemo}
                onChange={(e) => setAcknowledgedDemo(e.target.checked)}
                className="mt-0.5 rounded border-[#2A3038] bg-[#0B0D10] text-[#D6A23D] focus:ring-[#D6A23D]"
              />
              <span className="leading-relaxed">
                I understand this is an illustrative demo estimate. Live funding is unavailable, no funds will be collected or charged, and no cryptocurrency will be delivered.
              </span>
            </label>
          </div>

          {/* Trigger Button */}
          <button
            type="button"
            onClick={handleCalculateEstimate}
            disabled={!currentQuote}
            className="w-full py-3 px-4 rounded-md bg-[#D6A23D] hover:bg-[#C29132] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0D10] font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Calculate Demo Estimate</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Quotation Breakdown & Status Safeguards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quote Card */}
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#2A3038]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Illustrative Fee Calculator
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#191D23] text-[#D6A23D] border border-[#2A3038]">
                Demo estimate — not a live quote
              </span>
            </div>
            <p className="text-[11px] text-[#737B87] font-sans mb-3 leading-relaxed">
              Fee formulas and rates are hardcoded illustrative estimates for modeling purposes. No live provider quotation API has been queried.
            </p>

            {quoteError ? (
              <div className="p-3.5 rounded-md bg-[#191D23] border border-[#2A3038] text-[#9CA3AF] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                <span className="text-[#EF4444]">{quoteError}</span>
              </div>
            ) : currentQuote ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex flex-col py-2 border-b border-[#2A3038]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF] font-sans">Estimated Asset Delivery</span>
                    <span className="text-sm font-bold text-[#F3F4F6]">
                      ~{currentQuote.targetAmount} {currentQuote.targetAsset}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#D6A23D] self-end mt-0.5">
                    Demo estimate — not a live quote
                  </span>
                </div>

                <div className="space-y-2.5 text-[#9CA3AF] text-[11px]">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans">Payment Method Fee</span>
                      <span className="text-[#F3F4F6]">${currentQuote.fees.processingFee.toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] text-[#737B87] self-end">Demo estimate — not a live quote</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans">Network Gas Fee</span>
                      <span className="text-[#F3F4F6]">${currentQuote.fees.networkFee.toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] text-[#737B87] self-end">Demo estimate — not a live quote</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans">Provider Spread (0.4%)</span>
                      <span className="text-[#F3F4F6]">${currentQuote.fees.providerMargin.toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] text-[#737B87] self-end">Demo estimate — not a live quote</span>
                  </div>

                  <div className="flex flex-col gap-0.5 pt-2 border-t border-[#2A3038]">
                    <div className="flex items-center justify-between font-bold text-[#F3F4F6]">
                      <span className="font-sans">Total Estimated Fees</span>
                      <span>${currentQuote.fees.totalFee.toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] text-[#D6A23D] self-end font-semibold">Demo estimate — not a live quote</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2A3038] space-y-1.5 text-[11px] text-[#737B87] font-sans">
                  <div className="flex items-center justify-between">
                    <span>Estimated Delivery Window:</span>
                    <span className="font-medium text-[#F3F4F6]">
                      {currentQuote.estimatedDeliverySeconds < 300 ? '2 - 5 Minutes' : '1 - 3 Business Days'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#D6A23D] text-right font-mono">
                    Demo estimate — not a live quote
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span>Reference Exchange Rate:</span>
                    <span className="font-medium text-[#F3F4F6] font-mono">
                      1 {currentQuote.targetAsset} = ${currentQuote.exchangeRate.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="text-[10px] text-[#D6A23D] text-right font-mono">
                    Demo estimate — not a live quote
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[#737B87] text-xs">Enter valid amount to compute quote</div>
            )}
          </div>

          {/* Live Funding Status & Safeguards Card */}
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3038]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F3F4F6] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D6A23D]" />
                <span>Live Funding Status: Unavailable</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#191D23] text-[#737B87] border border-[#2A3038]">
                No Order Created
              </span>
            </div>

            <div className="p-4 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-3">
              <div className="text-xs text-[#F3F4F6] font-semibold">
                Demonstration Invariants & Financial Safeguards
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                CheetahPay enforces a strict fail-closed policy. Because no production payment provider (Circle Mint, Stripe Crypto, MoonPay) is configured in this deployment:
              </p>
              <div className="p-3 bg-[#191D23] border border-[#2A3038] rounded-md text-[10px] text-[#737B87] space-y-1.5 font-mono">
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <span className="text-[#D6A23D]">•</span>
                  <span>No payment order or settlement reference generated</span>
                </div>
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <span className="text-[#D6A23D]">•</span>
                  <span>Zero fiat funds collected, debited, or charged</span>
                </div>
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <span className="text-[#D6A23D]">•</span>
                  <span>Zero crypto delivered or transferred to destination</span>
                </div>
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <span className="text-[#D6A23D]">•</span>
                  <span>Destination address used solely for estimate calculation</span>
                </div>
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <span className="text-[#D6A23D]">•</span>
                  <span>No fake balances or simulated settlement hashes created</span>
                </div>
              </div>

              <div className="text-[11px] text-[#737B87] leading-relaxed pt-1">
                To enable live fiat-to-crypto processing, an institutional merchant requires corporate KYB verification, MSB licensing, regulated gateway agreements, and secure server-side session minting.
              </div>
            </div>
          </div>
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
