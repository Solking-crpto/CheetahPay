import React from 'react';
import {
  CreditCard,
  Shield,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  FileText,
} from 'lucide-react';
import type { MainNavigationTab, UnifiedTransaction } from '../../types/cheetahpay';
import { TransactionLedger } from '../../services/transactionLedger';
import { ZcashShieldService } from '../../services/zcashShieldService';

interface DashboardOverviewProps {
  onNavigate: (tab: MainNavigationTab) => void;
  onSelectTx?: (tx: UnifiedTransaction) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onSelectTx,
}) => {
  const transactions = TransactionLedger.getAllTransactions();
  const invoices = ZcashShieldService.getSavedInvoices();

  const confirmedInvoicesCount = invoices.filter((i) => i.status === 'CONFIRMED').length;
  const awaitingWalletCount = invoices.filter((i) => i.status === 'AWAITING_WALLET_VERIFICATION').length;
  const totalZecSettled = invoices
    .filter((i) => i.status === 'CONFIRMED')
    .reduce((sum, i) => sum + parseFloat(i.amountZec || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Overview Hero Card */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 sm:p-7">
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider mb-2">
            Institutional Payment Infrastructure · Zcash Native Rail
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#F3F4F6] tracking-tight">
            Universal Fiat-Crypto Payment Infrastructure
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
            Pay fiat to Web3. Pay crypto to Web2. Confidential checkout adhering to official ZIP-321 standards with encrypted memo invoice binding, zero key custody, and transparent on-chain verification.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('pay-zcash')}
              className="px-4 py-2 rounded-md bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>Launch Zcash Checkout</span>
            </button>
            <button
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#737B87]" />
              <span>Create Merchant Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('fund')}
              className="px-4 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#737B87]" />
              <span>Fund Wallet (On-Ramp)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row: 4 Unified Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-4">
          <div className="flex items-center justify-between text-[#737B87] text-[11px] font-medium uppercase tracking-wider">
            <span>Primary Network</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-lg font-semibold text-[#F3F4F6] mt-1">Zcash Testnet</div>
          <p className="text-[11px] text-[#737B87] mt-0.5 font-mono">NU5 / SoChain Node</p>
        </div>

        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-4">
          <div className="flex items-center justify-between text-[#737B87] text-[11px] font-medium uppercase tracking-wider">
            <span>Privacy Standard</span>
            <Lock className="w-3.5 h-3.5 text-[#737B87]" />
          </div>
          <div className="text-lg font-semibold text-[#F3F4F6] mt-1">ZIP-321 / Unified</div>
          <p className="text-[11px] text-[#737B87] mt-0.5 font-mono">Orchard & Sapling Pools</p>
        </div>

        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-4">
          <div className="flex items-center justify-between text-[#737B87] text-[11px] font-medium uppercase tracking-wider">
            <span>Settled Invoices</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#737B87]" />
          </div>
          <div className="text-lg font-semibold text-[#F3F4F6] mt-1 font-mono">
            {confirmedInvoicesCount} Confirmed
          </div>
          <p className="text-[11px] text-[#737B87] mt-0.5 font-mono">
            {awaitingWalletCount > 0 ? `${awaitingWalletCount} awaiting verify · ` : ''}
            {totalZecSettled.toFixed(4)} ZEC settled
          </p>
        </div>

        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-4">
          <div className="flex items-center justify-between text-[#737B87] text-[11px] font-medium uppercase tracking-wider">
            <span>Custody Model</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#737B87]" />
          </div>
          <div className="text-lg font-semibold text-[#F3F4F6] mt-1">Zero Key Custody</div>
          <p className="text-[11px] text-[#737B87] mt-0.5 font-mono">No keys or seeds held</p>
        </div>
      </div>

      {/* Core Payment Capabilities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#737B87]">
            Core Payment Capabilities
          </h2>
          <span className="text-[11px] text-[#737B87]">Universal privacy and liquidity architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rail 1: CheetahPay Shield */}
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <Shield className="w-4 h-4 text-[#D6A23D]" />
                <span className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider">
                  Primary Rail
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F3F4F6]">
                CheetahPay Shield: Zcash Checkout
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">
                Confidential checkout conforming to official ZIP-321 standards. Cryptographically binds invoice metadata inside encrypted 512-byte memos and renders offline SVG QR codes.
              </p>
              <div className="mt-4 pt-3 border-t border-[#2A3038] flex items-center justify-between text-[11px] text-[#737B87] font-mono">
                <span>Standard: ZIP-321 URI</span>
                <span className="text-[#9CA3AF]">Shielded Capable</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pay-zcash')}
              className="mt-5 w-full py-2 px-3 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Zcash Checkout</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#737B87]" />
            </button>
          </div>

          {/* Rail 2: Merchant Invoices */}
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <FileText className="w-4 h-4 text-[#9CA3AF]" />
                <span className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider">
                  Merchant Suite
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F3F4F6]">
                Merchant Invoicing & Receipts
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">
                Generate dynamic customer payment requests in ZEC or USD value. Supports preset Unified and Transparent merchant addresses with automatic confirmation tracking.
              </p>
              <div className="mt-4 pt-3 border-t border-[#2A3038] flex items-center justify-between text-[11px] text-[#737B87] font-mono">
                <span>Presets: utest1 / tm</span>
                <span className="text-[#9CA3AF]">Auto Poll</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="mt-5 w-full py-2 px-3 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Manage Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#737B87]" />
            </button>
          </div>

          {/* Rail 3: Web2 Fiat Funding */}
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <CreditCard className="w-4 h-4 text-[#9CA3AF]" />
                <span className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider">
                  Fiat Liquidity
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F3F4F6]">
                Web2 to Web3: Fund Wallet
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">
                Model fiat deposits via Cards, SEPA, and ACH. Includes transparent fee calculation, live API connection testing, and documented non-custodial ZEC liquidity routing.
              </p>
              <div className="mt-4 pt-3 border-t border-[#2A3038] flex items-center justify-between text-[11px] text-[#737B87] font-mono">
                <span>Channels: Card / SEPA / ACH</span>
                <span className="text-[#9CA3AF]">Safe Boundary</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('fund')}
              className="mt-5 w-full py-2 px-3 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Initiate Funding Quote</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#737B87]" />
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Rail Activity Table */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A3038]">
          <div>
            <h2 className="text-sm font-semibold text-[#F3F4F6]">Recent Payment Activity</h2>
            <p className="text-xs text-[#737B87]">Cross-rail records across Zcash checkouts and multi-rail operations</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-[#D6A23D] hover:underline flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#737B87]">
            No transactions recorded yet. Broadcast a payment in Zcash Checkout or create an invoice to populate the ledger.
          </div>
        ) : (
          <div className="divide-y divide-[#2A3038] overflow-x-auto">
            {transactions.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTx?.(t)}
                className="py-2.5 px-2 flex items-center justify-between gap-4 hover:bg-[#191D23]/60 rounded-md transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#9CA3AF]">
                    {t.rail === 'zcash-shield' ? <Shield className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-[#F3F4F6] flex items-center gap-2">
                      <span>{t.memoOrReference || t.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0B0D10] border border-[#2A3038] text-[#9CA3AF]">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#737B87] font-mono">{new Date(t.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-medium text-[#F3F4F6]">
                    {t.targetAmount} {t.targetAsset}
                  </div>
                  <span className="text-[10px] font-mono text-[#737B87] capitalize">{t.provenance.replace('-', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legacy Arc Isolation Notice & Direct Access Link */}
      <div className="p-3.5 rounded-lg bg-[#12151A] border border-[#2A3038] flex items-center justify-between text-xs text-[#737B87]">
        <div className="flex items-center gap-2.5">
          <Zap className="w-3.5 h-3.5 text-[#737B87]" />
          <span>
            Looking for historical Arc USDC routing? The legacy Arc PaymentRouter slice is preserved for reference.
          </span>
        </div>
        <button
          onClick={() => onNavigate('legacy-arc')}
          className="text-[#9CA3AF] hover:text-[#F3F4F6] font-medium flex items-center gap-1 transition-colors"
        >
          <span>Open Legacy Arc Rail</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

