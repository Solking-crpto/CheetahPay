import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBytecode,
} from 'wagmi';
import { isHex, type Address, type Hex } from 'viem';
import { toast } from 'sonner';
import {
  RotateCcw,
  Search,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  USDC_ADDRESS,
  PAYMENT_ROUTER_ABI,
  ERC20_ABI,
  formatUsdc,
  parseUsdc,
  DEFAULT_ROUTER_ADDRESS,
  EXPLORER_URL,
  STORAGE_PAYMENTS_KEY,
  type StoredPayment,
  ARC_TESTNET_CHAIN_ID,
} from '../contracts/paymentRouter';

interface RefundTabProps {
  routerAddress: Address;
  initialPaymentId?: Hex;
}

export const RefundTab: React.FC<RefundTabProps> = ({
  routerAddress,
  initialPaymentId,
}) => {
  const { address, isConnected } = useAccount();

  const [searchId, setSearchId] = useState<string>(initialPaymentId || '');
  const [activeId, setActiveId] = useState<Hex | null>(
    initialPaymentId && isHex(initialPaymentId) && initialPaymentId.length === 66
      ? initialPaymentId
      : null
  );
  const [refundAmountStr, setRefundAmountStr] = useState<string>('');

  useEffect(() => {
    if (initialPaymentId && isHex(initialPaymentId) && initialPaymentId.length === 66) {
      setTimeout(() => {
        setSearchId(initialPaymentId);
        setActiveId(initialPaymentId);
      }, 0);
    }
  }, [initialPaymentId]);

  const isRouterConfigured = routerAddress && routerAddress !== DEFAULT_ROUTER_ADDRESS;

  // Verify on-chain deployment of the configured router contract
  const { data: routerBytecode } = useBytecode({
    address: routerAddress,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!isRouterConfigured },
  });

  const isRouterDeployed = Boolean(isRouterConfigured && routerBytecode && routerBytecode !== '0x');

  // Query payment record from contract
  const {
    data: paymentData,
    isLoading: isLoadingPayment,
    refetch: refetchPayment,
  } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'getPayment',
    args: activeId ? [activeId] : undefined,
    query: {
      enabled: isRouterDeployed && !!activeId,
    },
  });

  // Query remaining refundable from contract
  const {
    data: remainingRefundableRaw,
    refetch: refetchRemaining,
  } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'remainingRefundable',
    args: activeId ? [activeId] : undefined,
    query: {
      enabled: isRouterDeployed && !!activeId,
    },
  });

  // Extract payment details
  // struct Payment: [paymentId, payer, merchant, amount, totalRefunded, status]
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

  const paymentExists = paymentRecord && paymentRecord.status !== 0; // 0 = NonExistent
  const isFullyRefunded = paymentRecord && paymentRecord.status === 2; // 2 = FullyRefunded
  const remainingBigInt = (remainingRefundableRaw as bigint | undefined) ?? (paymentRecord ? paymentRecord.amount - paymentRecord.totalRefunded : 0n);

  const isMerchant =
    address &&
    paymentRecord &&
    address.toLowerCase() === paymentRecord.merchant.toLowerCase();

  // Set default refund amount when payment loads
  useEffect(() => {
    if (paymentExists && remainingBigInt > 0n && !refundAmountStr) {
      setTimeout(() => {
        setRefundAmountStr(formatUsdc(remainingBigInt));
      }, 0);
    }
  }, [paymentExists, remainingBigInt, refundAmountStr]);

  const parsedRefundAmount = parseUsdc(refundAmountStr);

  // Read merchant's USDC balance
  const { data: merchantBalanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isMerchant },
  });

  // Read merchant's allowance for PaymentRouter
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isRouterDeployed ? [address, routerAddress] : undefined,
    query: { enabled: !!address && isRouterDeployed && isMerchant },
  });

  const merchantBalance = (merchantBalanceRaw as bigint | undefined) ?? 0n;
  const currentAllowance = (allowanceRaw as bigint | undefined) ?? 0n;
  const needsApproval = isMerchant && parsedRefundAmount > 0n && currentAllowance < parsedRefundAmount;
  const hasInsufficientMerchantBalance = isMerchant && parsedRefundAmount > 0n && merchantBalance < parsedRefundAmount;
  const exceedsRemaining = parsedRefundAmount > remainingBigInt;

  // Approve Contract Write
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('USDC allowance approved for refund!');
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Refund Contract Write
  const {
    writeContract: writeRefund,
    data: refundTxHash,
    isPending: isRefundPending,
    error: refundError,
  } = useWriteContract();

  const { isLoading: isRefundConfirming, isSuccess: isRefundSuccess } = useWaitForTransactionReceipt({
    hash: refundTxHash,
  });

  useEffect(() => {
    if (isRefundSuccess) {
      toast.success(`Successfully refunded ${refundAmountStr} USDC to original payer!`);
      void refetchPayment();
      void refetchRemaining();
      void refetchAllowance();

      // Update local storage status if this payment was tracked
      try {
        const stored = localStorage.getItem(STORAGE_PAYMENTS_KEY);
        if (stored && activeId) {
          const list = JSON.parse(stored) as StoredPayment[];
          const updated = list.map((p) => {
            if (p.paymentId.toLowerCase() === activeId.toLowerCase()) {
              return {
                ...p,
                refundedAmount: refundAmountStr,
                status: parsedRefundAmount === remainingBigInt ? ('FullyRefunded' as const) : ('PartiallyRefunded' as const),
              };
            }
            return p;
          });
          localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Failed to update stored payment after refund', e);
      }
    }
  }, [isRefundSuccess]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchId.trim();
    if (!isHex(clean) || clean.length !== 66) {
      toast.error('Payment ID must be a valid 32-byte hex string (66 characters starting with 0x)');
      return;
    }
    setActiveId(clean);
  };

  const handleApprove = () => {
    if (!isRouterConfigured) return;
    writeApprove({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [routerAddress, parsedRefundAmount],
    });
  };

  const handleRefund = () => {
    if (!isRouterConfigured || !activeId) return;
    if (parsedRefundAmount <= 0n) {
      toast.error('Refund amount must be greater than zero.');
      return;
    }
    if (exceedsRemaining) {
      toast.error('Refund amount cannot exceed remaining refundable balance.');
      return;
    }

    writeRefund({
      address: routerAddress,
      abi: PAYMENT_ROUTER_ABI,
      functionName: 'refund',
      args: [activeId, parsedRefundAmount],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Search and Action Box */}
      <div className="lg:col-span-7 bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A3038]">
          <div>
            <h2 className="text-base font-semibold text-[#F3F4F6] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#D6A23D]" />
              <span>Merchant Refund Center</span>
            </h2>
            <p className="text-xs text-[#737B87]">
              Look up a confirmed payment and return USDC directly to the original payer
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#191D23] text-[#D6A23D] border border-[#2A3038]">
            Merchant Only
          </span>
        </div>

        {/* Payment ID Search Form */}
        <form onSubmit={handleSearch} className="mt-5">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-2">
            Enter Payment ID to Refund
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none transition"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md font-semibold text-xs text-[#0B0D10] bg-[#D6A23D] hover:bg-[#C29132] transition flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Find Record
            </button>
          </div>
        </form>

        {/* Results Area */}
        <div className="mt-5">
          {isLoadingPayment ? (
            <div className="p-8 text-center text-[#9CA3AF] flex flex-col items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[#D6A23D]" />
              <p className="text-xs">Fetching on-chain payment record...</p>
            </div>
          ) : !activeId ? (
            <div className="p-6 bg-[#0B0D10] rounded-md border border-[#2A3038] text-center text-[#737B87] text-xs">
              Enter a 32-byte Payment ID above to check payment details and issue refunds.
            </div>
          ) : !paymentExists ? (
            <div className="p-5 bg-[#0B0D10] rounded-md border border-[#2A3038] text-center space-y-2">
              <AlertCircle className="w-5 h-5 text-[#EF4444] mx-auto" />
              <p className="text-xs font-semibold text-[#F3F4F6]">Payment Not Found</p>
              <p className="text-xs text-[#737B87]">
                No confirmed payment with ID <span className="font-mono text-[#F3F4F6]">{activeId}</span> exists in this PaymentRouter contract.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Details Card */}
              <div className="bg-[#0B0D10] rounded-md p-4 border border-[#2A3038] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#2A3038]">
                  <span className="text-[#737B87]">Payment Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      isFullyRefunded
                        ? 'bg-[#191D23] text-[#9CA3AF] border-[#2A3038]'
                        : 'bg-[#191D23] text-[#22C55E] border-[#2A3038]'
                    }`}
                  >
                    {isFullyRefunded ? 'Fully Refunded' : 'Paid & Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-1">
                  <div>
                    <span className="text-[#737B87] block">Original Paid:</span>
                    <span className="text-sm font-semibold font-mono text-[#F3F4F6]">
                      ${formatUsdc(paymentRecord.amount)} USDC
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737B87] block">Remaining Refundable:</span>
                    <span className="text-sm font-semibold font-mono text-[#D6A23D]">
                      ${formatUsdc(remainingBigInt)} USDC
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2A3038] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#737B87]">Original Payer:</span>
                    <span className="font-mono text-[#9CA3AF]">{paymentRecord.payer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737B87]">Merchant Recipient:</span>
                    <span className="font-mono text-[#9CA3AF]">{paymentRecord.merchant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737B87]">Total Already Refunded:</span>
                    <span className="font-mono text-[#9CA3AF]">${formatUsdc(paymentRecord.totalRefunded)} USDC</span>
                  </div>
                </div>
              </div>

              {/* Merchant Verification Check */}
              {!isConnected ? (
                <div className="p-3.5 bg-[#0B0D10] rounded-md border border-[#2A3038] text-center text-xs text-[#737B87]">
                  Connect your wallet to execute refunds.
                </div>
              ) : !isMerchant ? (
                <div className="p-3.5 bg-[#191D23] border border-[#2A3038] rounded-md text-[#9CA3AF] text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D6A23D]" />
                  <div>
                    <p className="font-medium text-[#F3F4F6] mb-1">Access Restricted: Not the Merchant</p>
                    <p className="text-[11px] text-[#737B87]">
                      Your connected address (<span className="font-mono text-[#F3F4F6]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>) does not match the merchant address for this payment. Only the recorded merchant can call <code className="text-[#D6A23D] font-mono">refund()</code>.
                    </p>
                  </div>
                </div>
              ) : isFullyRefunded ? (
                <div className="p-3.5 bg-[#191D23] border border-[#2A3038] rounded-md text-[#22C55E] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>This payment has already been 100% refunded to the customer. No further refunds are allowed.</span>
                </div>
              ) : (
                /* Refund Execution Form */
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#737B87]">
                        Refund Amount (USDC)
                      </label>
                      <span className="text-xs text-[#737B87]">
                        Max Eligible: ${formatUsdc(remainingBigInt)} USDC
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={refundAmountStr}
                        onChange={(e) => setRefundAmountStr(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md pl-3.5 pr-16 py-2 font-mono text-sm font-semibold text-[#F3F4F6] outline-none transition"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#191D23] border border-[#2A3038] px-2 py-0.5 rounded text-xs font-medium text-[#D6A23D]">
                        USDC
                      </div>
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setRefundAmountStr(formatUsdc(remainingBigInt))}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#191D23] text-[#D6A23D] border border-[#2A3038] hover:bg-[#2A3038] transition"
                      >
                        100% Full Refund (${formatUsdc(remainingBigInt)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundAmountStr(formatUsdc(remainingBigInt / 2n))}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#0B0D10] hover:bg-[#191D23] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2A3038] transition"
                      >
                        50% Partial Refund
                      </button>
                    </div>

                    {hasInsufficientMerchantBalance && (
                      <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Insufficient USDC balance in your merchant wallet
                      </p>
                    )}
                    {exceedsRemaining && (
                      <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Refund cannot exceed remaining refundable balance
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {needsApproval ? (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isApprovePending || isApproveConfirming || hasInsufficientMerchantBalance}
                      className="w-full py-2.5 px-4 rounded-md font-semibold text-xs text-[#0B0D10] bg-[#D6A23D] hover:bg-[#C29132] transition disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isApprovePending || isApproveConfirming ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Approving USDC Allowance...</span>
                        </>
                      ) : (
                        <>
                          <span>Step 1: Approve {refundAmountStr} USDC for Refund</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={
                        isRefundPending ||
                        isRefundConfirming ||
                        parsedRefundAmount <= 0n ||
                        exceedsRemaining ||
                        hasInsufficientMerchantBalance
                      }
                      className="w-full py-2.5 px-4 rounded-md font-semibold text-xs text-[#F3F4F6] bg-[#191D23] hover:bg-[#2A3038] border border-[#2A3038] transition disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isRefundPending || isRefundConfirming ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Refund to Customer on Arc...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm & Send Refund of {refundAmountStr} USDC</span>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}

                  {(approveError || refundError) && (
                    <div className="p-3 bg-[#191D23] border border-[#2A3038] rounded-md text-xs text-[#EF4444]">
                      <p className="font-semibold mb-1">Transaction Failed:</p>
                      <p className="font-mono text-[11px] truncate">
                        {(approveError || refundError)?.message || 'Contract reverted.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Security & Rules Info Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
          <h3 className="font-semibold text-sm text-[#F3F4F6] mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D6A23D]" /> On-Chain Refund Security Guarantees
          </h3>
          <ul className="space-y-3 text-xs text-[#9CA3AF] leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                •
              </span>
              <span>
                <strong className="text-[#F3F4F6]">Merchant Authorization Only:</strong> Only the original recipient address recorded on-chain during <code className="text-[#D6A23D]">pay()</code> can authorize refunds.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                •
              </span>
              <span>
                <strong className="text-[#F3F4F6]">Cumulative Refund Ceiling:</strong> The smart contract strictly verifies that <code className="text-[#D6A23D]">totalRefunded + amount &le; originalAmount</code>. Over-refunding reverts automatically.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                •
              </span>
              <span>
                <strong className="text-[#F3F4F6]">Direct Return to Payer:</strong> Funds are pulled from the merchant directly back to the original payer's address with zero intermediary escrow.
              </span>
            </li>
          </ul>
        </div>

        {refundTxHash && (
          <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5 text-xs">
            <p className="font-semibold text-[#22C55E] mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Refund Transaction Submitted
            </p>
            <a
              href={`${EXPLORER_URL}/tx/${refundTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#D6A23D] hover:underline flex items-center gap-1 font-mono text-xs mt-2"
            >
              View on Arc Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
