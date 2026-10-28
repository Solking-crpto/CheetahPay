import React, { useState } from 'react';
import type { Address, Hex } from 'viem';
import {
  RotateCcw,
  Shield,
  FileCheck,
  Lock,
  Zap,
} from 'lucide-react';
import { RefundTab } from '../RefundTab';
import { LookupTab } from '../LookupTab';
import { AdminTab } from '../AdminTab';

interface MerchantToolsViewProps {
  routerAddress: Address;
  onNavigateToShield: () => void;
  onNavigateToArcPay: () => void;
}

export const MerchantToolsView: React.FC<MerchantToolsViewProps> = ({
  routerAddress,
  onNavigateToShield,
  onNavigateToArcPay,
}) => {
  const [activeTool, setActiveTool] = useState<'refund' | 'lookup' | 'admin'>('refund');
  const [selectedPaymentId, setSelectedPaymentId] = useState<Hex | undefined>(undefined);

  const handleInitiateRefundFromLookup = (paymentId: Hex) => {
    setSelectedPaymentId(paymentId);
    setActiveTool('refund');
  };

  return (
    <div className="space-y-6">
      {/* Merchant Header */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="pb-4 border-b border-[#2A3038]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#F3F4F6]">Merchant Operations Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#191D23] text-[#D6A23D] border border-[#2A3038]">
              Multi-Rail Merchant Suite
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Manage customer checkouts, issue non-custodial refunds, inspect on-chain router records, and configure privacy checkouts.
          </p>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="p-3.5 rounded-md bg-[#0B0D10] border border-[#2A3038] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] text-[#9CA3AF] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#F3F4F6]">Arc USDC Checkout</h4>
                <p className="text-[11px] text-[#737B87]">Non-custodial instant settlement</p>
              </div>
            </div>
            <button
              onClick={onNavigateToArcPay}
              className="px-3 py-1 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-xs font-medium text-[#F3F4F6] border border-[#2A3038] transition"
            >
              Open Rail
            </button>
          </div>

          <div className="p-3.5 rounded-md bg-[#0B0D10] border border-[#2A3038] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] text-[#D6A23D] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#F3F4F6]">CheetahPay Shield (Zcash)</h4>
                <p className="text-[11px] text-[#737B87]">Zero-knowledge invoice builder</p>
              </div>
            </div>
            <button
              onClick={onNavigateToShield}
              className="px-3 py-1 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-xs font-medium text-[#D6A23D] border border-[#2A3038] transition"
            >
              Open Rail
            </button>
          </div>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex border-b border-[#2A3038] space-x-1 sm:space-x-2">
        <button
          onClick={() => setActiveTool('refund')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition ${
            activeTool === 'refund'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Issue Merchant Refund</span>
        </button>

        <button
          onClick={() => setActiveTool('lookup')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition ${
            activeTool === 'lookup'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>On-Chain Record Lookup</span>
        </button>

        <button
          onClick={() => setActiveTool('admin')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition ${
            activeTool === 'admin'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Contract Governance</span>
        </button>
      </div>

      {/* Active Tool View */}
      <div>
        {activeTool === 'refund' && (
          <RefundTab routerAddress={routerAddress} initialPaymentId={selectedPaymentId} />
        )}
        {activeTool === 'lookup' && (
          <LookupTab routerAddress={routerAddress} onInitiateRefund={handleInitiateRefundFromLookup} />
        )}
        {activeTool === 'admin' && <AdminTab routerAddress={routerAddress} />}
      </div>
    </div>
  );
};
