import React, { useState, useEffect } from 'react';
import { type Hex } from 'viem';
import {
  History,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Search,
  Trash2,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  STORAGE_PAYMENTS_KEY,
  type StoredPayment,
  EXPLORER_URL,
} from '../contracts/paymentRouter';

interface RecentActivityProps {
  onSelectRefund: (paymentId: Hex) => void;
  onSelectLookup: (paymentId: Hex) => void;
  refreshTrigger?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  onSelectRefund,
  onSelectLookup,
  refreshTrigger,
}) => {
  const [payments, setPayments] = useState<StoredPayment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPayments = () => {
    try {
      const stored = localStorage.getItem(STORAGE_PAYMENTS_KEY);
      if (stored) {
        setPayments(JSON.parse(stored) as StoredPayment[]);
      } else {
        setPayments([]);
      }
    } catch (e) {
      console.error('Failed to parse recent payments', e);
      setPayments([]);
    }
  };

  useEffect(() => {
    setTimeout(loadPayments, 0);
  }, [refreshTrigger]);

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_PAYMENTS_KEY);
    setPayments([]);
    toast.info('Recent payments history cleared');
  };

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.info('Copied to clipboard');
  };

  if (payments.length === 0) {
    return (
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 text-center text-[#737B87]">
        <Receipt className="w-6 h-6 text-[#737B87] mx-auto mb-2" />
        <h4 className="font-semibold text-[#F3F4F6] text-xs">No Recent Payments Yet</h4>
        <p className="text-[11px] text-[#737B87] mt-1">
          When you make checkouts, receipts and Payment IDs will be saved here for quick lookup and refunds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3038]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#D6A23D]" />
          <h3 className="font-semibold text-[#F3F4F6] text-sm">Recent Payment History</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#191D23] text-[#9CA3AF] border border-[#2A3038]">
            {payments.length}
          </span>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-xs text-[#737B87] hover:text-[#EF4444] flex items-center gap-1.5 transition px-2 py-1 rounded hover:bg-[#191D23]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[#737B87] border-b border-[#2A3038] uppercase text-[10px] tracking-wider">
              <th className="py-2 pr-4">Payment ID</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Merchant</th>
              <th className="py-2 px-4">Time</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A3038] font-mono">
            {payments.map((p) => {
              const dateStr = new Date(p.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={p.paymentId} className="hover:bg-[#191D23]/60 transition">
                  {/* Payment ID */}
                  <td className="py-2.5 pr-4 text-[#F3F4F6]">
                    <div className="flex items-center gap-1.5">
                      <span>{p.paymentId.slice(0, 10)}...{p.paymentId.slice(-6)}</span>
                      <button
                        onClick={() => copyToClipboard(p.paymentId, p.paymentId)}
                        className="text-[#737B87] hover:text-[#F3F4F6] p-1 rounded"
                        title="Copy full paymentId"
                      >
                        {copiedId === p.paymentId ? (
                          <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-2.5 px-4 font-semibold text-[#F3F4F6]">
                    ${p.amount} USDC
                  </td>

                  {/* Merchant */}
                  <td className="py-2.5 px-4 text-[#9CA3AF]">
                    {p.merchant.slice(0, 6)}...{p.merchant.slice(-4)}
                  </td>

                  {/* Time */}
                  <td className="py-2.5 px-4 text-[#737B87] font-sans text-[11px]">
                    {dateStr}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-4 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        p.status === 'FullyRefunded'
                          ? 'bg-[#191D23] text-[#9CA3AF] border-[#2A3038]'
                          : p.status === 'PartiallyRefunded'
                          ? 'bg-[#191D23] text-[#D6A23D] border-[#2A3038]'
                          : 'bg-[#191D23] text-[#22C55E] border-[#2A3038]'
                      }`}
                    >
                      {p.status || 'Paid'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 pl-4 text-right space-x-1 font-sans">
                    <button
                      onClick={() => onSelectLookup(p.paymentId)}
                      className="p-1 text-[#737B87] hover:text-[#F3F4F6] rounded transition"
                      title="Inspect Payment Record"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectRefund(p.paymentId)}
                      className="p-1 text-[#737B87] hover:text-[#D6A23D] rounded transition"
                      title="Manage Refund"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`${EXPLORER_URL}/tx/${p.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block p-1 text-[#737B87] hover:text-[#D6A23D] rounded transition"
                      title="View on Arc Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
