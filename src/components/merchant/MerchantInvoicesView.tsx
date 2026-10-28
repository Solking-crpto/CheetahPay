import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ZcashInvoice, ZcashPrivacyRating } from '../../types/cheetahpay';
import {
  ZcashShieldService,
  ZEC_DEFAULT_TESTNET_UNIFIED,
  ZEC_DEFAULT_TESTNET_TRANSPARENT,
  ZEC_USD_PRICE,
} from '../../services/zcashShieldService';
import { LookupTab } from '../LookupTab';
import { RefundTab } from '../RefundTab';
import type { Address } from '../../contracts/paymentRouter';

interface MerchantInvoicesViewProps {
  onOpenCheckoutForInvoice: (invoiceId: string) => void;
  routerAddress?: Address;
}

export const MerchantInvoicesView: React.FC<MerchantInvoicesViewProps> = ({
  onOpenCheckoutForInvoice,
  routerAddress = '0x0000000000000000000000000000000000000000' as Address,
}) => {
  // Invoices list from storage
  const [invoices, setInvoices] = useState<ZcashInvoice[]>(() => ZcashShieldService.getSavedInvoices());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State
  const [merchantAddress, setMerchantAddress] = useState(ZEC_DEFAULT_TESTNET_UNIFIED);
  const [amountZec, setAmountZec] = useState('0.750000');
  const [amountUsd, setAmountUsd] = useState((0.75 * ZEC_USD_PRICE).toFixed(2));
  const [itemDescription, setItemDescription] = useState('Quarterly API Subscription');
  const [merchantName, setMerchantName] = useState('CheetahPay Merchant Services');
  const [expiryMinutes, setExpiryMinutes] = useState(30);

  // Legacy Arc Tools Drawer toggle
  const [showLegacyArc, setShowLegacyArc] = useState(false);
  const [legacyArcTab, setLegacyArcTab] = useState<'refund' | 'lookup'>('refund');

  const refreshInvoices = () => {
    setInvoices(ZcashShieldService.getSavedInvoices());
  };

  const handleZecChange = (val: string) => {
    setAmountZec(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountUsd((num * ZEC_USD_PRICE).toFixed(2));
    }
  };

  const handleUsdChange = (val: string) => {
    setAmountUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountZec((num / ZEC_USD_PRICE).toFixed(6));
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantAddress.trim()) {
      toast.error('Merchant receiving address is required');
      return;
    }
    if (parseFloat(amountZec) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    const inv = ZcashShieldService.createInvoice({
      merchantAddress: merchantAddress.trim(),
      amountZec,
      amountUsd,
      itemDescription,
      merchantName,
      expiryMinutes,
    });

    refreshInvoices();
    toast.success(`Invoice ${inv.invoiceId} generated successfully!`);
    onOpenCheckoutForInvoice(inv.invoiceId);
  };

  const handleCheckAllConfirmations = async () => {
    setIsRefreshing(true);
    toast.info('Polling Zcash Testnet node for pending invoice status updates...');
    try {
      let updatedCount = 0;
      for (const inv of invoices) {
        if (inv.status !== 'CONFIRMED' && inv.txid) {
          await ZcashShieldService.verifyAndAdvanceInvoice(inv.invoiceId);
          updatedCount++;
        }
      }
      refreshInvoices();
      toast.success(`Updated ${updatedCount} invoices from Zcash Testnet node.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update invoice confirmations.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const privacyRating: ZcashPrivacyRating = ZcashShieldService.getPrivacyRating(merchantAddress);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A3038]">
          <div>
            <div className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider mb-1">
              Merchant Portal · Zcash Shield
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#F3F4F6]">Merchant Invoices</h1>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl">
              Generate cryptographic ZIP-321 payment requests, track live on-chain confirmations, and maintain non-custodial merchant ledger records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckAllConfirmations}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#737B87] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Poll Confirmations</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Invoice Builder Form */}
        <div className="lg:col-span-5 bg-[#12151A] border border-[#2A3038] rounded-lg p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-[#2A3038]">
            <h2 className="text-sm font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#737B87]" />
              <span>Create New Invoice</span>
            </h2>
            <p className="text-xs text-[#737B87]">Generate a ZIP-321 payment request for customer checkout</p>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-3.5">
            {/* Merchant Address & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium uppercase tracking-wider text-[#737B87]">
                  Receiving Address
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setMerchantAddress(ZEC_DEFAULT_TESTNET_UNIFIED)}
                    className="text-[#D6A23D] hover:underline"
                  >
                    Preset Shielded
                  </button>
                  <span className="text-[#737B87]">·</span>
                  <button
                    type="button"
                    onClick={() => setMerchantAddress(ZEC_DEFAULT_TESTNET_TRANSPARENT)}
                    className="text-[#9CA3AF] hover:underline"
                  >
                    Preset Transparent
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={merchantAddress}
                onChange={(e) => setMerchantAddress(e.target.value.trim())}
                placeholder="utest1... (Shielded) or tm... (Transparent)"
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-2 font-mono text-xs text-[#F3F4F6] outline-none transition-colors"
              />
            </div>

            {/* Privacy Capability & Notice Indicator */}
            <div className="p-3 rounded-md border border-[#2A3038] bg-[#191D23] text-xs">
              <div className="flex items-center justify-between font-medium text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[#F3F4F6]">
                  {privacyRating.isShielded ? <Lock className="w-3.5 h-3.5 text-[#737B87]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#737B87]" />}
                  <span>{privacyRating.capabilityLevel}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#2A3038] bg-[#0B0D10] text-[#9CA3AF]">
                  {privacyRating.isShielded ? 'Shielded Pool Format' : 'Public Ledger'}
                </span>
              </div>
              <p className="text-[10px] text-[#D6A23D] leading-tight mb-1">
                {privacyRating.transactionPrivacyNotice}
              </p>
              <p className="text-[10px] text-[#737B87] leading-normal">
                {privacyRating.description}
              </p>
            </div>

            {/* Amounts (ZEC & USD Dual-Input) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#737B87] mb-1">
                  Amount in ZEC
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={amountZec}
                  onChange={(e) => handleZecChange(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-1.5 font-mono text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#737B87] mb-1">
                  USD ($) Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountUsd}
                  onChange={(e) => handleUsdChange(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-1.5 font-mono text-xs text-[#F3F4F6] outline-none"
                />
              </div>
            </div>

            {/* Item & Merchant Info */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#737B87] mb-1">
                Order Description
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#737B87] mb-1">
                Merchant Business Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#737B87] mb-1">
                Validity Duration
              </label>
              <select
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={1440}>24 Hours</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-md bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate ZIP-321 Invoice & Open Checkout</span>
            </button>
          </form>
        </div>

        {/* Right Column: Invoice Directory Ledger */}
        <div className="lg:col-span-7 bg-[#12151A] border border-[#2A3038] rounded-lg p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A3038]">
            <div>
              <h2 className="text-sm font-semibold text-[#F3F4F6]">Merchant Invoice Directory</h2>
              <p className="text-xs text-[#737B87]">All local invoices generated on this merchant client</p>
            </div>
            <span className="text-xs font-mono font-medium text-[#9CA3AF] px-2 py-0.5 rounded border border-[#2A3038] bg-[#0B0D10]">
              {invoices.length} Invoices
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="py-10 text-center text-[#737B87] text-xs">
              No invoices created yet. Fill out the form to generate your first ZIP-321 payment request.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {invoices.map((inv) => (
                <div
                  key={inv.invoiceId}
                  className="p-3.5 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[#F3F4F6]">
                          {inv.invoiceId}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-[#2A3038] bg-[#191D23] text-[#9CA3AF]">
                          {inv.status === 'AWAITING_WALLET_VERIFICATION' ? 'AWAITING WALLET VERIFY' : inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{inv.itemDescription}</p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-medium text-[#F3F4F6]">
                        {inv.amountZec} ZEC
                      </div>
                      <div className="text-[10px] text-[#737B87] font-mono">≈ ${inv.amountUsd} USD</div>
                    </div>
                  </div>

                  {inv.settlementDetails && (
                    <div className="text-[10px] font-mono px-2 py-1 rounded border border-[#2A3038] bg-[#12151A] text-[#9CA3AF]">
                      {inv.settlementDetails}
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-[#737B87] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2A3038]">
                    <span className="truncate max-w-[200px]" title={inv.merchantAddress}>
                      To: {inv.merchantAddress.slice(0, 12)}...{inv.merchantAddress.slice(-6)}
                    </span>
                    <span>Confirmations: {inv.confirmations} / {inv.requiredConfirmations}</span>
                  </div>

                  {inv.txid && (
                    <div className="text-[10px] font-mono text-[#737B87] flex items-center justify-between pt-1">
                      <span className="truncate max-w-[240px]">Tx: {inv.txid}</span>
                      {inv.explorerUrl && (
                        <a
                          href={inv.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#D6A23D] hover:underline flex items-center gap-1"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenCheckoutForInvoice(inv.invoiceId)}
                      className="px-2.5 py-1 rounded bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Open in Checkout</span>
                      <ArrowRight className="w-3 h-3 text-[#737B87]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legacy Arc Router Section (Isolated in Collapsible Drawer) */}
      <div className="border border-[#2A3038] rounded-lg bg-[#12151A] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLegacyArc(!showLegacyArc)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#191D23]/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-medium text-[#737B87] px-2 py-0.5 rounded border border-[#2A3038] bg-[#0B0D10]">
              ARC
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#F3F4F6]">Archive: Legacy Arc USDC Merchant Tools</span>
                <span className="px-1.5 py-0.2 rounded bg-[#0B0D10] text-[10px] text-[#737B87] font-mono border border-[#2A3038]">
                  Solidity PaymentRouter
                </span>
              </div>
              <p className="text-[11px] text-[#737B87]">
                Preserved historical tools for Arc Testnet (Chain ID 5042002) non-custodial refunds and payment ID lookups.
              </p>
            </div>
          </div>
          {showLegacyArc ? <ChevronUp className="w-4 h-4 text-[#737B87]" /> : <ChevronDown className="w-4 h-4 text-[#737B87]" />}
        </button>

        {showLegacyArc && (
          <div className="p-5 border-t border-[#2A3038] bg-[#0B0D10] space-y-5">
            <div className="flex gap-2 border-b border-[#2A3038] pb-2.5">
              <button
                type="button"
                onClick={() => setLegacyArcTab('refund')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  legacyArcTab === 'refund'
                    ? 'bg-[#191D23] text-[#F3F4F6] border border-[#2A3038]'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                Arc Merchant Refund
              </button>
              <button
                type="button"
                onClick={() => setLegacyArcTab('lookup')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  legacyArcTab === 'lookup'
                    ? 'bg-[#191D23] text-[#F3F4F6] border border-[#2A3038]'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                Arc Payment ID Lookup
              </button>
            </div>

            {legacyArcTab === 'refund' ? (
              <RefundTab routerAddress={routerAddress} />
            ) : (
              <LookupTab
                routerAddress={routerAddress}
                onInitiateRefund={() => setLegacyArcTab('refund')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
