import React, { useState } from 'react';
import { isAddress, type Address } from 'viem';
import { useBytecode } from 'wagmi';
import {
  Shield,
  CreditCard,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_ROUTER_ADDRESS,
  ARC_TESTNET_CHAIN_ID,
} from '../../contracts/paymentRouter';
import { FiatOnrampService } from '../../services/fiatOnrampService';
import {
  ZEC_DEFAULT_TESTNET_UNIFIED,
} from '../../services/zcashShieldService';

interface SettingsViewProps {
  currentRouterAddress: Address;
  onSaveRouterAddress: (addr: Address) => void;
  onNavigateToLegacyArc?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRouterAddress,
  onSaveRouterAddress,
  onNavigateToLegacyArc,
}) => {
  // Zcash Settings
  const [zcashNetwork, setZcashNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [requiredConfirmations, setRequiredConfirmations] = useState<number>(3);
  const [defaultMerchantAddress, setDefaultMerchantAddress] = useState<string>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('cheetahpay_zcash_merchant_address') || ZEC_DEFAULT_TESTNET_UNIFIED
      : ZEC_DEFAULT_TESTNET_UNIFIED;
  });

  // Provider Keys
  const [circleApiKey, setCircleApiKey] = useState(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('cheetahpay_circle_api_key') || ''
      : '';
  });
  const [isTestingCircle, setIsTestingCircle] = useState(false);
  const [circleTestResult, setCircleTestResult] = useState<{
    connected: boolean;
    statusCode: number;
    message: string;
  } | null>(null);

  // Legacy Router Config (Collapsible)
  const [showLegacyArcSection, setShowLegacyArcSection] = useState(false);
  const [routerInput, setRouterInput] = useState(currentRouterAddress);

  // Check bytecode on Arc Testnet for legacy router
  const isRouterConfigured = currentRouterAddress && currentRouterAddress !== DEFAULT_ROUTER_ADDRESS;
  const { data: routerBytecode } = useBytecode({
    address: currentRouterAddress,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!isRouterConfigured },
  });

  const isRouterDeployed = Boolean(isRouterConfigured && routerBytecode && routerBytecode !== '0x');

  const handleSaveZcashSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cheetahpay_zcash_merchant_address', defaultMerchantAddress.trim());
        localStorage.setItem('cheetahpay_zcash_confirmations', requiredConfirmations.toString());
      }
      toast.success('Zcash network parameters updated!');
    } catch {
      toast.error('Failed to save Zcash settings');
    }
  };

  const handleTestCircleConnection = async () => {
    if (!circleApiKey.trim()) {
      toast.error('Please enter a Circle API key to test.');
      return;
    }
    setIsTestingCircle(true);
    setCircleTestResult(null);
    try {
      const res = await FiatOnrampService.testCircleConnection(circleApiKey);
      setCircleTestResult(res);
      if (res.connected) {
        toast.success('Circle API connected successfully!');
      } else {
        toast.error(`Circle API test failed (HTTP ${res.statusCode})`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsTestingCircle(false);
    }
  };

  const handleSaveProviderKeys = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof localStorage !== 'undefined') {
        if (circleApiKey.trim()) {
          localStorage.setItem('cheetahpay_circle_api_key', circleApiKey.trim());
          toast.success('Circle API credentials saved to local session');
        } else {
          localStorage.removeItem('cheetahpay_circle_api_key');
          toast.info('Circle API credentials cleared');
        }
      }
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleSaveRouter = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = routerInput.trim();
    if (!isAddress(clean)) {
      toast.error('Invalid Ethereum/Arc contract address format');
      return;
    }
    onSaveRouterAddress(clean);
    toast.success('Legacy PaymentRouter address updated');
  };

  const handleClearLocalLedger = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cheetahpay_recent_payments');
        localStorage.removeItem('cheetahpay_fiat_funding_records');
        localStorage.removeItem('cheetahpay_zcash_invoices');
        toast.success('Local transaction cache cleared');
      }
    } catch {
      toast.error('Failed to clear data');
    }
  };

  const providerStatus = FiatOnrampService.checkProviderStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Settings Header */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6">
        <div className="pb-4 border-b border-[#2A3038]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#F3F4F6]">System Infrastructure & Settings</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#191D23] text-[#D6A23D] border border-[#2A3038]">
              CheetahPay Shield
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Configure native Zcash network parameters, fiat gateway API credentials, and review legacy settlement archives.
          </p>
        </div>
      </div>

      {/* 1. Primary: Zcash Network & Shield Parameters */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A3038]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#D6A23D]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F3F4F6]">Zcash Privacy Network Settings</h2>
              <p className="text-xs text-[#737B87]">Primary settlement network for CheetahPay Shield</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-md bg-[#0B0D10] border border-[#2A3038] text-[#22C55E] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>NU5 Active</span>
          </span>
        </div>

        <form onSubmit={handleSaveZcashSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-1.5">
                Target Zcash Network
              </label>
              <select
                value={zcashNetwork}
                onChange={(e) => setZcashNetwork(e.target.value as 'testnet' | 'mainnet')}
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 text-xs text-[#F3F4F6] outline-none"
              >
                <option value="testnet">Zcash Testnet (NU5 - Recommended for Demo)</option>
                <option value="mainnet">Zcash Mainnet (Live Production)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-1.5">
                Required Confirmations for Invoice Settlement
              </label>
              <select
                value={requiredConfirmations}
                onChange={(e) => setRequiredConfirmations(parseInt(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 text-xs text-[#F3F4F6] outline-none"
              >
                <option value={1}>1 Block Confirmation (Fastest)</option>
                <option value={3}>3 Block Confirmations (Standard / Recommended)</option>
                <option value={6}>6 Block Confirmations (Maximum Security)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-1.5">
              Default Merchant Unified / Receiving Address
            </label>
            <input
              type="text"
              value={defaultMerchantAddress}
              onChange={(e) => setDefaultMerchantAddress(e.target.value.trim())}
              placeholder="utest1... or tm..."
              className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none"
            />
          </div>

          <div className="p-3 bg-[#0B0D10] rounded-md border border-[#2A3038] text-xs text-[#9CA3AF] flex flex-wrap items-center justify-between gap-2">
            <span>Authoritative REST Verifier Node:</span>
            <code className="text-xs text-[#D6A23D] font-mono">https://sochain.com/api/v3/transaction/ZECTEST</code>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] font-semibold text-xs transition"
            >
              Save Zcash Parameters
            </button>
          </div>
        </form>
      </div>

      {/* 2. Fiat Gateway API Configuration */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A3038]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#737B87]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F3F4F6]">Fiat On-Ramp Gateway Credentials</h2>
              <p className="text-xs text-[#737B87]">Link institutional API keys for live fiat payment execution</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-md bg-[#0B0D10] border border-[#2A3038] text-[#9CA3AF]">
            {providerStatus.providerName}
          </span>
        </div>

        <form onSubmit={handleSaveProviderKeys} className="space-y-4">
          <div className="p-3 bg-[#191D23] border border-[#2A3038] rounded-md text-xs text-[#9CA3AF] space-y-1">
            <span className="font-semibold text-[#F3F4F6] block">Security Invariant: Backend Secret Custody</span>
            <p className="text-[11px] text-[#737B87]">
              Production Circle/Stripe API secret keys must never be stored in browser storage. In production deployment, card authorization and USDC minting calls route through an authenticated backend proxy (<code className="text-[#D6A23D]">/api/circle</code>). The field below is strictly for sandbox connectivity evaluation.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-1.5">
              Circle API Key (Sandbox Token Evaluation)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={circleApiKey}
                onChange={(e) => setCircleApiKey(e.target.value)}
                placeholder="QVBJX0tFWTpkZWZhdWx0..."
                className="flex-1 bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none"
              />
              <button
                type="button"
                onClick={handleTestCircleConnection}
                disabled={isTestingCircle}
                className="px-3.5 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] text-xs font-medium flex items-center gap-1.5 transition"
              >
                {isTestingCircle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {circleTestResult && (
            <div
              className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
                circleTestResult.connected
                  ? 'bg-[#191D23] border-[#2A3038] text-[#22C55E]'
                  : 'bg-[#191D23] border-[#2A3038] text-[#EF4444]'
              }`}
            >
              {circleTestResult.connected ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              )}
              <span>{circleTestResult.message}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] font-medium text-xs border border-[#2A3038] transition"
            >
              Save Gateway Keys
            </button>
          </div>
        </form>
      </div>

      {/* 3. Cache & Ledger Management */}
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg p-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#F3F4F6]">Local Session & Ledger Cache</h2>
          <p className="text-xs text-[#737B87] mt-0.5">
            Reset locally cached invoices and test transactions without affecting on-chain history.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearLocalLedger}
          className="px-3.5 py-2 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#EF4444] border border-[#2A3038] text-xs font-medium flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Local Cache</span>
        </button>
      </div>

      {/* 4. Isolated Archive: Legacy Arc PaymentRouter (EVM) */}
      <div className="border border-[#2A3038] rounded-lg bg-[#12151A] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLegacyArcSection(!showLegacyArcSection)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-[#191D23] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#9CA3AF] text-xs font-bold font-mono">
              ARC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#F3F4F6]">Archive: Legacy Arc USDC PaymentRouter</span>
                <span className="px-2 py-0.5 rounded-md bg-[#0B0D10] text-[10px] text-[#737B87] font-mono border border-[#2A3038]">
                  EVM Contract
                </span>
              </div>
              <p className="text-xs text-[#737B87]">
                Preserved historical EVM routing contract (Chain ID 5042002) and Foundry test suite.
              </p>
            </div>
          </div>
          {showLegacyArcSection ? <ChevronUp className="w-4 h-4 text-[#737B87]" /> : <ChevronDown className="w-4 h-4 text-[#737B87]" />}
        </button>

        {showLegacyArcSection && (
          <div className="p-6 border-t border-[#2A3038] bg-[#0B0D10] space-y-4">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span>Contract Bytecode Status:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                isRouterDeployed
                  ? 'bg-[#191D23] text-[#22C55E] border-[#2A3038]'
                  : 'bg-[#191D23] text-[#D6A23D] border-[#2A3038]'
              }`}>
                {isRouterDeployed ? 'Deployed on Arc' : 'Undeployed (Fail-Closed)'}
              </span>
            </div>

            <form onSubmit={handleSaveRouter} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#737B87] mb-1">
                  Router Contract Address (Arc Testnet)
                </label>
                <input
                  type="text"
                  value={routerInput}
                  onChange={(e) => setRouterInput(e.target.value as Address)}
                  className="w-full bg-[#12151A] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3 py-2 font-mono text-xs text-[#F3F4F6] outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                {onNavigateToLegacyArc && (
                  <button
                    type="button"
                    onClick={onNavigateToLegacyArc}
                    className="text-xs text-[#D6A23D] hover:underline font-medium flex items-center gap-1"
                  >
                    <span>Open Legacy Arc Checkout</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] text-xs font-medium border border-[#2A3038] transition"
                >
                  Save Legacy Address
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
