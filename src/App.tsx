import React, { useState } from 'react';
import { type Address, isAddress } from 'viem';
import { Shield, ExternalLink, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { FundWalletView } from './components/funding/FundWalletView';
import { ZcashCheckoutView } from './components/shield/ZcashCheckoutView';
import { MerchantInvoicesView } from './components/merchant/MerchantInvoicesView';
import { TransactionHistoryView } from './components/transactions/TransactionHistoryView';
import { PayMerchantView } from './components/checkout/PayMerchantView';
import { SettingsView } from './components/settings/SettingsView';
import { ContractConfigModal } from './components/ContractConfigModal';
import {
  DEFAULT_ROUTER_ADDRESS,
  STORAGE_ROUTER_KEY,
} from './contracts/paymentRouter';
import type { MainNavigationTab } from './types/cheetahpay';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainNavigationTab>('overview');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(undefined);
  const [routerAddress, setRouterAddress] = useState<Address>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_ROUTER_KEY);
        if (saved && isAddress(saved)) {
          return saved;
        }
      }
    } catch (e) {
      console.error('Initialization error', e);
    }
    return DEFAULT_ROUTER_ADDRESS;
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSaveRouterAddress = (addr: Address) => {
    setRouterAddress(addr);
    try {
      localStorage.setItem(STORAGE_ROUTER_KEY, addr);
    } catch (e) {
      console.error('Failed to save router address', e);
    }
  };

  const handleOpenCheckoutForInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('pay-zcash');
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F3F4F6] flex flex-col font-sans">
      {/* Global Navigation Header (Zcash Primary) */}
      <Header
        activeTab={activeTab}
        onNavigate={setActiveTab}
        routerAddress={routerAddress}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <DashboardOverview onNavigate={setActiveTab} />
        )}

        {activeTab === 'fund' && <FundWalletView />}

        {activeTab === 'pay-zcash' && (
          <ZcashCheckoutView
            initialInvoiceId={selectedInvoiceId}
            onNavigateToInvoices={() => setActiveTab('invoices')}
          />
        )}

        {activeTab === 'invoices' && (
          <MerchantInvoicesView
            routerAddress={routerAddress}
            onOpenCheckoutForInvoice={handleOpenCheckoutForInvoice}
          />
        )}

        {activeTab === 'transactions' && <TransactionHistoryView />}

        {activeTab === 'settings' && (
          <SettingsView
            currentRouterAddress={routerAddress}
            onSaveRouterAddress={handleSaveRouterAddress}
            onNavigateToLegacyArc={() => setActiveTab('legacy-arc')}
          />
        )}

        {/* Isolated Legacy Arc Rail View */}
        {activeTab === 'legacy-arc' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#12151A] border border-[#2A3038] rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#737B87]" />
                <span className="font-medium text-[#F3F4F6]">Legacy Arc USDC PaymentRouter</span>
                <span className="text-[#737B87]">Preserved historical EVM checkout slice</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-xs text-[#D6A23D] hover:underline font-medium transition-colors"
              >
                Back to Zcash Overview
              </button>
            </div>
            <PayMerchantView
              routerAddress={routerAddress}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Universal Footer: Zcash First */}
      <footer className="border-t border-[#2A3038] bg-[#12151A] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737B87]">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#D6A23D]" />
            <span className="font-semibold text-[#F3F4F6]">CheetahPay Shield</span>
            <span>— Privacy-Preserving Universal Payment Infrastructure</span>
          </div>

          <div className="flex items-center gap-5 font-mono text-[11px]">
            <span className="text-[#9CA3AF] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#D6A23D]" /> ZECATHON 2026
            </span>
            <a
              href="https://sochain.com/testnet/zec"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#F3F4F6] transition-colors flex items-center gap-1"
            >
              SoChain Explorer <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setActiveTab('legacy-arc')}
              className="hover:text-[#F3F4F6] transition-colors flex items-center gap-1 text-[#737B87]"
            >
              <Zap className="w-3 h-3" /> Legacy Arc Rail
            </button>
          </div>
        </div>
      </footer>

      {/* Legacy Contract Configuration Modal */}
      <ContractConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentAddress={routerAddress}
        onSave={handleSaveRouterAddress}
      />
    </div>
  );
}
