import React from 'react';
import { useAccount, useBalance, useReadContract, useBytecode } from 'wagmi';
import { Coins, Flame, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import {
  ARC_TESTNET_CHAIN_ID,
  USDC_ADDRESS,
  PAYMENT_ROUTER_ABI,
  ERC20_ABI,
  formatUsdc,
  type Address,
  DEFAULT_ROUTER_ADDRESS,
} from '../contracts/paymentRouter';

interface StatsBarProps {
  routerAddress: Address;
}

export const StatsBar: React.FC<StatsBarProps> = ({ routerAddress }) => {
  const { address, isConnected } = useAccount();

  // Native Gas balance (on Arc this is native gas token)
  const { data: nativeBalance } = useBalance({
    address,
    chainId: ARC_TESTNET_CHAIN_ID,
  });

  // Arc USDC ERC-20 token balance (6 decimals)
  const { data: usdcBalanceRaw, refetch: _refetchUsdc } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
  });

  // Verify whether router is a deployed contract with bytecode
  const isRouterConfigured = routerAddress && routerAddress !== DEFAULT_ROUTER_ADDRESS;
  const { data: routerBytecode } = useBytecode({
    address: routerAddress,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!isRouterConfigured },
  });

  const isRouterDeployed = Boolean(isRouterConfigured && routerBytecode && routerBytecode !== '0x');

  // Check Router pause status (only if deployed)
  const { data: isPaused } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'paused',
    chainId: ARC_TESTNET_CHAIN_ID,
    query: {
      enabled: isRouterDeployed,
    },
  });

  // Check Router owner (only if deployed)
  const { data: ownerAddress } = useReadContract({
    address: routerAddress,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'owner',
    chainId: ARC_TESTNET_CHAIN_ID,
    query: {
      enabled: isRouterDeployed,
    },
  });

  const isOwner = address && ownerAddress && address.toLowerCase() === (ownerAddress as string).toLowerCase();

  if (!isConnected) {
    return null;
  }

  const usdcFormatted = usdcBalanceRaw !== undefined ? formatUsdc(usdcBalanceRaw as bigint) : '0.00';

  return (
    <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* USDC Balance */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#D6A23D] shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#737B87]">USDC Balance</p>
            <p className="text-sm font-semibold text-[#F3F4F6] truncate">
              ${Number(usdcFormatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}{' '}
              <span className="text-[11px] font-normal text-[#737B87]">USDC</span>
            </p>
          </div>
        </div>

        {/* Native Gas Token */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#737B87] shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#737B87]">Gas Token</p>
            <p className="text-sm font-semibold text-[#F3F4F6] truncate">
              {nativeBalance ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}` : '0.0000'}
            </p>
          </div>
        </div>

        {/* Contract Health */}
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 ${
              !isRouterDeployed
                ? 'bg-[#191D23] border-[#2A3038] text-[#D6A23D]'
                : isPaused
                ? 'bg-[#191D23] border-[#2A3038] text-[#EF4444]'
                : 'bg-[#191D23] border-[#2A3038] text-[#22C55E]'
            }`}
          >
            {isPaused ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#737B87]">Router Status</p>
            <p className="text-xs font-semibold truncate">
              {!isRouterConfigured ? (
                <span className="text-[#D6A23D]">Needs Address</span>
              ) : !isRouterDeployed ? (
                <span className="text-[#D6A23D]">Undeployed on Arc</span>
              ) : isPaused ? (
                <span className="text-[#EF4444]">Paused by Owner</span>
              ) : (
                <span className="text-[#22C55E]">Active & Ready</span>
              )}
            </p>
          </div>
        </div>

        {/* Role Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#737B87] shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#737B87]">Your Role</p>
            <p className="text-xs font-semibold text-[#F3F4F6] truncate">
              {isOwner ? (
                <span className="text-[#D6A23D]">Contract Owner</span>
              ) : (
                <span className="text-[#9CA3AF]">Payer / Merchant</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
