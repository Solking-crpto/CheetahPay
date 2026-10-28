import assert from 'node:assert/strict';

import {
  CHAIN_ID_TO_CIRCLE_BLOCKCHAIN,
  parseArgs,
  resolveChainDef,
} from './compass-deploy.ts';

// ── 1. Valid Mappings ────────────────────────────────────────────────────────

const validCases: Array<{
  input: string;
  expectedChainId: number;
  expectedName: string;
  expectedCircle: string;
  expectedGas: 'usdc' | 'native';
}> = [
  // Arc Testnet aliases and enums
  { input: 'Arc_Testnet', expectedChainId: 5042002, expectedName: 'Arc Testnet', expectedCircle: 'ARC-TESTNET', expectedGas: 'usdc' },
  { input: 'arc-testnet', expectedChainId: 5042002, expectedName: 'Arc Testnet', expectedCircle: 'ARC-TESTNET', expectedGas: 'usdc' },
  { input: 'Arc Testnet', expectedChainId: 5042002, expectedName: 'Arc Testnet', expectedCircle: 'ARC-TESTNET', expectedGas: 'usdc' },
  { input: 'ARC-TESTNET', expectedChainId: 5042002, expectedName: 'Arc Testnet', expectedCircle: 'ARC-TESTNET', expectedGas: 'usdc' },

  // Arc Mainnet
  { input: 'Arc', expectedChainId: 5042, expectedName: 'Arc', expectedCircle: 'ARC', expectedGas: 'usdc' },
  { input: 'arc', expectedChainId: 5042, expectedName: 'Arc', expectedCircle: 'ARC', expectedGas: 'usdc' },
  { input: 'ARC', expectedChainId: 5042, expectedName: 'Arc', expectedCircle: 'ARC', expectedGas: 'usdc' },

  // Other supported testnets
  { input: 'Base_Sepolia', expectedChainId: 84532, expectedName: 'Base Sepolia', expectedCircle: 'BASE-SEPOLIA', expectedGas: 'native' },
  { input: 'BASE-SEPOLIA', expectedChainId: 84532, expectedName: 'Base Sepolia', expectedCircle: 'BASE-SEPOLIA', expectedGas: 'native' },
  { input: 'Ethereum_Sepolia', expectedChainId: 11155111, expectedName: 'Ethereum Sepolia', expectedCircle: 'ETH-SEPOLIA', expectedGas: 'native' },
  { input: 'ETH-SEPOLIA', expectedChainId: 11155111, expectedName: 'Ethereum Sepolia', expectedCircle: 'ETH-SEPOLIA', expectedGas: 'native' },
  { input: 'Arbitrum_Sepolia', expectedChainId: 421614, expectedName: 'Arbitrum Sepolia', expectedCircle: 'ARB-SEPOLIA', expectedGas: 'native' },
  { input: 'ARB-SEPOLIA', expectedChainId: 421614, expectedName: 'Arbitrum Sepolia', expectedCircle: 'ARB-SEPOLIA', expectedGas: 'native' },
  { input: 'Avalanche_Fuji', expectedChainId: 43113, expectedName: 'Avalanche Fuji', expectedCircle: 'AVAX-FUJI', expectedGas: 'native' },
  { input: 'AVAX-FUJI', expectedChainId: 43113, expectedName: 'Avalanche Fuji', expectedCircle: 'AVAX-FUJI', expectedGas: 'native' },
  { input: 'Polygon_Amoy', expectedChainId: 80002, expectedName: 'Polygon Amoy', expectedCircle: 'MATIC-AMOY', expectedGas: 'native' },
  { input: 'MATIC-AMOY', expectedChainId: 80002, expectedName: 'Polygon Amoy', expectedCircle: 'MATIC-AMOY', expectedGas: 'native' },
  { input: 'OP_Sepolia', expectedChainId: 11155420, expectedName: 'OP Sepolia', expectedCircle: 'OP-SEPOLIA', expectedGas: 'native' },
  { input: 'OP-SEPOLIA', expectedChainId: 11155420, expectedName: 'OP Sepolia', expectedCircle: 'OP-SEPOLIA', expectedGas: 'native' },
  { input: 'Unichain_Sepolia', expectedChainId: 1301, expectedName: 'Unichain Sepolia', expectedCircle: 'UNI-SEPOLIA', expectedGas: 'native' },
  { input: 'UNI-SEPOLIA', expectedChainId: 1301, expectedName: 'Unichain Sepolia', expectedCircle: 'UNI-SEPOLIA', expectedGas: 'native' },
  { input: 'Monad_Testnet', expectedChainId: 10143, expectedName: 'Monad Testnet', expectedCircle: 'MONAD-TESTNET', expectedGas: 'native' },
  { input: 'MONAD-TESTNET', expectedChainId: 10143, expectedName: 'Monad Testnet', expectedCircle: 'MONAD-TESTNET', expectedGas: 'native' },
];

assert.equal(CHAIN_ID_TO_CIRCLE_BLOCKCHAIN[5042002], 'ARC-TESTNET', 'Arc Testnet must map to ARC-TESTNET');
assert.equal(CHAIN_ID_TO_CIRCLE_BLOCKCHAIN[5042], 'ARC', 'Arc Mainnet must map to ARC');

console.log('Running valid mapping tests...');
for (const tc of validCases) {
  const def = resolveChainDef(tc.input);
  assert.equal(def.chainId, tc.expectedChainId, `ChainId mismatch for ${tc.input}`);
  assert.equal(def.name, tc.expectedName, `Name mismatch for ${tc.input}`);
  assert.equal(def.circleBlockchain, tc.expectedCircle, `Circle SDK identifier mismatch for ${tc.input}`);
  const gas = def.nativeCurrency.symbol === 'USDC' ? 'usdc' : 'native';
  assert.equal(gas, tc.expectedGas, `Gas token mismatch for ${tc.input}`);
}
console.log(`✓ All ${validCases.length} valid mapping tests passed.`);

// ── 2. Missing Mappings (Chains without Circle SDK support) ──────────────────

console.log('\nRunning missing mapping tests...');
const missingMappingChains = ['Base', 'Ethereum', 'Arbitrum_One', 'Polygon_PoS', 'Avalanche', 'OP_Mainnet', 'BSC', 'Blast', 'Gnosis', 'zkSync', 'Sei_Testnet'];

for (const chain of missingMappingChains) {
  const def = resolveChainDef(chain);
  assert.equal(
    def.circleBlockchain,
    undefined,
    `Expected circleBlockchain to be undefined for missing mapping chain ${chain}, got ${def.circleBlockchain}`,
  );

  // Attempting to pass --blockchain for a chain with a missing mapping must be rejected
  assert.throws(
    () => {
      parseArgs(['PaymentRouter', '--compass-chain', chain, '--blockchain', 'FOO', '--rpc', 'https://example.com']);
    },
    (err: Error) => err.message.includes('does not match the registered Circle SDK identifier'),
    `Expected rejected --blockchain for missing mapping chain ${chain}`,
  );

  // Attempting to deploy without --blockchain for a chain with a missing mapping must be rejected
  assert.throws(
    () => {
      parseArgs(['PaymentRouter', '--compass-chain', chain, '--rpc', 'https://example.com']);
    },
    (err: Error) => err.message.includes('--blockchain is unavailable'),
    `Expected rejected deployment without --blockchain for missing mapping chain ${chain}`,
  );
}
console.log(`✓ All ${missingMappingChains.length} missing mapping tests passed.`);

// ── 3. Mismatched Identifiers ───────────────────────────────────────────────

console.log('\nRunning mismatched identifier tests...');
const mismatchCases = [
  { compass: 'Arc', blockchain: 'ARC-TESTNET' },
  { compass: 'Arc_Testnet', blockchain: 'ARC' },
  { compass: 'Arc_Testnet', blockchain: 'BASE-SEPOLIA' },
  { compass: 'Base_Sepolia', blockchain: 'ARC-TESTNET' },
  { compass: 'Ethereum_Sepolia', blockchain: 'ETH' },
  { compass: 'Base', blockchain: 'BASE' },
  { compass: 'Ethereum', blockchain: 'ETH' },
];

for (const tc of mismatchCases) {
  assert.throws(
    () => {
      parseArgs(['PaymentRouter', '--compass-chain', tc.compass, '--blockchain', tc.blockchain, '--rpc', 'https://example.com']);
    },
    (err: Error) => err.message.includes('does not match the registered Circle SDK identifier'),
    `Expected mismatch error for --compass-chain "${tc.compass}" and --blockchain "${tc.blockchain}"`,
  );
}
console.log(`✓ All ${mismatchCases.length} mismatched identifier tests passed.`);

// ── 4. Unknown & Ambiguous Identifiers (Fail Closed) ────────────────────────

console.log('\nRunning unknown / ambiguous identifier tests...');
const invalidChains = [
  'unknown-chain',
  'foo_bar',
  'arctestnet', // Generic heuristic rejected
  'arc_devnet',
  'base_devnet',
  '',
  '   ',
];

for (const invalid of invalidChains) {
  assert.throws(
    () => {
      resolveChainDef(invalid);
    },
    (err: Error) =>
      err.message.includes('Unknown --compass-chain') || err.message.includes('A non-empty --compass-chain identifier is required.'),
    `Expected resolveChainDef to throw for invalid input "${invalid}"`,
  );
}
console.log(`✓ All ${invalidChains.length} unknown / invalid chain tests passed.`);

// ── 5. End-to-End CLI Option Parsing & Defaults ─────────────────────────────

console.log('\nRunning CLI parsing & default inference tests...');

// 5a. Arc Testnet defaults to ARC-TESTNET without --blockchain
const arcTestnetParsed = parseArgs(['PaymentRouter', '--compass-chain', 'Arc_Testnet', '--rpc', 'https://rpc.testnet.arc.io']);
assert.equal(arcTestnetParsed.name, 'PaymentRouter');

// 5b. Arc Mainnet defaults to ARC without --blockchain
const arcMainnetParsed = parseArgs(['PaymentRouter', '--compass-chain', 'Arc', '--rpc', 'https://rpc.mainnet.arc.io']);
assert.equal(arcMainnetParsed.name, 'PaymentRouter');

// 5c. Explicit matching --blockchain accepted
const explicitParsed = parseArgs([
  'PaymentRouter',
  '--compass-chain',
  'Arc_Testnet',
  '--blockchain',
  'ARC-TESTNET',
  '--rpc',
  'https://rpc.testnet.arc.io',
]);
assert.equal(explicitParsed.name, 'PaymentRouter');

console.log('✓ All CLI parsing tests passed.');
console.log('\n========================================');
console.log('ALL COMPASS-DEPLOY TESTS PASSED (100%)');
console.log('========================================');
