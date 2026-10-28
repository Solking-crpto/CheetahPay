import React, { useState } from 'react';
import {
  Search,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UnifiedTransaction } from '../../types/cheetahpay';
import { TransactionLedger } from '../../services/transactionLedger';

export const TransactionHistoryView: React.FC = () => {
  const [selectedRail, setSelectedRail] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectTx, setInspectTx] = useState<UnifiedTransaction | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const transactions = TransactionLedger.getAllTransactions();

  // Filter records
  const filteredTxs = transactions.filter((tx) => {
    if (selectedRail !== 'all' && tx.rail !== selectedRail) return false;
    if (selectedStatus !== 'all' && tx.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = tx.id.toLowerCase().includes(q);
      const matchTx = tx.txHash?.toLowerCase().includes(q) ?? false;
      const matchTo = tx.toAddress.toLowerCase().includes(q);
      const matchMemo = tx.memoOrReference?.toLowerCase().includes(q) ?? false;
      return matchId || matchTx || matchTo || matchMemo;
    }
    return true;
  });

  const handleExport = () => {
    const csv = TransactionLedger.exportToCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cheetahpay-ledger-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Cross-rail ledger exported to CSV');
  };

  const copyText = (val: string) => {
    void navigator.clipboard.writeText(val);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    toast.info('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A3038]">
          <div>
            <h1 className="text-xl font-bold text-[#F3F4F6]">Cross-Rail Transaction Ledger</h1>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Unified institutional ledger tracking fiat on-ramps, Arc USDC router transfers, and Zcash shielded payments.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-[#D6A23D]" />
            <span>Export CSV Ledger</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#737B87] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Payment ID, TxHash, Address, or Memo..."
              className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md pl-9 pr-3 py-2 text-xs text-[#F3F4F6] outline-none transition"
            />
          </div>

          {/* Rail Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Rails' },
              { id: 'fiat-onramp', label: 'Fiat On-Ramp' },
              { id: 'arc-usdc', label: 'Arc USDC' },
              { id: 'zcash-shield', label: 'Zcash Shield' },
            ].map((rail) => (
              <button
                key={rail.id}
                onClick={() => setSelectedRail(rail.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition border ${
                  selectedRail === rail.id
                    ? 'bg-[#191D23] border-[#D6A23D] text-[#F3F4F6]'
                    : 'bg-[#0B0D10] border-[#2A3038] text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                {rail.label}
              </button>
            ))}
          </div>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Confirming">Confirming</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#0B0D10] border border-[#2A3038] text-[#737B87] flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#F3F4F6]">No Transactions Recorded Yet</h3>
            <p className="text-xs text-[#737B87] max-w-md mx-auto leading-relaxed">
              Genuine transactions from the Arc USDC router, verified Zcash Shield checkouts, and completed fiat on-ramp settlements will be recorded and indexed here automatically. CheetahPay does not display synthetic balances or fabricated transactions.
            </p>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="text-center py-8 text-[#737B87] text-xs">
            No transactions match the selected filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2A3038] text-[#737B87] uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Rail</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">From / Source</th>
                <th className="py-2.5 px-3">To / Destination</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3038] font-mono">
              {filteredTxs.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setInspectTx(tx)}
                  className="hover:bg-[#191D23]/60 transition cursor-pointer"
                >
                  <td className="py-2.5 px-3 text-[#9CA3AF] font-sans text-xs whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#191D23] border border-[#2A3038] text-[#9CA3AF]">
                      {tx.rail === 'arc-usdc'
                        ? 'Arc USDC'
                        : tx.rail === 'zcash-shield'
                        ? 'Zcash Shield'
                        : 'Fiat On-Ramp'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 capitalize font-sans text-[#F3F4F6]">
                    {tx.type.replace('-', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#F3F4F6] whitespace-nowrap">
                    {tx.targetAmount} {tx.targetAsset}
                  </td>
                  <td className="py-2.5 px-3 text-[#9CA3AF] truncate max-w-[140px]" title={tx.fromAddress}>
                    {tx.fromAddress.length > 16
                      ? `${tx.fromAddress.slice(0, 6)}...${tx.fromAddress.slice(-4)}`
                      : tx.fromAddress}
                  </td>
                  <td className="py-2.5 px-3 text-[#9CA3AF] truncate max-w-[140px]" title={tx.toAddress}>
                    {tx.toAddress.length > 16
                      ? `${tx.toAddress.slice(0, 6)}...${tx.toAddress.slice(-4)}`
                      : tx.toAddress}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        tx.status === 'Completed'
                          ? 'bg-[#191D23] text-[#22C55E] border-[#2A3038]'
                          : tx.status === 'Refunded'
                          ? 'bg-[#191D23] text-[#9CA3AF] border-[#2A3038]'
                          : tx.status === 'Failed'
                          ? 'bg-[#191D23] text-[#EF4444] border-[#2A3038]'
                          : 'bg-[#191D23] text-[#D6A23D] border-[#2A3038]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectTx(tx);
                      }}
                      className="text-[#D6A23D] hover:underline text-xs font-sans font-medium"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transaction Details Modal */}
      {inspectTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D10]/80 backdrop-blur-sm">
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3038]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D6A23D]" />
                <h3 className="text-base font-semibold text-[#F3F4F6]">Transaction Telemetry</h3>
              </div>
              <button
                onClick={() => setInspectTx(null)}
                className="text-[#737B87] hover:text-[#F3F4F6] text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-[#737B87]">Record ID</div>
                <div className="flex items-center justify-between text-[#F3F4F6] text-xs break-all">
                  <span>{inspectTx.id}</span>
                  <button
                    onClick={() => copyText(inspectTx.id)}
                    className="text-[#D6A23D] hover:text-[#F3F4F6] ml-2"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md">
                  <div className="text-[10px] uppercase tracking-wider text-[#737B87]">Payment Rail</div>
                  <div className="text-[#F3F4F6] font-semibold capitalize mt-0.5">{inspectTx.rail}</div>
                </div>
                <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md">
                  <div className="text-[10px] uppercase tracking-wider text-[#737B87]">Settlement Status</div>
                  <div className="text-[#22C55E] font-semibold mt-0.5">{inspectTx.status}</div>
                </div>
              </div>

              <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-[#737B87]">Amount & Asset</div>
                <div className="text-sm font-bold text-[#F3F4F6]">
                  {inspectTx.targetAmount} {inspectTx.targetAsset}
                </div>
              </div>

              <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-[#737B87]">To / Destination</div>
                <div className="text-[#9CA3AF] break-all text-xs">{inspectTx.toAddress}</div>
              </div>

              {inspectTx.txHash && (
                <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#737B87]">Transaction Hash</div>
                  <div className="flex items-center justify-between text-[#9CA3AF] break-all text-xs">
                    <span>{inspectTx.txHash}</span>
                    {inspectTx.explorerUrl && (
                      <a
                        href={inspectTx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D6A23D] hover:underline ml-2 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#0B0D10] border border-[#2A3038] rounded-md space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-[#737B87]">Verification Provenance</div>
                <div className="text-[#9CA3AF] text-xs capitalize">{inspectTx.provenance.replace('-', ' ')}</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setInspectTx(null)}
                className="w-full py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] border border-[#2A3038] text-[#F3F4F6] font-medium text-xs transition"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

