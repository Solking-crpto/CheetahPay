import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Info,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Lock,
  Unlock,
  FileSearch,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ZcashInvoice, ZcashPrivacyRating } from '../../types/cheetahpay';
import {
  ZcashShieldService,
  ZEC_DEFAULT_TESTNET_UNIFIED,
} from '../../services/zcashShieldService';
import { QrCodeView } from '../common/QrCodeView';

export interface ZcashCheckoutViewProps {
  initialInvoiceId?: string;
  onNavigateToInvoices?: () => void;
}

export const ZcashCheckoutView: React.FC<ZcashCheckoutViewProps> = ({
  initialInvoiceId,
  onNavigateToInvoices,
}) => {
  // Saved invoices from storage
  const [invoices, setInvoices] = useState<ZcashInvoice[]>(() => ZcashShieldService.getSavedInvoices());

  // Active Invoice
  const [currentInvoice, setCurrentInvoice] = useState<ZcashInvoice | null>(() => {
    const list = ZcashShieldService.getSavedInvoices();
    if (initialInvoiceId) {
      const match = list.find((i) => i.invoiceId === initialInvoiceId);
      if (match) return match;
    }
    if (list.length > 0) return list[0];
    return ZcashShieldService.createInvoice({
      merchantAddress: ZEC_DEFAULT_TESTNET_UNIFIED,
      amountZec: '0.500000',
      itemDescription: 'CheetahPay Shield Enterprise License',
      merchantName: 'CheetahPay Merchant Services',
      expiryMinutes: 30,
    });
  });

  const [qrMode, setQrMode] = useState<'uri' | 'address'>('uri');
  const [submittedTxId, setSubmittedTxId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('30:00');
  const [lookupId, setLookupId] = useState('');

  // Synchronize invoices list on load or update
  const refreshInvoicesList = () => {
    const fresh = ZcashShieldService.getSavedInvoices();
    setInvoices(fresh);
  };

  // Expiration Countdown Timer
  useEffect(() => {
    if (!currentInvoice) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = currentInvoice.expiresAt - now;
      if (diff <= 0) {
        setTimeRemaining('EXPIRED');
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentInvoice]);

  const copyToClipboard = (text: string, fieldName: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.info(`Copied ${fieldName} to clipboard`);
  };

  // Submit and verify transaction hash against live Zcash testnet network
  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInvoice) return;
    const clean = submittedTxId.trim().replace(/^0x/, '');
    if (!clean || clean.length < 32) {
      toast.error('Please enter a valid 64-character Zcash transaction hash');
      return;
    }

    setIsVerifying(true);
    toast.info('Querying live Zcash Testnet node for block verification...');

    try {
      const updated = ZcashShieldService.submitPaymentTx(currentInvoice.invoiceId, clean);
      setCurrentInvoice({ ...updated });
      refreshInvoicesList();

      const { invoice, verification } = await ZcashShieldService.verifyAndAdvanceInvoice(currentInvoice.invoiceId);
      setCurrentInvoice({ ...invoice });
      refreshInvoicesList();

      if (verification.found) {
        if (verification.settlementScope === 'mismatch') {
          toast.error(verification.error || 'Transaction rejected: Output mismatch with invoice.');
        } else if (verification.confirmations >= invoice.requiredConfirmations) {
          toast.success(`Transaction verified on-chain! ${verification.confirmations} confirmations. Invoice settled.`);
        } else {
          toast.warning(`Transaction detected in block ${verification.blockNumber || 'mempool'}. Awaiting confirmations (${verification.confirmations}/${invoice.requiredConfirmations}).`);
        }
      } else {
        toast.warning(verification.error || 'Transaction hash not yet confirmed on Zcash Testnet node. Awaiting block inclusion.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Network verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!currentInvoice?.invoiceId) return;
    setIsVerifying(true);
    try {
      const { invoice, verification } = await ZcashShieldService.verifyAndAdvanceInvoice(currentInvoice.invoiceId);
      setCurrentInvoice({ ...invoice });
      refreshInvoicesList();
      if (verification.found) {
        if (verification.settlementScope === 'mismatch') {
          toast.error(verification.error || 'Verification mismatch detected.');
        } else {
          toast.success(`Updated from Zcash Testnet node: ${verification.confirmations} confirmations.`);
        }
      } else {
        toast.info(verification.error || 'Transaction still awaiting network confirmation.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to query network.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectInvoice = (inv: ZcashInvoice) => {
    setCurrentInvoice(inv);
    setSubmittedTxId(inv.txid || '');
    toast.info(`Switched to invoice ${inv.invoiceId}`);
  };

  const handleLookupInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = lookupId.trim();
    if (!raw) return;

    // Handle ZIP-321 URI import directly in the search bar
    if (raw.startsWith('zcash:')) {
      const parsed = ZcashShieldService.parseZip321Uri(raw);
      if (parsed.isValid) {
        const imported = ZcashShieldService.createInvoice({
          merchantAddress: parsed.address,
          amountZec: parsed.amountZec || '0.000000',
          itemDescription: parsed.message || (parsed.memo ? parsed.memo.slice(0, 45) : 'Imported ZIP-321 Payment Request'),
          merchantName: 'Imported Merchant Request',
        });
        setCurrentInvoice(imported);
        refreshInvoicesList();
        toast.success(`Imported ZIP-321 URI: ${parsed.amountZec || '0'} ZEC`);
        setLookupId('');
        return;
      } else {
        toast.error(`Invalid ZIP-321 URI: ${parsed.error}`);
        return;
      }
    }

    const found = ZcashShieldService.getInvoice(raw);
    if (found) {
      setCurrentInvoice(found);
      setSubmittedTxId(found.txid || '');
      toast.success(`Loaded invoice ${found.invoiceId}`);
      setLookupId('');
    } else {
      toast.error(`Invoice "${raw}" not found in local records`);
    }
  };

  const privacyRating: ZcashPrivacyRating | null = currentInvoice
    ? ZcashShieldService.getPrivacyRating(currentInvoice.merchantAddress)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A3038]">
          <div>
            <div className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider mb-1">
              Native Zcash Rail · ZECATHON 2026
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#F3F4F6]">Pay with Zcash</h1>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl">
              Confidential, zero-knowledge checkout powered by native Zcash. Scannable ZIP-321 payment requests with encrypted memo invoice binding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Invoice Selector dropdown */}
            {invoices.length > 1 && (
              <select
                value={currentInvoice?.invoiceId || ''}
                onChange={(e) => {
                  const selected = invoices.find((inv) => inv.invoiceId === e.target.value);
                  if (selected) handleSelectInvoice(selected);
                }}
                className="bg-[#0B0D10] border border-[#2A3038] rounded-md px-3 py-1.5 text-xs font-mono text-[#F3F4F6] outline-none focus:border-[#D6A23D]"
              >
                {invoices.map((inv) => (
                  <option key={inv.invoiceId} value={inv.invoiceId}>
                    {inv.invoiceId} ({inv.amountZec} ZEC) - {inv.status}
                  </option>
                ))}
              </select>
            )}

            {onNavigateToInvoices && (
              <button
                type="button"
                onClick={onNavigateToInvoices}
                className="px-3.5 py-1.5 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium transition-colors"
              >
                <span>Merchant Invoice Builder</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Network & Testnet Faucet Banner */}
        <div className="mt-3.5 p-3 rounded-md bg-[#191D23] border border-[#2A3038] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#9CA3AF]">
          <div className="flex items-start gap-2.5">
            <Info className="w-3.5 h-3.5 text-[#D6A23D] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#F3F4F6]">Zcash Testnet (NU5) Active</p>
              <p className="text-[11px] text-[#737B87] mt-0.5">
                Pay using testnet wallets (Zashi, Ywallet, Zecwallet, or MetaMask Zcash Snap). Real block confirmations are tracked live via SoChain Testnet REST API.
              </p>
            </div>
          </div>
          <a
            href="https://faucet.zecpages.com/"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-md bg-[#12151A] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <span>Get Testnet ZEC</span>
            <ExternalLink className="w-3 h-3 text-[#737B87]" />
          </a>
        </div>
      </div>

      {/* Invoice Lookup Bar */}
      <form onSubmit={handleLookupInvoice} className="flex gap-2">
        <input
          type="text"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          placeholder="Lookup invoice ID (CP-SHIELD-...) or import ZIP-321 URI (zcash:...)"
          className="flex-1 bg-[#12151A] border border-[#2A3038] rounded-md px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#737B87] font-mono focus:border-[#D6A23D] outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] font-medium text-xs flex items-center gap-1.5 transition-colors"
        >
          <FileSearch className="w-3.5 h-3.5 text-[#737B87]" />
          <span>Load Invoice</span>
        </button>
      </form>

      {currentInvoice ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code & Wallet Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 flex flex-col items-center">
              {/* QR Mode Toggle */}
              <div className="flex items-center gap-1 p-0.5 bg-[#0B0D10] border border-[#2A3038] rounded-md mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setQrMode('uri')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    qrMode === 'uri'
                      ? 'bg-[#191D23] text-[#F3F4F6] border border-[#2A3038]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  ZIP-321 URI
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('address')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    qrMode === 'address'
                      ? 'bg-[#191D23] text-[#F3F4F6] border border-[#2A3038]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  Address Only
                </button>
              </div>

              {/* QR Code Canvas */}
              <QrCodeView
                value={qrMode === 'uri' ? currentInvoice.zip321Uri : currentInvoice.merchantAddress}
                size={200}
                label="Scan with Zcash Wallet"
                subLabel="Compatible with Zashi, Ywallet, Zecwallet"
              />

              {/* Protocol Deep Link Button */}
              <a
                href={currentInvoice.zip321Uri}
                className="mt-3.5 w-full py-2.5 px-4 rounded-md bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Open in Zcash Wallet</span>
              </a>

              {/* Wallet Integration Architecture Info */}
              <div className="mt-3.5 p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md text-[10px] text-[#9CA3AF] space-y-1 font-mono">
                <div className="flex items-center justify-between font-sans font-medium text-[#F3F4F6] text-[11px]">
                  <span>Zcash Web Wallet Capability</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#191D23] border border-[#2A3038] text-[9px] text-[#737B87]">
                    ZIP-321 Protocol
                  </span>
                </div>
                <p className="font-sans text-[10px] text-[#737B87] leading-normal">
                  Standard web browsers lack native WASM support for Zcash zero-knowledge SNARK proving circuits. CheetahPay routes payment parameters directly via standard <strong>ZIP-321 protocol dispatch</strong> (<code className="text-[#9CA3AF]">zcash:</code>) to external wallets (Zashi, Ywallet, Zecwallet, or MetaMask Zcash Snap).
                </p>
                <div className="pt-1 border-t border-[#2A3038] flex items-center justify-between text-[#737B87] text-[9px]">
                  <span>• Key Custody: Delegated to wallet</span>
                  <span>• Browser Keys: None stored</span>
                </div>
              </div>

              {/* Countdown Expiry */}
              <div className="mt-3.5 flex items-center gap-1.5 text-xs text-[#737B87]">
                <Clock className="w-3 h-3 text-[#737B87]" />
                <span>Time Remaining: </span>
                <span className={`font-mono font-medium ${timeRemaining === 'EXPIRED' ? 'text-red-400' : 'text-[#F3F4F6]'}`}>
                  {timeRemaining}
                </span>
              </div>
            </div>

            {/* Privacy Rating & zk-SNARK Guarantee Card */}
            {privacyRating && (
              <div className="p-4 rounded-lg border border-[#2A3038] bg-[#12151A] text-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-[#F3F4F6]">
                    {privacyRating.isShielded ? (
                      <Lock className="w-3.5 h-3.5 text-[#737B87]" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-[#737B87]" />
                    )}
                    <span>{privacyRating.capabilityLevel}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#2A3038] bg-[#0B0D10] text-[#9CA3AF]">
                    {privacyRating.isShielded ? 'Shielded Pool Capable' : 'Public Ledger Only'}
                  </span>
                </div>

                {/* Address Capability vs Transaction Privacy Notice */}
                <div className="mb-2.5 p-3 rounded-md bg-[#0B0D10] border border-[#2A3038] space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#F3F4F6]">
                    <Info className="w-3 h-3 text-[#D6A23D] shrink-0" />
                    <span>Address Capability vs. Transaction Privacy</span>
                  </div>
                  <p className="text-[10px] text-[#D6A23D] leading-relaxed">
                    {privacyRating.transactionPrivacyNotice}
                  </p>
                  <p className="text-[10px] leading-relaxed text-[#737B87]">
                    {privacyRating.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-[#2A3038] text-[#737B87]">
                  <div>
                    <span>Sender: </span>
                    <span className="text-[#F3F4F6]">{privacyRating.metadataVisibility.senderAddress}</span>
                  </div>
                  <div>
                    <span>Recipient: </span>
                    <span className="text-[#F3F4F6]">{privacyRating.metadataVisibility.recipientAddress}</span>
                  </div>
                  <div>
                    <span>Amount: </span>
                    <span className="text-[#F3F4F6]">{privacyRating.metadataVisibility.amount}</span>
                  </div>
                  <div>
                    <span>Memo: </span>
                    <span className="text-[#F3F4F6]">{privacyRating.metadataVisibility.memoData}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Invoice Details & Settlement Verification */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 sm:p-6 space-y-5">
              {/* Invoice Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-[#2A3038]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#737B87]">
                    {currentInvoice.invoiceId}
                  </span>
                  <h2 className="text-lg font-semibold text-[#F3F4F6] mt-0.5">
                    {currentInvoice.itemDescription}
                  </h2>
                  <p className="text-xs text-[#737B87]">{currentInvoice.merchantName}</p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-semibold text-[#F3F4F6] font-mono">
                    {currentInvoice.amountZec} ZEC
                  </div>
                  <div className="text-xs text-[#737B87] font-mono">≈ ${currentInvoice.amountUsd} USD</div>
                </div>
              </div>

              {/* Copyable Payment Credentials */}
              <div className="space-y-2.5 font-mono text-xs">
                {/* Merchant Address */}
                <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md">
                  <div className="flex items-center justify-between text-[#737B87] text-[10px] uppercase tracking-wider mb-1">
                    <span>Merchant Address</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentInvoice.merchantAddress, 'Address')}
                      className="text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1"
                    >
                      {copiedField === 'Address' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-[#737B87]" />}
                      <span>{copiedField === 'Address' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[#F3F4F6] break-all select-all text-[11px]">
                    {currentInvoice.merchantAddress}
                  </div>
                </div>

                {/* Encrypted Memo Payload */}
                <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md">
                  <div className="flex items-center justify-between text-[#737B87] text-[10px] uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1 text-[#F3F4F6]">
                      <Lock className="w-3 h-3 text-[#737B87]" /> Encrypted Memo (Invoice Binding)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentInvoice.memo, 'Memo')}
                      className="text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1"
                    >
                      {copiedField === 'Memo' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-[#737B87]" />}
                      <span>{copiedField === 'Memo' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[#9CA3AF] select-all text-[11px] font-sans">
                    {currentInvoice.memo}
                  </div>
                </div>

                {/* Raw ZIP-321 URI */}
                <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md">
                  <div className="flex items-center justify-between text-[#737B87] text-[10px] uppercase tracking-wider mb-1">
                    <span>ZIP-321 Payment URI</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentInvoice.zip321Uri, 'URI')}
                      className="text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1"
                    >
                      {copiedField === 'URI' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-[#737B87]" />}
                      <span>{copiedField === 'URI' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[#737B87] truncate text-[11px]">
                    {currentInvoice.zip321Uri}
                  </div>
                </div>
              </div>

              {/* Settlement Verification Terminal */}
              <div className="pt-3.5 border-t border-[#2A3038]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737B87]">
                    Live Testnet Verification Terminal
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[#2A3038] bg-[#0B0D10] text-[#9CA3AF]">
                    {currentInvoice.status === 'AWAITING_WALLET_VERIFICATION'
                      ? 'AWAITING WALLET VERIFICATION'
                      : currentInvoice.status}
                  </span>
                </div>

                {currentInvoice.status === 'CONFIRMED' ? (
                  <div className="p-4 bg-[#191D23] border border-[#2A3038] rounded-md space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Transparent Payment Verified & Confirmed on Zcash Testnet</span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Received {currentInvoice.confirmations} of {currentInvoice.requiredConfirmations} required confirmations on authoritative blockchain node. Merchant invoice settled.
                    </p>
                    {currentInvoice.settlementDetails && (
                      <p className="text-[10px] text-[#9CA3AF] font-mono bg-[#0B0D10] p-2 rounded border border-[#2A3038]">
                        {currentInvoice.settlementDetails}
                      </p>
                    )}
                    {currentInvoice.explorerUrl && (
                      <a
                        href={currentInvoice.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-[#D6A23D] hover:underline mt-1"
                      >
                        <span>View on SoChain Zcash Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : currentInvoice.status === 'AWAITING_WALLET_VERIFICATION' ? (
                  <div className="p-4 bg-[#191D23] border border-[#2A3038] rounded-md space-y-2">
                    <div className="flex items-center gap-1.5 text-[#F3F4F6] font-medium text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D6A23D]" />
                      <span>On-Chain Inclusion Confirmed · Awaiting Merchant Wallet Decryption</span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Transaction has {currentInvoice.confirmations} block confirmations on Zcash Testnet. Note amount, recipient address, and memo are encrypted on-chain with zk-SNARKs. Final note verification occurs inside your merchant wallet via Incoming Viewing Key (IVK).
                    </p>
                    {currentInvoice.settlementDetails && (
                      <p className="text-[10px] text-[#9CA3AF] font-mono bg-[#0B0D10] p-2 rounded border border-[#2A3038]">
                        {currentInvoice.settlementDetails}
                      </p>
                    )}
                    {currentInvoice.explorerUrl && (
                      <a
                        href={currentInvoice.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-[#D6A23D] hover:underline mt-1"
                      >
                        <span>View on SoChain Zcash Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentInvoice.status === 'FAILED' && (
                      <div className="p-3.5 bg-[#191D23] border border-red-500/30 rounded-md space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-red-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Settlement Verification Failed</span>
                        </div>
                        <p className="text-[11px] text-[#9CA3AF]">
                          {currentInvoice.settlementDetails || 'The submitted transaction does not match this invoice.'}
                        </p>
                      </div>
                    )}
                    {currentInvoice.status === 'CONFIRMING' || currentInvoice.status === 'SUBMITTED' ? (
                      <div className="p-3.5 bg-[#191D23] border border-[#2A3038] rounded-md space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#F3F4F6] flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#737B87]" />
                            <span>Confirmations: {currentInvoice.confirmations} / {currentInvoice.requiredConfirmations}</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleRefreshVerification}
                            disabled={isVerifying}
                            className="px-2.5 py-1 rounded bg-[#12151A] hover:bg-[#2A3038] text-[#F3F4F6] text-[11px] font-medium border border-[#2A3038] flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 text-[#737B87] ${isVerifying ? 'animate-spin' : ''}`} />
                            <span>Re-check Network</span>
                          </button>
                        </div>
                        <div className="font-mono text-[11px] text-[#9CA3AF] truncate">
                          Tx: {currentInvoice.txid}
                        </div>
                        {currentInvoice.explorerUrl && (
                          <a
                            href={currentInvoice.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#D6A23D] hover:underline"
                          >
                            <span>Inspect on SoChain Zcash Testnet Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : null}

                    <form onSubmit={handleSubmitTx} className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-[#737B87] mb-1">
                          Submit Broadcasted Zcash Transaction ID (from your wallet):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={submittedTxId}
                            onChange={(e) => setSubmittedTxId(e.target.value.trim())}
                            placeholder="Paste broadcasted txid (64 hex characters)..."
                            className="flex-1 bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isVerifying}
                            className="px-4 py-2 rounded-md bg-[#D6A23D] hover:bg-[#C29132] disabled:opacity-50 text-[#0B0D10] font-medium text-xs flex items-center gap-1.5 transition-colors"
                          >
                            {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            <span>Verify Tx</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-[#737B87] leading-normal">
                        CheetahPay queries live Zcash Testnet network nodes (<code className="text-[#9CA3AF]">https://sochain.com/api/v3/transaction/ZECTEST</code>). Invoices settle only after authoritative on-chain block inclusion.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#12151A] border border-[#2A3038] rounded-lg">
          <p className="text-[#737B87] text-sm">No active invoice selected.</p>
        </div>
      )}
    </div>
  );
};

