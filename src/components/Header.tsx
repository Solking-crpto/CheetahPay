import React, { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import {
  Shield,
  CreditCard,
  Settings,
  Menu,
  X,
  History,
  FileText,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';
import type { MainNavigationTab } from '../types/cheetahpay';
import type { Address } from '../contracts/paymentRouter';

interface HeaderProps {
  activeTab: MainNavigationTab;
  onNavigate: (tab: MainNavigationTab) => void;
  routerAddress: Address;
  onOpenConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  routerAddress: _routerAddress,
  onOpenConfig: _onOpenConfig,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: MainNavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'fund', label: 'Fund Wallet', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'pay-zcash', label: 'Pay with Zcash', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'invoices', label: 'Merchant Invoices', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'transactions', label: 'Transactions', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const handleNavClick = (tab: MainNavigationTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-[#2A3038] bg-[#12151A] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#D6A23D]">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#F3F4F6] tracking-tight">
                  CheetahPay
                </span>
                <span className="text-[10px] font-mono text-[#737B87] uppercase tracking-wider">
                  Shield
                </span>
              </div>
              <p className="text-[10px] text-[#737B87] hidden md:block">
                Zcash Native Infrastructure
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0B0D10] p-1 rounded-md border border-[#2A3038]">
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#191D23] text-[#F3F4F6] border border-[#2A3038]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#191D23]/60'
                  }`}
                >
                  <span className={isSelected ? 'text-[#D6A23D]' : 'text-[#737B87]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls: Network, ZIP-321, Web3 Wallet */}
          <div className="flex items-center gap-2">
            {/* Primary Network Badge: Zcash Testnet */}
            <a
              href="https://sochain.com/testnet/zec"
              target="_blank"
              rel="noreferrer"
              title="Zcash Testnet NU5 - View SoChain Node Explorer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191D23] border border-[#2A3038] text-[11px] font-mono text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zcash Testnet (NU5)</span>
              <ExternalLink className="w-3 h-3 text-[#737B87]" />
            </a>

            {/* ZIP-321 Badge */}
            <div
              title="Standard ZIP-321 payment request protocol active"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#191D23] border border-[#2A3038] text-[11px] font-mono text-[#9CA3AF]"
            >
              <span className="text-[#D6A23D]">•</span>
              <span>ZIP-321</span>
            </div>

            {/* Optional ConnectKit Button for EVM / Snap integration */}
            <ConnectKitButton.Custom>
              {({ isConnected, show, truncatedAddress, ensName }) => (
                <button
                  onClick={show}
                  title="Web3 Provider Connector"
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038]"
                >
                  {isConnected ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-mono text-[11px]">{ensName || truncatedAddress}</span>
                    </>
                  ) : (
                    <span className="text-[11px]">Web3 Wallet</span>
                  )}
                </button>
              )}
            </ConnectKitButton.Custom>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md bg-[#191D23] border border-[#2A3038] text-[#9CA3AF] hover:text-[#F3F4F6]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#2A3038] bg-[#12151A] p-3 space-y-1">
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#191D23] text-[#F3F4F6] border border-[#2A3038]'
                    : 'text-[#9CA3AF] hover:bg-[#191D23]/60'
                }`}
              >
                <span className={isSelected ? 'text-[#D6A23D]' : 'text-[#737B87]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#2A3038] flex items-center justify-between text-[11px] text-[#737B87]">
            <span>Network: Zcash Testnet (NU5)</span>
            <span className="text-[#9CA3AF]">ZIP-321 Protocol</span>
          </div>
        </div>
      )}
    </header>
  );
};


