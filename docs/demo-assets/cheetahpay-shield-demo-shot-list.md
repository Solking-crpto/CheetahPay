# CheetahPay Shield — Video Demo Recording Shot List

> **Project:** CheetahPay Shield (ZECATHON 2026 Submission)  
> **Target Audio Duration:** ~97.2 seconds (fits 90–120s judging window)  
> **Master Voiceover Track:** [`cheetahpay-shield-demo-voiceover.mp3`](./cheetahpay-shield-demo-voiceover.mp3)  
> **Captions File:** [`cheetahpay-shield-demo-captions.srt`](./cheetahpay-shield-demo-captions.srt)  
> **Script File:** [`cheetahpay-shield-demo-voiceover.txt`](./cheetahpay-shield-demo-voiceover.txt)  
> **Application URL:** [https://cheetah-pay-ht9p.vercel.app](https://cheetah-pay-ht9p.vercel.app) or `http://localhost:5173`

---

## Shot-by-Shot Timeline & Recording Guide

### Scene 1: Introduction & Dashboard Overview (0:00 – 0:14)
* **Screen:** `Overview` (`/` or Overview Tab)
* **Visual Actions:**
  1. Start on the main **Overview** dashboard.
  2. Hover smoothly over the **Zcash Testnet (NU5 / SoChain Node)** active network badge.
  3. Point the mouse to the **ZIP-321 / Unified** privacy standard KPI card.
  4. Show the clean, restrained dark monochrome aesthetic (`#0B0D10` charcoal background with `#D6A23D` muted amber accents).
* **Narration:**
  > *"Welcome to CheetahPay Shield, a privacy-focused merchant payment prototype built for ZECATHON 2026. CheetahPay explores confidential Web3 checkout and multi-rail settlement, designed natively around the Zcash network."*
* **Truthful Disclosure:**
  CheetahPay Shield is a hackathon prototype demonstrating privacy request flows and settlement boundaries.

---

### Scene 2: Merchant Invoices & Dynamic Privacy Classification (0:15 – 0:41)
* **Screen:** `Merchant Invoices` Tab
* **Visual Actions:**
  1. Click the **Merchant Invoices** tab in the top navigation.
  2. Point to the **Create New Invoice** panel.
  3. Click **Preset Transparent** (`tmP3A9Y4...`):
     - Show the dynamic badge switch to `Transparent Only (Public Ledger)`.
     - Highlight the amber warning: *"Transparent address format — all transaction metadata is public on the blockchain ledger."*
  4. Click **Preset Shielded** (`utest1...`):
     - Show the badge switch to `Shielded Receiver Capable (Unified)`.
     - Highlight notice: *"Shielded address format — transaction privacy not yet verified."*
  5. Enter amount `0.500000` ZEC (auto-calculates USD equivalent).
  6. Click **Generate ZIP-321 Invoice & Open Checkout**.
* **Narration:**
  > *"In the Merchant Invoices suite, merchants create standardized payment requests in ZEC. When entering an address, CheetahPay analyzes the receiver format. Unified addresses support shielded receiver pools, while transparent addresses display explicit public ledger warnings. Setting an amount generates a ZIP-321 request with our invoice reference bound directly into the memo field, opening checkout instantly."*
* **Truthful Disclosure:**
  Address-format classification is a structural capability check; it does not prove an executed transaction was shielded on-chain.

---

### Scene 3: Pay with Zcash (ZIP-321 Checkout) & Testnet Verification (0:42 – 1:09)
* **Screen:** `Pay with Zcash` Tab
* **Visual Actions:**
  1. Arrive at the generated checkout screen.
  2. Toggle between **ZIP-321 URI** and **Address Only** on the client-side vector SVG QR code canvas.
  3. Show the **Payment Request Memo** box with the bound invoice reference (`Invoice CP-SHIELD-...`).
  4. Hover over the **Open in Zcash Wallet** button (`zcash:` URI protocol link).
  5. Scroll down to the **Live Testnet Verification Terminal**:
     - Click **Load Sample Testnet Tx** (fills mined block reward `a8810b4b...`).
     - Point out the label: *"Testnet example — not a customer payment."*
     - Click **Verify Tx** (spin icon queries live SoChain Testnet API).
     - Show the resulting badge: **`AWAITING WALLET VERIFICATION`** (*"On-Chain Inclusion Confirmed · Awaiting Merchant Wallet Decryption"*).
* **Narration:**
  > *"In Pay with Zcash, customers receive an offline, client-side SVG QR code or can launch their wallet via ZIP-321 protocol dispatch. It is important to note that generating a payment request formats transaction parameters; it does not broadcast funds. In our testnet verification terminal, querying on-chain transactions confirms block inclusion, while shielded note plaintext properly remains awaiting external merchant wallet decryption."*
* **Truthful Disclosure:**
  Public block explorers cannot decrypt shielded notes or verify note amounts/memos. Verification stays at `AWAITING_WALLET_VERIFICATION` until the merchant wallet decrypts the note via Incoming Viewing Key.

---

### Scene 4: Fund Wallet Demo Estimator (1:10 – 1:23)
* **Screen:** `Fund Wallet` Tab
* **Visual Actions:**
  1. Click **Fund Wallet** in the navigation bar.
  2. Select asset **ZEC** and payment method **Debit / Credit Card**.
  3. Enter `$150.00 USD`.
  4. Hover over the **Illustrative Fee Calculator**:
     - Point out the badge: `Demo estimate — not a live quote`.
     - Point to the individual fee line items all labeled `Demo estimate — not a live quote`.
  5. Check the required acknowledgment box: *"I understand this is an illustrative demo estimate..."*
  6. Click **Calculate Demo Estimate**.
  7. Point out the **Live Funding Status: Unavailable (No Order Created)** safeguards panel.
* **Narration:**
  > *"For Web2 onboarding, the Fund Wallet interface functions as an illustrative fee calculator. All calculations and conversion rates are demo estimates, not live quotes. Live fiat funding is unavailable, and no payment orders or balances are created."*
* **Truthful Disclosure:**
  No real fiat is charged, no crypto is delivered, and no fake payment orders or synthetic balances are created.

---

### Scene 5: Cross-Rail Ledger & Export (1:24 – 1:37)
* **Screen:** `Transactions` Tab
* **Visual Actions:**
  1. Click **Transactions** in the navigation.
  2. Show the multi-rail cross-settlement table with provenance classifications (`shielded-verified`, `onchain-verified`, `fiat-cleared`).
  3. Filter by rail (`Zcash Shield`, `Arc USDC`, `Fiat On-Ramp`).
  4. Click **Export CSV Ledger** to show instant RFC-4180 audit file download.
  5. End on the clean dashboard view.
* **Narration:**
  > *"Finally, the cross-rail ledger aggregates transaction telemetry with provenance classifications and one-click CSV auditing export. CheetahPay Shield establishes a practical foundation for privacy-aware commerce on Zcash."*

---

## Summary of Truthful Invariants to Maintain During Demo
1. **ZIP-321:** Formats payment requests; does not send or broadcast money.
2. **Address Formats:** Unified addresses classify shielded receiver capabilities; they do not prove that an on-chain transfer was shielded.
3. **Public Explorers:** Can prove transaction inclusion and block confirmations; cannot decrypt shielded notes.
4. **Fund Wallet:** Illustrative simulation tool only; live on-ramps require regulated MSB onboarding and backend secret custody.
5. **Sample Transaction:** Mined block reward fixture used to demonstrate live block polling; not a customer invoice payment.
