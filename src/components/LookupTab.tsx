import React, { useState } from 'react';
import { useReadContract, useAccount, useBytecode } from 'wagmi';
import { isHex, type Address, type Hex } from 'viem';
import {
  Search,
  Receipt,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PAYMENT_ROUTER_ABI,
  formatUsdc,
  DEFAULT_ROUTER_ADDRESS,
  EXPLORER_URL,
  USDC_ADDRESS,
  ARC_TESTNET_CHAIN_ID,
} from '../contracts/paymentRouter';

interface LookupTabProps {
  routerAddress: Address;
  onInitiateRefund: (paymentId: Hex) => void;
}

export const LookupTab: React.FC<LookupTabProps> = ({
  routerAddress,
  onInitiateRefund,
}) => {
  const { address } = useAccount();
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState<Hex | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isRouterConfigured = routerAddress && routerAddress !== DEFAULT_ROUTER_ADDRESS;

  // Verify on-chain deployment of router contract
  const { data: routerBytecode } = useBytecode({
    address: routerAddress,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!isRouterConfigured },
  });

  const isRouterDeployed = Boolean(isRouterConfigured && routerBytecode && routerBytecode !== '0x');

  const { data: paymentData, isLoading, refetch: _refetch } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'getPayment',
    args: activeQuery ? [activeQuery] : undefined,
    query: {
      enabled: isRouterDeployed && !!activeQuery,
    },
  });

  const { data: remainingRaw } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'remainingRefundable',
    args: activeQuery ? [activeQuery] : undefined,
    query: {
      enabled: isRouterDeployed && !!activeQuery,
    },
  });

  const paymentRecord = paymentData as
    | {
        paymentId: Hex;
        payer: Address;
        merchant: Address;
        amount: bigint;
        totalRefunded: bigint;
        status: number;
      }
    | undefined;

  const exists = paymentRecord && paymentRecord.status !== 0;
  const isMerchant =
    address &&
    paymentRecord &&
    address.toLowerCase() === paymentRecord.merchant.toLowerCase();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryInput.trim();
    if (!isHex(clean) || clean.length !== 66) {
      toast.error('Payment ID must be a 32-byte hex string (66 characters beginning with 0x)');
      return;
    }
    setActiveQuery(clean);
  };

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.info('Copied to clipboard');
  };

  // Progress percentage calculation
  const totalAmount = paymentRecord ? Number(formatUsdc(paymentRecord.amount)) : 0;
  const refundedAmount = paymentRecord ? Number(formatUsdc(paymentRecord.totalRefunded)) : 0;
  const refundPercent = totalAmount > 0 ? Math.min(100, Math.round((refundedAmount / totalAmount) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <h2 className="text-base font-semibold text-[#F3F4F6] flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-[#D6A23D]" />
          <span>Payment Explorer & Receipt Verification</span>
        </h2>
        <p className="text-xs text-[#737B87] mb-4">
          Query on-chain state for any payment processed through the CheetahPay PaymentRouter
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search by Payment ID (0x...)"
            className="flex-1 bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none transition"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md font-semibold text-xs text-[#0B0D10] bg-[#D6A23D] hover:bg-[#C29132] transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Lookup
          </button>
        </form>
      </div>

      {/* Query Status / Record Card */}
      {isLoading ? (
        <div className="p-8 text-center text-[#9CA3AF] bg-[#12151A] border border-[#2A3038] rounded-lg">
          <div className="w-5 h-5 border-2 border-[#D6A23D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Querying Arc Testnet node...</p>
        </div>
      ) : activeQuery && !isRouterDeployed ? (
        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-[#D6A23D] mx-auto" />
          <h3 className="text-sm font-semibold text-[#F3F4F6]">Contract Undeployed on Arc Testnet</h3>
          <p className="text-xs text-[#737B87] max-w-md mx-auto">
            PaymentRouter address <code className="text-[#F3F4F6]">{routerAddress}</code> does not contain deployed smart contract bytecode on Arc Testnet (Chain ID {ARC_TESTNET_CHAIN_ID}). Deploy the contract or configure a deployed address in settings.
          </p>
        </div>
      ) : activeQuery && !exists ? (
        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-[#737B87] mx-auto" />
          <h3 className="text-sm font-semibold text-[#F3F4F6]">No Payment Record Found</h3>
          <p className="text-xs text-[#737B87] max-w-md mx-auto">
            Payment ID <span className="font-mono text-[#F3F4F6] break-all">{activeQuery}</span> has not been registered on this contract or may be on another deployment.
          </p>
        </div>
      ) : activeQuery && paymentRecord && exists ? (
        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-5">
          {/* Card Top */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A3038]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#D6A23D]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F3F4F6]">Verified Payment Record</h3>
                <p className="text-xs text-[#737B87] font-mono break-all">{activeQuery}</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded text-[11px] font-medium border self-start sm:self-auto ${
                paymentRecord.status === 2
                  ? 'bg-[#191D23] text-[#9CA3AF] border-[#2A3038]'
                  : 'bg-[#191D23] text-[#22C55E] border-[#2A3038]'
              }`}
            >
              {paymentRecord.status === 2 ? 'Status: Fully Refunded' : 'Status: Confirmed Paid'}
            </span>
          </div>

          {/* Amount Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038]">
              <span className="text-[10px] font-medium text-[#737B87] uppercase tracking-wider block mb-1">
                Total Amount Paid
              </span>
              <p className="text-base font-semibold font-mono text-[#F3F4F6]">
                ${formatUsdc(paymentRecord.amount)} <span className="text-xs text-[#737B87]">USDC</span>
              </p>
            </div>

            <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038]">
              <span className="text-[10px] font-medium text-[#737B87] uppercase tracking-wider block mb-1">
                Refunded So Far
              </span>
              <p className="text-base font-semibold font-mono text-[#9CA3AF]">
                ${formatUsdc(paymentRecord.totalRefunded)} <span className="text-xs text-[#737B87]">USDC</span>
              </p>
            </div>

            <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038]">
              <span className="text-[10px] font-medium text-[#737B87] uppercase tracking-wider block mb-1">
                Remaining Refundable
              </span>
              <p className="text-base font-semibold font-mono text-[#D6A23D]">
                ${remainingRaw ? formatUsdc(remainingRaw as bigint) : '0.00'}{' '}
                <span className="text-xs text-[#737B87]">USDC</span>
              </p>
            </div>
          </div>

          {/* Refund Progress Bar */}
          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1.5">
            <div className="flex justify-between text-xs text-[#737B87]">
              <span>Refund Allocation Progress</span>
              <span className="font-mono text-[#F3F4F6]">{refundPercent}% Refunded</span>
            </div>
            <div className="w-full bg-[#191D23] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#D6A23D] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${refundPercent}%` }}
              />
            </div>
          </div>

          {/* Address Details Table */}
          <div className="bg-[#0B0D10] rounded-md p-3.5 border border-[#2A3038] divide-y divide-[#2A3038] text-xs">
            {/* Payer */}
            <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[#737B87] font-medium w-36">Original Payer:</span>
              <div className="flex items-center gap-2 font-mono text-[#F3F4F6]">
                <span>{paymentRecord.payer}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentRecord.payer, 'payer')}
                  className="p-1 text-[#737B87] hover:text-[#F3F4F6] rounded"
                >
                  {copiedKey === 'payer' ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`${EXPLORER_URL}/address/${paymentRecord.payer}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D6A23D] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Merchant */}
            <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[#737B87] font-medium w-36">Merchant Recipient:</span>
              <div className="flex items-center gap-2 font-mono text-[#F3F4F6]">
                <span>{paymentRecord.merchant}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentRecord.merchant, 'merchant')}
                  className="p-1 text-[#737B87] hover:text-[#F3F4F6] rounded"
                >
                  {copiedKey === 'merchant' ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`${EXPLORER_URL}/address/${paymentRecord.merchant}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D6A23D] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Token */}
            <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[#737B87] font-medium w-36">Payment Asset:</span>
              <div className="flex items-center gap-2 font-mono text-[#F3F4F6]">
                <span className="text-[#D6A23D]">USDC ({USDC_ADDRESS})</span>
                <a
                  href={`${EXPLORER_URL}/token/${USDC_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D6A23D] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Action to refund if caller is merchant */}
          {isMerchant && paymentRecord.status !== 2 && (
            <div className="bg-[#191D23] border border-[#2A3038] rounded-md p-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#F3F4F6]">You are the merchant for this payment</p>
                <p className="text-xs text-[#737B87]">You can issue a partial or full refund to the customer</p>
              </div>
              <button
                type="button"
                onClick={() => onInitiateRefund(activeQuery)}
                className="px-3.5 py-1.5 bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-semibold text-xs rounded-md transition flex items-center gap-1.5 shrink-0"
              >
                <span>Initiate Refund</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
