import React, { useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { type Address } from 'viem';
import {
  ShieldAlert,
  ShieldCheck,
  Pause,
  Play,
  Lock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PAYMENT_ROUTER_ABI,
  DEFAULT_ROUTER_ADDRESS,
  EXPLORER_URL,
} from '../contracts/paymentRouter';

interface AdminTabProps {
  routerAddress: Address;
}

export const AdminTab: React.FC<AdminTabProps> = ({ routerAddress }) => {
  const { address, isConnected } = useAccount();

  const isRouterConfigured = routerAddress && routerAddress !== DEFAULT_ROUTER_ADDRESS;

  // Read contract owner
  const {
    data: ownerData,
    isLoading: isLoadingOwner,
    refetch: _refetchOwner,
  } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'owner',
    query: {
      enabled: isRouterConfigured,
    },
  });

  // Read paused state
  const {
    data: pausedData,
    isLoading: isLoadingPaused,
    refetch: refetchPaused,
  } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'paused',
    query: {
      enabled: isRouterConfigured,
    },
  });

  const ownerAddress = ownerData as Address | undefined;
  const isPaused = Boolean(pausedData);
  const isOwner =
    address &&
    ownerAddress &&
    address.toLowerCase() === ownerAddress.toLowerCase();

  // Write: pause()
  const {
    writeContract: writePause,
    data: pauseTxHash,
    isPending: isPausePending,
    error: pauseError,
  } = useWriteContract();

  const { isLoading: isPauseConfirming, isSuccess: isPauseSuccess } = useWaitForTransactionReceipt({
    hash: pauseTxHash,
  });

  // Write: unpause()
  const {
    writeContract: writeUnpause,
    data: unpauseTxHash,
    isPending: isUnpausePending,
    error: unpauseError,
  } = useWriteContract();

  const { isLoading: isUnpauseConfirming, isSuccess: isUnpauseSuccess } = useWaitForTransactionReceipt({
    hash: unpauseTxHash,
  });

  useEffect(() => {
    if (isPauseSuccess) {
      toast.success('Contract paused successfully.');
      void refetchPaused();
    }
  }, [isPauseSuccess, refetchPaused]);

  useEffect(() => {
    if (isUnpauseSuccess) {
      toast.success('Contract unpaused successfully.');
      void refetchPaused();
    }
  }, [isUnpauseSuccess, refetchPaused]);

  const handlePause = () => {
    if (!isRouterConfigured) return;
    writePause({
      address: routerAddress,
      abi: PAYMENT_ROUTER_ABI,
      functionName: 'pause',
    });
  };

  const handleUnpause = () => {
    if (!isRouterConfigured) return;
    writeUnpause({
      address: routerAddress,
      abi: PAYMENT_ROUTER_ABI,
      functionName: 'unpause',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A3038]">
          <div>
            <h2 className="text-base font-semibold text-[#F3F4F6] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D6A23D]" />
              <span>Contract Administration & Health</span>
            </h2>
            <p className="text-xs text-[#737B87]">
              Governance controls, pause mechanics, and verifiable safety guarantees
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 ${
              isPaused
                ? 'bg-[#191D23] text-[#EF4444] border-[#2A3038]'
                : 'bg-[#191D23] text-[#22C55E] border-[#2A3038]'
            }`}
          >
            {isPaused ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isPaused ? 'Operations Paused' : 'System Operational'}
          </span>
        </div>

        {/* Status Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#737B87]">
              Contract Owner
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#F3F4F6]">
                {isLoadingOwner
                  ? 'Loading...'
                  : ownerAddress
                  ? `${ownerAddress.slice(0, 8)}...${ownerAddress.slice(-6)}`
                  : 'Not deployed / available'}
              </span>
              {ownerAddress && (
                <a
                  href={`${EXPLORER_URL}/address/${ownerAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D6A23D] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {isOwner && (
              <span className="inline-block mt-1 text-[11px] font-medium text-[#D6A23D]">
                ✓ Connected as Contract Owner
              </span>
            )}
          </div>

          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#737B87]">
              Pause Status
            </span>
            <p className="text-xs font-semibold">
              {isLoadingPaused ? (
                <span className="text-[#737B87]">Loading...</span>
              ) : isPaused ? (
                <span className="text-[#EF4444]">Paused (Payments & Refunds disabled)</span>
              ) : (
                <span className="text-[#22C55E]">Unpaused (Normal Operation)</span>
              )}
            </p>
          </div>
        </div>

        {/* Owner Controls */}
        <div className="mt-5 pt-4 border-t border-[#2A3038]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737B87] mb-1.5">Emergency Pause Controls</h3>
          <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
            The owner role has sole permission to invoke <code className="text-[#F3F4F6]">pause()</code> and <code className="text-[#F3F4F6]">unpause()</code>. Pausing does not affect historical payment records or funds (funds are never custodied by the contract).
          </p>

          {!isConnected ? (
            <div className="p-3.5 bg-[#0B0D10] rounded-md border border-[#2A3038] text-center text-xs text-[#737B87]">
              Connect the owner wallet to toggle pause state.
            </div>
          ) : !isOwner ? (
            <div className="p-3.5 bg-[#0B0D10] rounded-md border border-[#2A3038] text-xs text-[#737B87] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#737B87] shrink-0" />
              <span>
                Your connected account is not the contract owner. Pause controls are restricted to the owner address.
              </span>
            </div>
          ) : isPaused ? (
            <button
              type="button"
              onClick={handleUnpause}
              disabled={isUnpausePending || isUnpauseConfirming}
              className="px-4 py-2 rounded-md font-semibold text-xs text-[#22C55E] bg-[#191D23] hover:bg-[#2A3038] border border-[#2A3038] transition flex items-center gap-2 disabled:opacity-40"
            >
              {isUnpausePending || isUnpauseConfirming ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Unpause...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Contract Operations (Unpause)</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              disabled={isPausePending || isPauseConfirming}
              className="px-4 py-2 rounded-md font-semibold text-xs text-[#EF4444] bg-[#191D23] hover:bg-[#2A3038] border border-[#2A3038] transition flex items-center gap-2 disabled:opacity-40"
            >
              {isPausePending || isPauseConfirming ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Pause...</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Emergency Pause All Operations</span>
                </>
              )}
            </button>
          )}

          {(pauseError || unpauseError) && (
            <div className="mt-3 p-3 bg-[#191D23] border border-[#2A3038] rounded-md text-xs text-[#EF4444]">
              <p className="font-semibold mb-1">Execution Error:</p>
              <p className="font-mono text-[11px]">
                {(pauseError || unpauseError)?.message || 'Transaction rejected'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Architecture Box */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-3">
        <h3 className="font-semibold text-sm text-[#F3F4F6] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#D6A23D]" />
          Verifiable Security Properties
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9CA3AF]">
          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1">
            <span className="font-semibold text-[#F3F4F6] block">No Admin Withdrawal</span>
            <p className="text-[#737B87] leading-relaxed">
              There is no <code className="text-[#9CA3AF]">withdraw()</code>, <code className="text-[#9CA3AF]">rescue()</code>, or sweep function. The contract can never transfer tokens to the owner.
            </p>
          </div>
          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1">
            <span className="font-semibold text-[#F3F4F6] block">Zero Custody</span>
            <p className="text-[#737B87] leading-relaxed">
              USDC flows atomically from payer to merchant during pay, and merchant to payer during refund. The router's token balance remains zero.
            </p>
          </div>
          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1">
            <span className="font-semibold text-[#F3F4F6] block">Immutable USDC Address</span>
            <p className="text-[#737B87] leading-relaxed font-mono text-[11px]">
              USDC = 0x3600000000000000000000000000000000000000. Hardcoded constant with 6 decimals.
            </p>
          </div>
          <div className="bg-[#0B0D10] p-3.5 rounded-md border border-[#2A3038] space-y-1">
            <span className="font-semibold text-[#F3F4F6] block">Reentrancy & CEI</span>
            <p className="text-[#737B87] leading-relaxed">
              All state changes follow Checks-Effects-Interactions and OpenZeppelin ReentrancyGuard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
