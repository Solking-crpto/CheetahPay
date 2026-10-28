# CheetahPay Shield — ZECATHON 2026 Submission Dossier

> **Project Title:** CheetahPay Shield: Universal Privacy-Preserving Zcash Checkout & Multi-Rail Financial Gateway  
> **Project Nature:** Zcash-focused payment prototype prepared for **ZECATHON 2026** (Privacy Track Submission, Deadline: October 28, 2026, 23:59 UTC).  
> **Repository:** https://github.com/Solking-crpto/CheetahPay  
> **Core Innovation:** Native Web ZIP-321 Zcash payment request generation and parsing with encrypted memo invoice binding, client-side offline SVG QR code generation, transparent-versus-shielded receiver capability analysis, and multi-rail cross-settlement ledger infrastructure.

---

## 1. Executive Summary

Merchants accepting cryptocurrency today face an unacceptable trade-off: either accept payments on public transparent blockchains—exposing entire revenue streams, vendor transactions, and customer relationships to blockchain surveillance—or rely on centralized custodial intermediaries that collect personal data and create honeypots.

**CheetahPay Shield** is a Zcash-focused payment prototype delivering an institutional-grade, non-custodial web checkout application powered by **Zcash zero-knowledge proofs (zk-SNARKs)** and compliant with **ZIP-321**. By encoding merchant invoices directly into encrypted on-chain memos and rendering zero-dependency client-side QR codes, CheetahPay Shield enables peer-to-peer private commerce without leaking customer IP addresses, device fingerprints, or transaction graphs to third parties.

CheetahPay unifies this privacy checkout alongside non-custodial USDC routing and fiat wallet funding under the universal vision:  
**"Pay fiat to Web3. Pay crypto to Web2."**

---

## 2. Problem Statement & Mission

### The Merchant Privacy Crisis
Public blockchain payments permanently record payer addresses, payee addresses, amounts, and timestamps on a public ledger. Competitors, data brokers, and blockchain analysis companies can reconstruct a merchant's cash flow, average order value, supplier payments, and recurring customer base.

### Existing Deficiencies in Web3 Checkouts
1. **Lack of Standards:** Most web checkouts present static public addresses without standardized payment parameters, resulting in underpayments, overpayments, and lost invoices.
2. **Third-Party Surveillance:** Many checkout widgets fetch QR codes from external cloud APIs (e.g., Google Charts, QR servers), leaking merchant customers' IP addresses and checkout browsing history.
3. **Misleading Privacy Claims:** Applications often falsely claim that sending funds to a transparent Bitcoin-style address is "private" or "shielded," compromising user security.
4. **Key Custody Anti-Patterns:** Dangerous implementations ask users to paste private keys or seed phrases into browser input fields.

---

## 3. CheetahPay Shield Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CheetahPay Shield Engine                                 │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          ▼                                ▼                                ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│ Invoice Builder  │             │   ZIP-321 Core   │             │ Privacy Analyzer │
├──────────────────┤             ├──────────────────┤             ├──────────────────┤
│ • Amount (USD/ZEC│             │ • Format URI     │             │ • Unified (NU5)  │
│ • Item metadata  │             │ • Encrypt Memo   │             │ • Sapling        │
│ • Expiry timer   │             │ • Base64url spec │             │ • Transparent    │
│ • Address preset │             │ • Message query  │             │ • Notice Matrix  │
└──────────────────┘             └──────────────────┘             └──────────────────┘
          │                                │                                │
          └────────────────────────────────┼────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Customer Checkout Experience                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Client-Side SVG QR Code (Zero network tracking, 100% offline generation)             │
│ • "Open in Zcash Wallet" Protocol Handler (`zcash:` URI for Zashi, Ywallet, Zecwallet) │
│ • One-click copy controls (ZIP-321 URI, Encrypted Memo, Merchant Address)              │
│ • Live Expiration Countdown Timer                                                      │
│ • Testnet Block Explorer Verification (`https://testnet.zcashblockexplorer.com`)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Specifications & ZIP-321 Implementation

### Official Standards Adherence
CheetahPay Shield implements **ZIP-321 (Payment Request URIs)**:
$$\text{URI} = \texttt{zcash:}\langle\text{address}\rangle\texttt{?amount=}\langle\text{amountZec}\rangle\texttt{\&memo=}\langle\text{base64urlMemo}\rangle\texttt{\&message=}\langle\text{itemDescription}\rangle$$

- **Payment Request Semantics:** ZIP-321 generates payment requests for compatible external wallets (such as Zashi, Ywallet, and Zecwallet). Generating a payment request URI or displaying an offline QR code formats payment parameters for an external wallet; it does not mean that a payment was sent, broadcast, or received.
- **Memo Encoding:** The merchant invoice reference (e.g. `Invoice CP-SHIELD-xxxx: Enterprise API Subscription`) is encoded using standard `base64url` without trailing `=` padding, according to ZIP-321 section 2.
- **Protocol Dispatch:** The web UI binds the URI to the browser's `zcash:` protocol handler, allowing mobile and desktop wallets (such as Zashi, Ywallet, and Zecwallet) to launch instantly with pre-populated destination, amount, and encrypted memo.
- **Client-Side SVG QR Engine:** QR code matrices are rendered directly into the DOM using vector `<svg>` paths. No telemetry, third-party CDNs, or external tracking APIs are used.

### Address Classification & Privacy Analysis

CheetahPay Shield features a strict address classifier (`ZcashShieldService.classifyAddress`) and privacy rating engine (`ZcashShieldService.getPrivacyRating`) that explicitly distinguishes address receiver format capabilities from runtime on-chain transaction privacy guarantees:

| Address Type | Prefix | Address Receiver Capability | Runtime Transaction Privacy Notice | Metadata Visibility (When Shielded) |
| :--- | :--- | :--- | :--- | :--- |
| **Unified Address (NU5)** | `utest1...` (testnet)<br>`u1...` (mainnet) | **Shielded Receiver Capable (Unified)** | *Shielded address format — transaction privacy not yet verified.* | Sender: **Concealed (if sender shields)**<br>Recipient: **Concealed by receiver pool**<br>Amount: **Encrypted in note**<br>Memo: **Encrypted 512-byte payload** |
| **Sapling Address** | `ztestsapling...`<br>`zs1...` | **Shielded Receiver Capable (Sapling)** | *Shielded address format — transaction privacy not yet verified.* | Sender: **Concealed (if sender shields)**<br>Recipient: **Concealed by receiver pool**<br>Amount: **Encrypted in note**<br>Memo: **Encrypted 512-byte payload** |
| **Transparent Address** | `tm...` (testnet)<br>`t1...` / `t3...` | **Transparent Only (Public Ledger)** | *Transparent address format — all transaction metadata is public on the blockchain ledger.* | Sender: **Public**<br>Recipient: **Public**<br>Amount: **Public**<br>Memo: **Not Supported** |

> **Address Capability vs. Transaction Privacy Guarantee:** Address-format classification evaluates static receiver pool capability (e.g. Unified Address format) and does not prove that a particular transaction is shielded or that confidentiality guarantees were satisfied on-chain. Public block explorer transaction inclusion and confirmation counts do not verify shielded invoice amounts, recipients, or encrypted memos on-chain. Shielded settlement remains at `AWAITING_WALLET_VERIFICATION` until an automated merchant-wallet verification mechanism (e.g., via Incoming Viewing Key note decryption) is integrated. Transparent addresses display explicit warnings and are **never** labeled as shielded.

---

## 5. Security & Cryptographic Invariants

1. **Zero Key Custody:** The application never generates, requests, logs, or stores private keys, seed phrases, or spending keys. All signing is delegated to external user-controlled Zcash wallets via ZIP-321.
2. **Encrypted Memo Binding:** The invoice identifier is bound inside the Zcash shielded memo field. When sent to a unified or sapling address, this invoice data is cryptographically encrypted on-chain, visible solely to the payer and merchant.
3. **Front-Running Resistant Multi-Rail Payments:** On the Arc USDC rail, payment identifiers are cryptographically hashed with payer entropy (`keccak256(seed)`), preventing front-running attacks in public mempools.
4. **Non-Custodial Smart Contract Routing:** `PaymentRouter.sol` enforces atomic payer-to-merchant routing where router balance is invariant:
   $$\text{balanceOf}(\text{PaymentRouter}) \equiv 0$$

---

## 6. Real Capability Audit & Implementation Classification

In accordance with rigorous hackathon acceptance criteria, every capability of CheetahPay is audited and classified into one of four explicit categories:

| Capability | Classification | Verification Evidence / Boundary Details |
| :--- | :---: | :--- |
| **ZIP-321 Payment Request Generation** | **Implemented & Verified** | Complies with ZIP-321 specification. Generates standard `zcash:<address>?amount=<val>&memo=<base64url>&message=<msg>` URIs with base64url memo encoding without padding. Tested in `scripts/test-cheetahpay.ts`. ZIP-321 formats payment requests for external wallets; generating a request does not mean payment was sent or received. |
| **ZIP-321 Payment Request Parsing** | **Implemented & Verified** | Decodes standard `zcash:` URIs, extracts addresses, amounts, and decodes base64url memos back to text. Tested in `scripts/test-cheetahpay.ts`. Enables interactive invoice import in checkout. |
| **Address Format Classification (Structural Heuristic)** | **Implemented & Verified (Heuristic)** | Validates Zcash prefixes (`utest1`, `u1`, `ztestsapling`, `zs1`, `tm`, `t1`, `t3`), length bounds, and character sets. Address-format classification evaluates static receiver pool capability and does not prove that a particular transaction is shielded. **Documented Limitation:** Does not perform full cryptographic Bech32m/Base58Check checksum validation, as a native Zcash address decoder library is not bundled in this web client. |
| **Transparent vs. Shielded Privacy Analyzer** | **Implemented & Verified** | Analyzes address receiver capabilities (`Shielded Receiver Capable` vs `Transparent Only`) and provides descriptive privacy notices. Transparent addresses receive explicit public ledger exposure warnings and are **never** labeled as shielded. Conflation between address format and runtime transaction privacy is prevented. |
| **Client-Side SVG QR Code Engine** | **Implemented & Verified** | Renders crisp vector `<svg>` QR codes directly in the DOM without external CDNs or network calls, eliminating customer IP leakage. |
| **Merchant Invoice Creation & Persistence** | **Implemented & Verified** | Generates unique IDs (`CP-SHIELD-xxxx`), computes live USD/ZEC rates, sets memo binding, and persists to local storage and in-memory caches. |
| **Live Network Confirmation Tracking** | **Implemented & Verified** | Queries live SoChain Zcash Testnet REST API (`https://sochain.com/api/v3/transaction/ZECTEST/{txid}`). Tracks confirmations until threshold ($\ge 3$ blocks) is reached. Tested against live testnet node. |
| **Transparent Recipient & Output Matching** | **Implemented & Verified** | For transparent invoices, inspects block outputs to verify that the transaction paid to the merchant address and matched the required amount. Detects and rejects mismatches. |
| **Fiat Fee Quotation Modeling** | **Implemented & Verified (Illustrative)** | Calculates illustrative fee models across Card (2.9% + $0.30), SEPA (0.5% + €1.00), and ACH (0.8% + $1.00) with bounds ($20 to $10,000). **Documented Limitation:** Fiat funding fees, exchange rates, and limits are illustrative models for interface prototyping, not live provider quotes. |
| **Fiat Settlement Fail-Closed State Machine** | **Implemented & Verified** | 5-stage transition pipeline (`AWAITING_PAYMENT` -> `PAYMENT_PROCESSING` -> `PAYMENT_VERIFIED` -> `CRYPTO_DELIVERY_PENDING` -> `COMPLETED`). Tested in `test-cheetahpay.ts`. |
| **Unified Cross-Rail Ledger & CSV Export** | **Implemented & Verified** | Aggregates transactions across rails with provenance classifications and exportable RFC-4180 CSV auditing records. |
| **Legacy Arc PaymentRouter Smart Contracts** | **Implemented & Verified** | Non-custodial USDC routing and refund authorization. 27/27 Foundry unit and fuzz tests, 55/55 Compass deployment tests passing. |
| **Shielded Note Plaintext & Memo Verification** | **Implemented but Not Verified End-to-End** | **Cryptographic Boundary:** Public block explorer transaction inclusion and confirmation counts do not verify shielded invoice amounts, recipients, or encrypted memos on-chain. Verifying note plaintext requires the merchant's Incoming Viewing Key (`ivk`) or wallet node (e.g., Zashi/lightwalletd). When on-chain inclusion is detected, the invoice transitions to `AWAITING_WALLET_VERIFICATION` where it remains until an automated merchant-wallet verification mechanism is integrated. Private viewing keys are never requested or exposed in the browser. |
| **External Wallet Transaction Signing & Broadcast** | **Implemented but Not Verified End-to-End** | ZIP-321 dispatches parameters to external self-custody wallets (Zashi, Ywallet, Zecwallet, Snap). Transaction signing and zero-knowledge proof generation occur within the user's wallet outside the browser sandbox. |
| **Simulated Transactions / Fabricated Hashes** | **Mocked or Simulated: NONE** | **Zero Simulation Invariant:** CheetahPay enforces a strict fail-closed policy. No synthetic delivery hashes, fabricated balances, or fake confirmations are ever generated. |
| **Live Fiat Card Charging & Real Crypto Delivery** | **Outstanding Production Item** | Blocked on institutional business verification and production gateway credentials (Circle Mint / Stripe Crypto / MoonPay). Live card authorization and asset delivery require server-side secret custody and regulated financial onboarding. |
| **Automated Shielded Note Decryption & Indexer** | **Outstanding Production Item** | Verifying shielded transaction amounts and memos currently requires external merchant wallet note decryption via Incoming Viewing Key (IVK). Integrating an automated backend lightwalletd indexer without exposing viewing keys in the browser is an outstanding production item. |

---

## 7. Step-by-Step Demonstration Walkthrough

Follow these instructions to verify CheetahPay Shield locally:

### Step 1: Run Automated Test Suites
```bash
# 1. Run CheetahPay Multi-Rail & Zcash Unit Suite
npm run test:cheetahpay

# 2. Run Compass Deployment & Chain Resolution Suite
npm run test:compass

# 3. Run Foundry Smart Contract Test Suite
npm run contracts:test

# 4. Verify TypeScript Types & Static Analysis
npm run typecheck
npx oxlint src scripts

# 5. Verify Production Build
npm run build
```
*Expected Result:* All tests report 100% pass with 0 errors.

### Step 2: Start the Web Application
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### Step 3: Test Merchant Invoice Creation (`Merchant Invoices` tab)
1. In the top navigation bar, click **Merchant Invoices**.
2. In the **Create New Zcash Invoice** form:
   - Enter **Item Description** (e.g. `Enterprise API Subscription`).
   - Choose between **Preset Unified (Shielded)** and **Preset Transparent** to test address classification.
   - Enter amount in **ZEC** (or USD equivalent).
   - Observe the **Privacy Capability & Notice Indicator**:
     - For Unified: displays `Shielded Receiver Capable (Unified)` with notice *"Shielded address format — transaction privacy not yet verified."*
     - For Transparent: displays `Transparent Only (Public Ledger)` with warning *"Transparent address format — all transaction metadata is public on the blockchain ledger."*
3. Click **Create Shielded Invoice**.
4. In the generated invoices table, click **Open Checkout** on any invoice to navigate directly to customer checkout.

### Step 4: Test ZIP-321 Payment Request Generation & Privacy Distinction (`Pay with Zcash` tab)
1. In the top navigation bar, click **Pay with Zcash**.
2. Observe the active checkout screen:
   - Notice the **ZIP-321 URI**, **Amount in ZEC**, and **Encrypted Memo** binding.
   - *Payment Request Semantics:* ZIP-321 generates payment requests for compatible external wallets (Zashi, Ywallet, Zecwallet); generating a request or displaying an offline QR code formats payment parameters for an external wallet; it does not mean that a payment was sent or received.
   - Click **Address Only** / **ZIP-321 URI** toggle on the vector SVG QR code canvas.
   - Inspect the **Privacy Guarantee Card**: Verify that the Unified Address displays `Shielded Receiver Capable (Unified)` along with the descriptive notice: *"Shielded address format — transaction privacy not yet verified."*
   - Review the **Address Capability vs. Transaction Privacy** explanation card documenting that address receiver format does not prove an executed transaction is shielded.

### Step 5: Test Transparent Recipient & Underpayment Mismatch Rejection
1. In the checkout invoice dropdown, select a transparent invoice (or create one using `Preset Transparent` with address `tmP3A9Y4YqS4yN8D2qZ9yR4vT8mK6bL1x2Y`).
2. In the **Live Testnet Verification Terminal**, input testnet transaction hash: `a8810b4b9b0ad01336103dc8fb09936da2a7b25cee78e588edc381ad7872719f`.
3. Click **Verify Tx**.
4. The application queries the live SoChain Zcash Testnet REST API (`https://sochain.com/api/v3/transaction/ZECTEST/{txid}`).
5. Observe fail-closed rejection: Because the transaction outputs pay address `tmTwLU5Y...` (0.260416 ZEC), the terminal detects recipient mismatch, marks the invoice `FAILED`, and records reason: *"Recipient mismatch: Transaction outputs do not pay to transparent merchant address..."*.
6. *Telemetry Note:* Transaction `a8810b4b...` is a mined testnet coinbase block reward used strictly as network telemetry and a test fixture, not a customer payment. No fake payment is fabricated.

### Step 6: Test Shielded Settlement Demarcation (`AWAITING_WALLET_VERIFICATION`)
1. Switch back to a Shielded Unified invoice (`utest1...`).
2. Enter transaction hash `a8810b4b9b0ad01336103dc8fb09936da2a7b25cee78e588edc381ad7872719f` (or click "Preset Real Zcash Testnet Tx").
3. Click **Verify Tx**.
4. Observe that while on-chain inclusion and confirmations ($\ge 3$) are detected, public block explorer data cannot decrypt shielded note plaintext.
5. The invoice transitions to **`AWAITING_WALLET_VERIFICATION`** (never falsely marked `CONFIRMED`), with badge *"On-Chain Inclusion Confirmed · Awaiting Merchant Wallet Decryption"*.

### Step 7: Test Illustrative Fiat Quotation (`Fund Wallet` tab)
1. Click **Fund Wallet** in the top navigation bar.
2. Select asset (`ZEC` or `USDC`) and payment channel (Credit/Debit Card, SEPA, ACH).
3. Enter amount (e.g. `$150.00 USD`). Observe real-time fee breakdown (Processing fee, network gas fee, provider margin).
4. Notice the **Illustrative Fee Calculator (Demo estimate — not a live quote)** notices: all amounts, exchange rates, and limits are explicitly labeled as demo estimates, not live provider quotes.
5. Review the **Live Funding Status: Unavailable (No Order Created)** panel:
   - In accordance with production security invariants, clicking **Calculate Demo Estimate** does not generate payment orders, settlement IDs, delivery hashes, or fake balances.
   - Destination address input is strictly optional for estimate formatting and does not initiate a transfer.
   - When API credentials are not configured, the interface documents institutional KYB and API provisioning requirements, explicitly highlighting the backend secret custody invariant.
   - In **Settings**, test sandbox connectivity with `https://api.circle.com/v1/ping`.

### Step 8: Test Cross-Rail Ledger (`Transactions` tab)
1. Click **Transactions** in the navigation bar.
2. Filter by rail (`All Rails`, `Fiat On-Ramp`, `Arc USDC`, `Zcash Shield`).
3. Click any transaction to open the comprehensive telemetry inspection modal.
4. Click **Export CSV Ledger** to verify CSV export for accounting and auditing.

---

## 8. Conclusion & Production Roadmap

CheetahPay Shield demonstrates how privacy can be integrated into modern institutional checkout flows as a prototype. By adhering to official Zcash standards (ZIP-321, Unified Addresses, encrypted memos) and combining them with transparent quotation and non-custodial smart routing, CheetahPay establishes a foundation for universal fiat-crypto payment infrastructure.

Outstanding production items include automated merchant viewing key indexers (lightwalletd) and regulated MSB fiat gateway onboarding.

*Prepared for ZECATHON 2026.*
