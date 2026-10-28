# CheetahPay Shield — Brand Film Screen Recording & Post-Production Guide

> **Film Title:** *One Payment Experience. Different Worlds.*  
> **Target Video Specs:** 1920 × 1080 (16:9), 30.00 fps, H.264 (High Profile, Level 4.2), AAC Stereo 48 kHz  
> **Master Voiceover Track:** [`cheetahpay-brand-film-voiceover.mp3`](./cheetahpay-brand-film-voiceover.mp3) (Duration: 78.39s)  
> **Captions:** [`cheetahpay-brand-film-captions.srt`](./cheetahpay-brand-film-captions.srt)  
> **Script:** [`cheetahpay-brand-film-script.txt`](./cheetahpay-brand-film-script.txt)  
> **Application Entry:** [https://cheetah-pay-ht9p.vercel.app](https://cheetah-pay-ht9p.vercel.app) or local `http://localhost:5173`

---

## PART 1 — Screen Recording Coordination & Shot Instructions

Record your screen in native **1920 × 1080 (or 2560 × 1440)** with your browser set to **100% zoom** in Full Screen (`F11`). Ensure the operating system taskbar, bookmark bar, and notification popups are hidden.

Save each raw recording file in a dedicated subfolder:  
`docs/demo-assets/ad-film/raw-recordings/`

Use the exact shot names specified below:

```
docs/demo-assets/ad-film/raw-recordings/
 ├── 01_overview.mp4
 ├── 02_invoice.mp4
 ├── 03_checkout.mp4
 ├── 04_testnet_verification.mp4
 ├── 05_transactions.mp4
 ├── 06_fund_wallet.mp4
 └── 07_closing.mp4
```

---

### Shot 1: `01_overview.mp4`
* **Screen:** Overview Dashboard (`/`)
* **Target Usable Duration in Edit:** ~4–5 seconds (record 8 seconds)
* **Voiceover Sync:** Plays under opening music and early intro.
* **Recording Actions:**
  1. Start on the main **Overview** dashboard.
  2. Keep cursor parked cleanly or glide smoothly over the top header:
     - Hover over `Zcash Testnet (NU5 / SoChain Node)`.
     - Hover over the **ZIP-321 / Unified** privacy standard KPI card.
  3. Hold steady on the restrained dark cards.
* **Safety Invariant:** Zero actions that request keys or connect wallets.

---

### Shot 2: `02_invoice.mp4`
* **Screen:** Merchant Invoices Tab
* **Target Usable Duration in Edit:** ~15 seconds (record 18–20 seconds)
* **Voiceover Sync:** `"In our merchant suite, creating a payment request is standard, intuitive, and native to Zcash..."`
* **Recording Actions:**
  1. Start with the **Create New Invoice** panel open.
  2. Move cursor deliberately to **Preset Transparent** (`tmP3A9Y4...`) and click once:
     - Hold for 2 seconds to let the viewer see the amber badge: `Transparent Only (Public Ledger)` and the ledger exposure disclaimer.
  3. Move cursor to **Preset Shielded** (`utest1...`) and click once:
     - Hold for 2 seconds to let the badge change dynamically to `Shielded Receiver Capable (Unified)`.
  4. Click the Amount field and type `0.500000` ZEC (watch the USD equivalent update).
  5. Move cursor to **Generate ZIP-321 Invoice & Open Checkout** and click.
* **Safety Invariant:** These presets use testnet addresses. No real payment or on-chain broadcast occurs when generating an invoice.

---

### Shot 3: `03_checkout.mp4`
* **Screen:** Pay with Zcash Tab (Active Checkout View)
* **Target Usable Duration in Edit:** ~16 seconds (record 20 seconds)
* **Voiceover Sync:** `"Checkout is orchestrated via the ZIP-321 standard. Customers scan an offline, client-side vector QR code..."`
* **Recording Actions:**
  1. Arrive at the checkout screen generated from Shot 2.
  2. Point cursor to the SVG QR code and toggle between **ZIP-321 URI** and **Address Only**.
  3. Move down to the **Payment Request Memo (Invoice Reference)** box:
     - Hover over the memo text (`Invoice CP-SHIELD-2026-XXXX`).
     - Point cursor to the explanatory text: *"Encoded into ZIP-321 request. Encrypted into the 512-byte on-chain shielded note by the payer's wallet during transfer."*
  4. Hover smoothly over the **Open in Zcash Wallet** button (`zcash:` URI protocol dispatch link).
* **Safety Invariant:** Do not click external wallet launch links during screen capture to avoid OS dialog popups.

---

### Shot 4: `04_testnet_verification.mp4`
* **Screen:** Pay with Zcash Tab (Scrolled down to Testnet Terminal)
* **Target Usable Duration in Edit:** ~14 seconds (record 18 seconds)
* **Voiceover Sync:** `"When verifying payments, CheetahPay enforces strict technical honesty. On-chain block inclusion is confirmed through live testnet telemetry..."`
* **Recording Actions:**
  1. Scroll down until the **Live Testnet Verification Terminal** is centered.
  2. In the sample demonstration box, click **Load Sample Testnet Tx**:
     - The transaction ID `a8810b4b...` fills the input.
     - Hover over the explicit notice: **`Testnet example — not a customer payment.`**
  3. Click **Verify Tx**:
     - The verification spinner activates while polling SoChain Testnet API.
     - The result card resolves with block number `4548318` and block confirmations.
     - Highlight the status badge: **`AWAITING WALLET VERIFICATION`** (*"On-Chain Inclusion Confirmed · Awaiting Merchant Wallet Decryption"*).
* **Safety Invariant:** This transaction is a known mined block reward on testnet. Never claim or display this as an actual settled customer invoice.

---

### Shot 5: `05_transactions.mp4`
* **Screen:** Transactions Tab
* **Target Usable Duration in Edit:** ~5 seconds (record 8 seconds)
* **Voiceover Sync:** `"From unified cross-rail transaction auditing..."`
* **Recording Actions:**
  1. Click **Transactions** in the top navigation.
  2. Show the multi-rail cross-settlement table with provenance tags (`shielded-verified`, `onchain-verified`, `fiat-cleared`).
  3. Hover cursor over the rail filter badges.
  4. Click **Export CSV Ledger** (a clean toast confirms download).
* **Safety Invariant:** No simulated or fake customer balances are presented.

---

### Shot 6: `06_fund_wallet.mp4`
* **Screen:** Fund Wallet Tab
* **Target Usable Duration in Edit:** ~5 seconds (record 8 seconds)
* **Voiceover Sync:** `"...to illustrative onboarding estimators, every interaction is built fail-closed, non-custodial, and verifiable."`
* **Recording Actions:**
  1. Click **Fund Wallet** in navigation.
  2. Select asset **ZEC** and payment method **Debit / Credit Card**.
  3. Point cursor to the fee breakdown where every line item is explicitly labeled **`Demo estimate — not a live quote`**.
  4. Hover over the **Calculate Demo Estimate** button.
  5. Show the safeguards banner: *"Live funding unavailable — no payment order created."*
* **Safety Invariant:** **DO NOT** enter real credit card numbers, bank credentials, or private keys. The calculator is purely illustrative.

---

### Shot 7: `07_closing.mp4`
* **Screen:** Overview / Clean Logo Lockup
* **Target Usable Duration in Edit:** ~4 seconds (record 6 seconds)
* **Recording Actions:**
  1. Return to the clean Overview screen.
  2. Park cursor outside the main frame or highlight the CheetahPay Shield brand logo at top-left.

---

## PART 2 — Sound Design & Audio Post-Production

### 1. Dialogue (Voiceover) Mastering
* **Track:** `cheetahpay-brand-film-voiceover.mp3`
* **Target Loudness:** `-14.0 LUFS` (Integrated), True Peak `-1.0 dBTP`
* **EQ Curve:**
  * High-pass filter: 80 Hz, 18 dB/oct slope (removes unwanted sub-rumble).
  * Presence boost: +1.5 dB shelf at 4.2 kHz (enhances vocal articulation and institutional intimacy).
  * Gentle de-essing: -2.5 dB reduction centered at 6.8 kHz.
  * Mild optical compression: 2.5:1 ratio, 35ms attack, 120ms release.

### 2. Cinematic Music & Ambient Sound Bed
* **Key & Mood:** C Minor / E-flat Major institutional ambient drone; warm, minimal, high-frequency air, low-frequency warmth.
* **Music Mixing Level:**
  * Opening (0:00 – 0:07): `-16.0 dB` (establishes mood before voiceover).
  * Under Narration (0:07 – 1:11): Sidechain ducked to `-23.0 dB` (leaves narration 100% clean and intelligible).
  * Brand Resolve (1:11 – 1:22): Ascends gracefully to `-14.0 dB` before resolving on a warm sustained chord with a 3-second acoustic decay.

### 3. Foley & Interface Sound Effects (Foley SFX)
* `sfx_sub_swell.wav` (0:00.8): 42 Hz sub-bass swell as the amber line emerges.
* `sfx_node_ping.wav` (0:02.5, 0:04.2): Crystalline micro-ping when network nodes illuminate.
* `sfx_haptic_click.wav` (0:22.0, 0:25.0): Sub-bass tactile click on address preset selection.
* `sfx_qr_toggle.wav` (0:36.5): High-frequency camera-shutter click on QR view switch.
* `sfx_data_pulse.wav` (0:56.0): Electronic data chime when testnet node verifies block inclusion.
* `sfx_csv_export.wav` (1:05.5): Crisp mechanical paper rustle on CSV download.
* `sfx_sonic_logo.wav` (1:18.5): Three-note signature acoustic resolve.

---

## PART 3 — Automated Video Assembly Script

When you have placed your 7 screen recordings in `docs/demo-assets/ad-film/raw-recordings/`, run the automated assembly script:

```bash
# Windows PowerShell / Command Prompt
npm run video:assemble-ad
```

Or execute the provided FFmpeg script directly:

```bash
ffmpeg -y \
  -i docs/demo-assets/ad-film/raw-recordings/01_overview.mp4 \
  -i docs/demo-assets/ad-film/raw-recordings/02_invoice.mp4 \
  -i docs/demo-assets/ad-film/raw-recordings/03_checkout.mp4 \
  -i docs/demo-assets/ad-film/raw-recordings/04_testnet_verification.mp4 \
  -i docs/demo-assets/ad-film/raw-recordings/05_transactions.mp4 \
  -i docs/demo-assets/ad-film/raw-recordings/06_fund_wallet.mp4 \
  -i docs/demo-assets/ad-film/cheetahpay-brand-film-voiceover.mp3 \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v][5:v]concat=n=6:v=1:a=0[v];[v]subtitles=docs/demo-assets/ad-film/cheetahpay-brand-film-captions.srt:force_style='FontSize=22,PrimaryColour=&H00F6F4F3,OutlineColour=&H00100D0B,Outline=2,Shadow=1,MarginV=45'[vsub]" \
  -map "[vsub]" -map 6:a \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 256k \
  docs/demo-assets/ad-film/cheetahpay-brand-film-master.mp4
```

---

## PART 4 — Truthful Editorial Safeguards Checklist

Before final render and export, verify every single item below:

- [x] **No Synthetic Privacy Scores:** No "100% Shielded" percentages or badges.
- [x] **Receiver Format Accuracy:** Unified addresses labeled as *capable* of shielded pools; transparent addresses display public ledger exposure warnings.
- [x] **Zero Custody Invariant:** Narration and visuals explicitly reinforce that generating ZIP-321 requests formats parameters and never touches private keys.
- [x] **Testnet Telemetry Honesty:** Mined block reward `a8810b4b...` retains its explicit badge: **`Testnet example — not a customer payment.`**
- [x] **Fail-Closed Shielded Settlement:** Status stays at `AWAITING_WALLET_VERIFICATION` because public explorers cannot decrypt shielded notes without merchant viewing keys.
- [x] **Illustrative Fiat On-Ramp:** Fund Wallet calculator is unambiguously marked **`Demo estimate — not a live quote`**; no payment orders or balances are generated.
- [x] **Authentic Prototype Presentation:** Tagline *“Pay fiat to Web3. Pay crypto to Web2.”* is framed as an architectural exploration for ZECATHON 2026, without claiming active MSB banking licenses.
