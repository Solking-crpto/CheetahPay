import { encodePacked, keccak256, parseUnits, formatUnits, type Address, type Hex } from 'viem';
export type { Address, Hex } from 'viem';

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const USDC_ADDRESS: Address = '0x3600000000000000000000000000000000000000';
export const USDC_DECIMALS = 6;
export const EXPLORER_URL = 'https://explorer.testnet.arc.io';

// Local storage key for custom configured router address
export const STORAGE_ROUTER_KEY = 'cheetahpay_router_address';
export const STORAGE_PAYMENTS_KEY = 'cheetahpay_recent_payments';

export const DEFAULT_ROUTER_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

export interface StoredPayment {
  paymentId: Hex;
  payer: Address;
  merchant: Address;
  amount: string; // Formatted USDC string, e.g. "15.50"
  amountRaw: string; // BigInt string
  timestamp: number;
  txHash: Hex;
  refundedAmount?: string;
  status?: 'Paid' | 'PartiallyRefunded' | 'FullyRefunded';
}

export const PAYMENT_ROUTER_ABI = [
  {
    type: 'function',
    name: 'USDC',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'USDC_DECIMALS',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [
      { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'merchant', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'refund',
    inputs: [
      { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'remainingRefundable',
    inputs: [{ name: 'paymentId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPayment',
    inputs: [{ name: 'paymentId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct PaymentRouter.Payment',
        components: [
          { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'payer', type: 'address', internalType: 'address' },
          { name: 'merchant', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'totalRefunded', type: 'uint256', internalType: 'uint256' },
          { name: 'status', type: 'uint8', internalType: 'enum PaymentRouter.PaymentStatus' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Paid',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'payer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'token', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'Refunded',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'originalPayer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
] as const;

export function formatUsdc(raw: bigint): string {
  return formatUnits(raw, USDC_DECIMALS);
}

export function parseUsdc(val: string): bigint {
  const clean = val.trim();
  if (!clean || isNaN(Number(clean))) return 0n;
  return parseUnits(clean, USDC_DECIMALS);
}

/**
 * Generate a front-running resistant paymentId seeded with timestamp, random entropy,
 * and optionally the payer address (as recommended in the security review).
 */
export function generatePaymentId(payer?: Address): { paymentId: Hex; preimage: string } {
  const entropy = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
  const timestamp = Date.now().toString();
  const seedPayer = payer ?? '0x0000000000000000000000000000000000000000';
  const preimage = `cheetahpay:${seedPayer}:${timestamp}:${entropy}`;
  const paymentId = keccak256(encodePacked(['string'], [preimage]));
  return { paymentId, preimage };
}
