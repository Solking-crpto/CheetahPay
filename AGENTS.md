# CheetahPay — Universal Fiat-Crypto Payment Infrastructure

> "Pay fiat to Web3. Pay crypto to Web2."

This is the **project memory** - documenting the architecture, payment rails, security invariants, and test procedures for CheetahPay.

---

## What This App Does

CheetahPay is an institutional-grade, privacy-focused payment infrastructure built natively around the **Zcash** network, bridging Web2 finance and private Web3 transactions:

1. **CheetahPay Shield (Primary Native Zcash Rail):** Dedicated zero-knowledge checkout conforming to official **ZIP-321** standards, Unified Addresses (Orchard/Sapling pools), 512-byte encrypted memos, client-side SVG QR rendering, and live testnet verification via SoChain v3 REST API.
2. **Merchant Invoicing Suite:** Dynamic payment request generator with automated on-chain confirmation tracking and invoice directory.
3. **Web2 to Web3 (Fund Wallet):** Institutional fiat on-ramp interface routing through regulated providers (MoonPay/Transak for direct ZEC, Circle/Stripe with documented atomic swap liquidity) with transparent fee schedules and fail-closed state machines.
4. **Universal Cross-Rail Ledger:** Unified transaction telemetry, provenance classifications, and exportable CSV auditing records.
5. **Legacy Arc Rail (Preserved Archive):** Isolated non-custodial USDC routing via `PaymentRouter.sol` on Arc Testnet (Chain ID 5042002), preserved in a standalone archive view without dictating the primary user journey.

## Contract Deployments

| Contract | Network | Address | Status | Bytecode Verified |
|----------|---------|---------|--------|-------------------|
| PaymentRouter | Arc Testnet (5042002) | Configured in Settings / `.env` | Self-deployed or Compass | Verified via `eth_getCode` before execution |

## Key Security Facts

- **USDC Address (Arc Testnet):** `0x3600000000000000000000000000000000000000` (6 decimals)
- **Zero Key Custody:** CheetahPay never requests, touches, or stores merchant or customer private keys or seed phrases.
- **Fail-Closed Settlement:** No wallet is credited and no invoice is marked settled based on synthetic hashes, client timers, or unverified browser callbacks.
- **Privacy Standard:** Transparent addresses (`tm...`, `t1...`) display explicit ledger visibility warnings and are never deceptively labeled as shielded.
- **Bytecode Verification:** The Arc USDC router checks `useBytecode` before transacting to prevent gas loss or reverts if unconfigured.
- **Full Test Suite:** 27/27 Foundry contract tests, 55/55 Compass deployment tests, and 6/6 CheetahPay integration test suites passing.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, QR code rendering
- **Web3 (Arc):** wagmi v2, viem v2, ConnectKit
- **Privacy (Zcash):** ZIP-321 payment request parser/serializer, Unified Address validation, SoChain REST API
- **Contracts:** Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`.
- **Toasts:** Sonner

## Testing & Verification Commands

```bash
# Typecheck
npm run typecheck

# Foundry smart contract unit tests (27 tests)
npm run contracts:test

# Compass deployment script verification (55 tests)
npm run test:compass

# Cross-rail settlement & ZIP-321 validation tests (6 suites)
npm run test:cheetahpay

# Static analysis and linting
npx oxlint src scripts

# Production build
npm run build
```
