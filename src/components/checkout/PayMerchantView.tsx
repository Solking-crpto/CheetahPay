import React, { useState } from 'react';
import { CreditCard, RotateCcw, Search, Lock } from 'lucide-react';
import type { Address, Hex } from 'viem';
import { PayTab } from '../PayTab';
import { RefundTab } from '../RefundTab';
import { LookupTab } from '../LookupTab';
import { AdminTab } from '../AdminTab';
import { StatsBar } from '../StatsBar';
import { NonCustodialBanner } from '../NonCustodialBanner';

interface PayMerchantViewProps {
  routerAddress: Address;
  onOpenConfig: () => void;
  onPaymentSuccess?: () => void;
}

type SubTab = 'pay' | 'refund' | 'lookup' | 'admin';

export const PayMerchantView: React.FC<PayMerchantViewProps> = ({
  routerAddress,
  onOpenConfig,
  onPaymentSuccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pay');
  const [selectedRefundId, setSelectedRefundId] = useState<Hex | undefined>(undefined);

  const handleSelectRefund = (paymentId: Hex) => {
    setSelectedRefundId(paymentId);
    setActiveSubTab('refund');
  };

  return (
    <div className="space-y-6">
      {/* Banner & Telemetry */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A3038]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#F3F4F6]">Web3 to Web2: Pay Merchant</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#191D23] text-[#9CA3AF] border border-[#2A3038]">
                Arc USDC Non-Custodial Router
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Direct peer-to-merchant USDC routing. The PaymentRouter holds zero custody and transfers funds atomically.
            </p>
          </div>

          <button
            onClick={onOpenConfig}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] transition"
          >
            Router Config
          </button>
        </div>

        {/* Live On-Chain Router Stats */}
        <div className="mt-4">
          <StatsBar routerAddress={routerAddress} />
        </div>
      </div>

      {/* Non-Custodial Security Facts */}
      <NonCustodialBanner />

      {/* Sub Navigation Bar */}
      <div className="flex border-b border-[#2A3038] space-x-1 sm:space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('pay')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'pay'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pay & Checkout</span>
        </button>

        <button
          onClick={() => setActiveSubTab('refund')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'refund'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Merchant Refunds</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lookup')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'lookup'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Payment Explorer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('admin')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'admin'
              ? 'border-[#D6A23D] text-[#D6A23D] bg-[#191D23] rounded-t-md'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Admin & Pause Security</span>
        </button>
      </div>

      {/* Sub Views */}
      <div>
        {activeSubTab === 'pay' && (
          <PayTab
            routerAddress={routerAddress}
            onPaymentSuccess={() => {
              if (onPaymentSuccess) onPaymentSuccess();
            }}
            onSelectPaymentForRefund={handleSelectRefund}
          />
        )}

        {activeSubTab === 'refund' && (
          <RefundTab
            routerAddress={routerAddress}
            initialPaymentId={selectedRefundId}
          />
        )}

        {activeSubTab === 'lookup' && (
          <LookupTab
            routerAddress={routerAddress}
            onInitiateRefund={handleSelectRefund}
          />
        )}

        {activeSubTab === 'admin' && (
          <AdminTab routerAddress={routerAddress} />
        )}
      </div>
    </div>
  );
};
