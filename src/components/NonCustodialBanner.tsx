import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

export const NonCustodialBanner: React.FC = () => {
  return (
    <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6A23D]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D6A23D]">
              Arc Native Non-Custodial Architecture
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#F3F4F6] tracking-tight">
            Direct Payer-to-Merchant Settlement
          </h2>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            CheetahPay never touches or custodies funds. When you pay, USDC is transferred directly from your wallet to the merchant with an immutable cryptographic receipt on Arc.
          </p>
        </div>

        {/* Visual Pipeline Diagram */}
        <div className="flex items-center gap-2 bg-[#0B0D10] p-3 rounded-md border border-[#2A3038] text-xs text-[#9CA3AF] shrink-0 self-stretch md:self-auto justify-around">
          <div className="text-center px-2">
            <div className="w-7 h-7 rounded-md bg-[#191D23] border border-[#2A3038] text-[#F3F4F6] flex items-center justify-center mx-auto mb-1 font-semibold text-[11px]">
              Payer
            </div>
            <span className="text-[10px] text-[#737B87]">Wallet</span>
          </div>

          <div className="flex flex-col items-center px-1">
            <span className="text-[9px] font-mono text-[#D6A23D] mb-0.5 font-medium">USDC</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D6A23D]" />
          </div>

          <div className="text-center px-2 bg-[#191D23] py-1 rounded-md border border-[#2A3038]">
            <div className="w-7 h-7 rounded-md bg-[#0B0D10] text-[#F3F4F6] flex items-center justify-center mx-auto mb-1">
              <Zap className="w-3.5 h-3.5 text-[#D6A23D]" />
            </div>
            <span className="text-[10px] text-[#F3F4F6] font-medium">Router (0 Custody)</span>
          </div>

          <div className="flex flex-col items-center px-1">
            <span className="text-[9px] font-mono text-[#D6A23D] mb-0.5 font-medium">Direct</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D6A23D]" />
          </div>

          <div className="text-center px-2">
            <div className="w-7 h-7 rounded-md bg-[#191D23] border border-[#2A3038] text-[#22C55E] flex items-center justify-center mx-auto mb-1 font-semibold text-[11px]">
              Merchant
            </div>
            <span className="text-[10px] text-[#737B87]">Recipient</span>
          </div>
        </div>
      </div>
    </div>
  );
};

