# CheetahPay: Universal Fiat-Crypto Payment Infrastructure
> **Tagline:** Pay fiat to Web3. Pay crypto to Web2.
> **Project Nature:** CheetahPay Shield is a Zcash-focused payment prototype prepared for demonstration at **ZECATHON 2026** (Privacy Track Submission, Deadline: October 28, 2026, 23:59 UTC).

---

## Executive Overview

**CheetahPay** is a multi-rail payment infrastructure prototype bridging Web2 financial systems and Web3 networks. Built for merchants, fintechs, and decentralized applications, CheetahPay unifies fiat on-ramping, non-custodial crypto checkout, and zero-knowledge privacy payments under a coherent, single-pane-of-glass architecture.

CheetahPay operates across three dedicated payment rails:

1. **Web2 to Web3 (Fund Wallet):** Institutional fiat on-ramp interface enabling customers to model crypto deposits using Credit/Debit cards, SEPA bank transfers, and US ACH. Features illustrative fee estimation, transparent fee formulas, developer sandbox API connectivity probing (`https://api.circle.com/v1/ping`), and a fail-closed 5-stage settlement state machine. Fiat funding fees and exchange rates are illustrative models for interface prototyping, not live provider quotes. Direct card charging and on-chain delivery are blocked pending merchant KYB onboarding, regulated MSB gateway credentials, and backend session signing.
2. **Web3 to Web2 (Pay Merchant):** Non-custodial USDC checkout router (`PaymentRouter.sol`) on Arc. Funds flow atomically and directly from payer to merchant with zero intermediate custody, front-running resistant payment IDs, and authorized merchant refunds. Bytecode verification checks `eth_getCode` before payment initiation to prevent failed transactions when undeployed.
3. **CheetahPay Shield (Zcash Privacy Checkout):** Dedicated zero-knowledge checkout experience adhering to official **ZIP-321** payment URI standards. Binds merchant invoices inside encrypted on-chain memos, renders client-side SVG QR codes, classifies address receiver capabilities with explicit ledger exposure warnings for transparent addresses, and queries the live SoChain Zcash Testnet REST API for real block confirmations with transparent output verification and shielded wallet-boundary demarcation.

---

## System Architecture

```
                             ┌──────────────────────────────────────────────────────────┐
                             │                        CheetahPay                        │
                             │        Universal Fiat-Crypto Payment Infrastructure      │
                             └─────────────────────────────┬────────────────────────────┘
                                                           │
               ┌───────────────────────────────────────────┼──────────────────────────────────────────┐
               ▼                                           ▼                                          ▼
   ┌───────────────────────┐                   ┌───────────────────────┐                  ┌───────────────────────┐
   │    Web2 to Web3       │                   │     Web3 to Web2      │                  │   CheetahPay Shield   │
   │      Fund Wallet      │                   │      Pay Merchant     │                  │     Zcash Checkout    │
   ├───────────────────────┤                   ├───────────────────────┤                  ├───────────────────────┤
   │ • Card / SEPA / ACH   │                   │ • Non-Custodial USDC  │                  │ • Official ZIP-321    │
   │ • Illustrative Quotes │                   │ • Arc Testnet L2      │                  │ • Encrypted Memos     │
   │ • Ping Connectivity   │                   │ • Instant Refunds     │                  │ • zk-SNARK Shielded   │
   │ • KYB Blocker Boundary│                   │ • PaymentRouter.sol   │                  │ • Live SoChain Node   │
   └───────────────────────┘                   └───────────────────────┘                  └───────────────────────┘
               │                                           │                                          │
               ▼                                           ▼                                          ▼
   ┌───────────────────────┐                   ┌───────────────────────┐                  ┌───────────────────────┐
   │ Circle / Stripe APIs  │                   │ Arc Testnet Contract  │                  │ Zcash Testnet (NU5)   │
   │ Fiat Settlement Core  │                   │ 0x3600...0000 (USDC)  │                  │ SoChain Testnet Node  │
   └───────────────────────┘                   └───────────────────────┘                  └───────────────────────┘
```

---

## The Three Core Rails

### Rail 1: Web2 to Web3 (Fund Wallet)
- **Asset Coverage:** USDC (Arc / L2), ZEC (Zcash), ETH, BTC.
- **Payment Channels:** Credit/Debit Cards (Instant, 2.9% + $0.30), SEPA Bank Transfer (1-2 days, 0.5% + €1.00), US ACH (2-3 days, 0.8% + $1.00).
- **Quotation Modeling:** Illustrative exchange rate pricing, provider margin (0.4%), network gas fee accounting, min ($20) and max ($10,000) bounds. All fees and rates are illustrative models for interface prototyping, not live provider quotes.
- **Settlement State Machine:** Strict fail-closed transition pipeline:
  $$\text{CREATED} \longrightarrow \text{QUOTED} \longrightarrow \text{AWAITING\_PAYMENT} \longrightarrow \text{PAYMENT\_PROCESSING} \longrightarrow \text{PAYMENT\_VERIFIED} \longrightarrow \text{CRYPTO\_DELIVERY\_PENDING} \longrightarrow \text{COMPLETED}$$
- **Gateway Integration Boundary:** The interface allows testing sandbox Bearer token authentication against `https://api.circle.com/v1/ping`. When unconfigured, an explicit Gateway Setup & Integration Blocker Card is rendered. A Circle ping test is strictly a developer sandbox connectivity probe, not a production on-ramp integration. Live card charging and real crypto delivery are outstanding implementation items requiring merchant KYB onboarding, regulated MSB provider contracts, and server-side secret custody. No synthetic delivery hashes or fake balances are fabricated.

### Rail 2: Web3 to Web2 (Pay Merchant)
- **Contract Source:** `contracts/src/PaymentRouter.sol` (Solidity 0.8.28, OpenZeppelin 5.6.1).
- **Core Guarantees:** 100% non-custodial. USDC transfers atomically from payer to merchant. The router holds zero custody balance.
- **Front-Running Protection:** Cryptographic payment ID generation seeded with timestamp, entropy, and payer address:
  $$\text{paymentId} = \text{keccak256}(\text{preimage})$$
- **Refund Authorization:** Only the original merchant of a recorded payment can refund it, strictly up to the unrefunded balance (`remainingRefundable`), direct to the original payer.
- **Verification:** Emits indexed `Paid` and `Refunded` events verified by the application.

### Rail 3: CheetahPay Shield (Zcash Checkout — ZECATHON 2026)
- **Standard:** Complies with **ZIP-321** (`zcash:<address>?amount=<val>&memo=<base64url>&message=<msg>`), featuring bidirectional generation and parsing. ZIP-321 generates payment requests for compatible external wallets (e.g., Zashi, Ywallet, Zecwallet); generating a request or rendering a QR code formats payment parameters but does not mean that a payment was sent, broadcast, or received.
- **Encrypted Invoice Binding:** Cryptographically encodes the merchant invoice ID (e.g. `CP-SHIELD-xxxx`) inside the 512-byte shielded memo field.
- **Client-Side SVG QR Code:** Zero-dependency, offline QR rendering for privacy preservation (no external API calls that could leak merchant IP or customer scanning metadata).
- **Address Format Classification (Structural Heuristic):** Evaluates Zcash address prefixes (`utest1`, `u1`, `ztestsapling`, `zs1`, `tm`, `t1`, `t3`), length bounds, and character sets. Address-format classification evaluates static receiver pool capability and does not prove that a particular transaction is shielded or that confidentiality guarantees were satisfied on-chain. Full cryptographic Bech32m/Base58Check checksum validation is a documented limitation requiring an external decoder library.
- **Settlement Verification & Cryptographic Boundary:** Directly queries the live Zcash Testnet network (`https://sochain.com/api/v3/transaction/ZECTEST`) for block confirmations. Transparent payments are verified against recipient output and amount. Public transaction inclusion and confirmation counts do not verify shielded invoice amounts, recipients, or encrypted memos on-chain. For shielded payments, on-chain inclusion transitions invoices to `AWAITING_WALLET_VERIFICATION`, where they remain until an automated merchant-wallet verification mechanism (e.g., via Incoming Viewing Key note decryption) is integrated. Private viewing keys are never requested, handled, or stored in the browser.

---

## Primary Application Navigation

The CheetahPay user journey is organized into six core sections built around native Zcash:

1. **Overview (`overview`):** Zcash network status (NU5), zk-SNARK confidentiality metrics, confirmed invoice totals, and quick actions.
2. **Fund Wallet (`fund`):** Regulated fiat on-ramp quotation engine supporting Cards, SEPA, and ACH, with explicit ZEC direct on-ramp and liquidity routing architecture.
3. **Pay with Zcash (`pay-zcash`):** Customer checkout terminal with ZIP-321 QR rendering, deep link wallet handoff, and live on-chain SoChain transaction verification.
4. **Merchant Invoices (`invoices`):** Merchant payment request generator, address presets (Unified vs. Transparent), automated confirmation polling, and receipts.
5. **Transactions (`transactions`):** Multi-rail cross-settlement ledger with provenance tagging and CSV audit export.
6. **Settings (`settings`):** Zcash network parameters (Testnet NU5 / Mainnet, required confirmations $\ge 3$), fiat gateway credentials, and isolated legacy Arc archive.

---

## Architecture: Native Zcash vs. Legacy Arc Preservation

- **Zcash Primary Network:** The hackathon application operates natively on the Zcash network (NU5 testnet), leveraging UTXO note-based cryptography, Unified Addresses (Orchard receiver pools), and ZIP-321 payment URIs. The application does not require an EVM wallet connection or an Arc deployment to launch or operate.
- **Legacy Arc Isolation:** The earlier Arc Testnet `PaymentRouter.sol` contract and Compass deployment scripts are preserved for historical reference in an isolated archive tab (`legacy-arc`) accessible via Settings or the footer. They do not dictate the application's primary navigation, branding, or payment workflow.

---

## Verification & Testing Evidence

Tests are categorized into **Native Zcash & Multi-Rail Tests** and **Legacy Arc Contract Tests**:

### 1. Native Zcash & Multi-Rail Integration Tests
```bash
npm run test:cheetahpay
```
**Result:** **100% passed (6/6 test suites)**.
- Fiat quotation engine and transparent fee formulas.
- Strict fail-closed settlement state machine transitions.
- Zcash address classification (Unified `utest1`, Sapling `zs1`, Transparent `tm`).
- Transparent vs. Shielded privacy capability analysis (distinguishing address receiver format capabilities from runtime transaction privacy guarantees).
- Official ZIP-321 URI generation and parsing with round-trip base64url memo decoding.
- Live Zcash Testnet network verification querying SoChain v3 REST node (telemetry verified against mined block 4548318, tx `a8810b4b...`). The known testnet transaction `a8810b4b...` is a mined coinbase block reward transaction used strictly as testnet telemetry and a mismatch/matching test fixture, not a CheetahPay customer payment.
- Transparent recipient output matching with fail-closed underpayment and address mismatch rejection.
- Unified CSV transaction ledger export.

### 2. TypeScript Strict Typecheck
```bash
npm run typecheck
```
**Result:** **0 errors**.

### 3. Static Code Analysis (Oxlint)
```bash
npx oxlint src scripts
```
**Result:** **0 errors**.

### 4. Production Application Build (Vite 6)
```bash
npm run build
```
**Result:** Clean compilation producing optimized distribution bundle in `dist/`.

### 5. Legacy Arc Contract Tests (Preserved Archive)
```bash
npm run contracts:test
```
**Result:** **27/27 tests passed, 0 failed** (25 unit tests + 2 fuzz tests with 256 runs each).

### 6. Legacy Compass Circle SDK Deploy Tests (Preserved Archive)
```bash
npm run test:compass
```
**Result:** **55/55 tests passed** (Circle SDK chain resolution and fail-closed CLI verification).

---

## Running the Application Locally

### Prerequisites
- Node.js v20+ (tested on Node v26)
- npm or Bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Outstanding Production Implementation Items

As a hackathon prototype, CheetahPay Shield identifies two primary outstanding items for production readiness:
1. **Automated Shielded Note Verification:** Verifying shielded transaction amounts and memos currently requires external merchant wallet note decryption via Incoming Viewing Key (IVK). Integrating an automated backend lightwalletd indexer without exposing viewing keys in the browser is the primary technical follow-on.
2. **Live Fiat-Provider Integration:** Real card charging and fiat payouts require regulated merchant of record onboarding, MSB licensing, and server-side secret custody (e.g. Circle Mint / Stripe Crypto).

---

## Documentation Index

- [`docs/ZECATHON-2026.md`](docs/ZECATHON-2026.md): Official ZECATHON 2026 submission dossier, ZIP-321 technical implementation, privacy analysis, and judging instructions.
- [`docs/PaymentRouter-security-review.md`](docs/PaymentRouter-security-review.md): Smart contract threat model, non-custodial invariants, and refund authorization analysis.
- [`AGENTS.md`](AGENTS.md): Project memory, contract deployment specifications, and architectural constraints.

---

## License

MIT License. Copyright (c) 2026 CheetahPay Team.
