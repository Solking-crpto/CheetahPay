import React, { useState } from 'react';
import { isAddress, type Address } from 'viem';
import { X, Check, AlertCircle, RotateCcw, Link2 } from 'lucide-react';
import { DEFAULT_ROUTER_ADDRESS, EXPLORER_URL } from '../contracts/paymentRouter';

interface ContractConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: Address;
  onSave: (address: Address) => void;
}

export const ContractConfigModal: React.FC<ContractConfigModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSave,
}) => {
  const [inputVal, setInputVal] = useState<string>(currentAddress);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = inputVal.trim();
    if (!isAddress(trimmed)) {
      setError('Please enter a valid EVM address (0x...)');
      return;
    }
    setError(null);
    onSave(trimmed);
    onClose();
  };

  const handleReset = () => {
    setInputVal(DEFAULT_ROUTER_ADDRESS);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D10]/80 backdrop-blur-sm">
      <div className="bg-[#12151A] border border-[#2A3038] rounded-lg w-full max-w-lg p-6 shadow-2xl relative text-[#F3F4F6]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#737B87] hover:text-[#F3F4F6] rounded transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-[#191D23] border border-[#2A3038] flex items-center justify-center text-[#D6A23D]">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F3F4F6]">PaymentRouter Contract</h3>
            <p className="text-xs text-[#737B87]">Configure the active router address on Arc Testnet</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#737B87] mb-1.5">
              Router Address
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (error) setError(null);
              }}
              placeholder="0x..."
              className="w-full bg-[#0B0D10] border border-[#2A3038] focus:border-[#D6A23D] rounded-md px-3.5 py-2 font-mono text-xs text-[#F3F4F6] outline-none transition"
            />
            {error && (
              <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          <div className="bg-[#0B0D10] rounded-md p-3 border border-[#2A3038] text-xs text-[#9CA3AF] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#737B87]">Network:</span>
              <span className="font-medium text-[#F3F4F6]">Arc Testnet (ID 5042002)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737B87]">USDC Token:</span>
              <span className="font-mono text-[#D6A23D]">0x3600...0000 (6 decimals)</span>
            </div>
            {currentAddress && isAddress(currentAddress) && currentAddress !== DEFAULT_ROUTER_ADDRESS && (
              <div className="pt-1">
                <a
                  href={`${EXPLORER_URL}/address/${currentAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D6A23D] hover:underline flex items-center gap-1 font-mono text-xs"
                >
                  View current on Arc Explorer →
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#737B87] hover:text-[#F3F4F6] flex items-center gap-1.5 px-2.5 py-1.5 rounded transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear / Reset
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] rounded-md border border-[#2A3038] bg-[#191D23] hover:bg-[#2A3038] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-semibold bg-[#D6A23D] hover:bg-[#C29132] text-[#0B0D10] rounded-md transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Save Address
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
