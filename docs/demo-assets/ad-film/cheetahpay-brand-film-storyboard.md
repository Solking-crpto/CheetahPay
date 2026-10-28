# CheetahPay Shield — Brand Advertisement Storyboard
## "One Payment Experience. Different Worlds."

> **Format:** 16:9 Widescreen (1920 × 1080 @ 30 fps)  
> **Total Target Duration:** 82.0 Seconds (Narration: 78.39 Seconds)  
> **Visual Identity:** CheetahPay Institutional Dark Palette  
> Background: `#0B0D10` | Cards: `#12151A` | Borders: `#2A3038` | Text: `#F3F4F6` | Amber Accent: `#D6A23D`  
> **Master Voiceover Track:** [`docs/demo-assets/ad-film/cheetahpay-brand-film-voiceover.mp3`](./cheetahpay-brand-film-voiceover.mp3)  
> **Captions:** [`docs/demo-assets/ad-film/cheetahpay-brand-film-captions.srt`](./cheetahpay-brand-film-captions.srt)  
> **Script:** [`docs/demo-assets/ad-film/cheetahpay-brand-film-script.txt`](./cheetahpay-brand-film-script.txt)

---

## Storyboard Overview & Narrative Arc

```
+-------------------------------------------------------------------------------------------------------+
|  0:00 - 0:07       0:07 - 0:17       0:17 - 0:32       0:32 - 0:48       0:48 - 1:02    1:02 - 1:11   1:11 - 1:18    1:18 - 1:22   |
|  SCENE 1           SCENE 2           SCENE 3           SCENE 4           SCENE 5        SCENE 6       SCENE 7        SCENE 8       |
|  The World Moves   Merchant's Need   Meet CheetahPay   A Request, Clear  Transparency   One Workflow  Brand Resolve  Closing Card  |
|  Amber line        Fragmented rails  Invoicing Suite   ZIP-321 Checkout  Testnet Node   Cross-Ledger  Different      Tagline &     |
|  in darkness       Business tension  Unified Pools     Bound Memo & QR   Honest Scope   Demo Estimate Worlds Connect ZECATHON 2026 |
+-------------------------------------------------------------------------------------------------------+
```

---

### Scene 1 — The World Moves (0:00 – 0:07)
* **Duration:** 7.0 seconds (Timecode `00:00:00,000` to `00:00:07,000`)
* **Narration (0:00 – 0:06.9):**
  > *"Commerce moves across worlds. Old ledgers and new chains. Regulated rails and decentralized networks."*
* **Visual Composition:**
  * Opens in deep charcoal darkness (`#0B0D10`).
  * At 0:01, a razor-thin amber line (`#D6A23D`, 1.5px) enters from the left third, moving horizontally with subtle kinetic deceleration.
  * Three precise circular nodes illuminate along the line, pulsing gently with a low-opacity amber glow.
  * Centered typography fades up in elegant, high-tracking soft-white (`#F3F4F6`, Inter/SF Pro Display):
    ```
    COMMERCE MOVES ACROSS WORLDS
    ```
* **Sound Design:**
  * Low-frequency sub-bass swell (42 Hz) establishing institutional weight.
  * Delicate high-frequency metallic chime as the amber line intersects each node.
  * Crisp, warm voiceover enters at 0:00.3, mastered above the subtle ambient floor.
* **Cut / Transition:** Match-dissolve from the amber line into the structured grid lines of the merchant workspace.

---

### Scene 2 — The Merchant's Need (0:07 – 0:17)
* **Duration:** 10.0 seconds (Timecode `00:00:07,000` to `00:00:17,000`)
* **Narration (0:07.1 – 0:17.0):**
  > *"For modern merchants, accepting value across fragmented financial systems has always meant friction—juggling disparate custody models, currency volatility, and incompatible rails."*
* **Visual Composition:**
  * Clean, minimal architectural framing of a modern financial workspace: an ultra-high-resolution matte screen on a dark desk.
  * Subtle graphic overlays show disconnected financial vectors: traditional clearinghouses, card networks, and public blockchain ledgers.
  * Text cards float with restrained typography:
    * `Disparate Custody`
    * `Public Ledger Exposure`
    * `Settlement Fragmentation`
  * The amber line weaves through the disconnected cards, seeking a unified path.
* **Sound Design:**
  * Faint rhythmic mechanical pulse (evoking the disciplined precision of a Swiss clock or high-speed data transmission).
  * Subtle tonal dissonance under *"incompatible rails"*, resolving into a clean pause.
* **Cut / Transition:** Smooth kinetic push-in transitioning directly into the actual CheetahPay user interface.

---

### Scene 3 — Introducing CheetahPay (0:17 – 0:32)
* **Duration:** 15.0 seconds (Timecode `00:00:17,000` to `00:00:32,000`)
* **Narration (0:17.1 – 0:32.3):**
  > *"Meet CheetahPay Shield. In our merchant suite, creating a payment request is standard, intuitive, and native to Zcash. The system transparently classifies receiver capabilities—alerting users to public address exposure while unlocking the power of shielded Unified pools."*
* **Visual Composition (Real Screen: `02_invoice`):**
  * Title overlay slides up smoothly:
    ```
    MEET CHEETAHPAY SHIELD
    Merchant Invoicing & Dynamic Receiver Classification
    ```
  * Cursor clicks **Preset Transparent** (`tmP3A9Y4...`).
    * The UI reacts instantly: Amber badge illuminates **`Transparent Only (Public Ledger)`**.
    * Camera draws focus to the explicit warning: *"Transparent address format — all transaction metadata is public on the blockchain ledger."*
  * Cursor smoothly moves to **Preset Shielded** (`utest1...`).
    * The UI transitions dynamically to **`Shielded Receiver Capable (Unified)`**.
    * Notice reflects: *"Shielded address format — transaction privacy not yet verified."*
  * User inputs `0.500000` ZEC; USD estimate updates instantly.
  * Cursor clicks **Generate ZIP-321 Invoice & Open Checkout**.
* **Sound Design:**
  * Satisfying tactile micro-click on preset selection.
  * Soft harmonic chord progression entering beneath the voiceover, highlighting technical resolution.
* **Cut / Transition:** Whip-pan right as the checkout view opens.

---

### Scene 4 — A Request, Clearly Presented (0:32 – 0:48)
* **Duration:** 16.0 seconds (Timecode `00:00:32,000` to `00:00:48,000`)
* **Narration (0:32.7 – 0:48.6):**
  > *"Checkout is orchestrated via the ZIP-321 standard. Customers scan an offline, client-side vector QR code or dispatch directly to their personal wallet. The invoice reference is bound securely into the memo—formatting payment parameters without touching private keys."*
* **Visual Composition (Real Screen: `03_checkout`):**
  * Screen: **Pay with Zcash** checkout interface.
  * Upper-third typographic title:
    ```
    ZIP-321 PAYMENT DISPATCH
    Standardized Requests · Zero Key Custody
    ```
  * Close framing on the client-side SVG QR code:
    * Subtle interactive toggle between **ZIP-321 URI** and **Address Only**.
  * Cursor highlights the **Payment Request Memo (Invoice Reference)** card:
    * Shows bound invoice memo: `Invoice CP-SHIELD-2026-XXXX | Merchant Ref: MS-8842`
    * Subtitle highlighted: *"Encoded into ZIP-321 request. Encrypted into the 512-byte on-chain shielded note by the payer's wallet during transfer."*
  * Cursor hovers over **Open in Zcash Wallet** (`zcash:` URI protocol dispatch).
* **Sound Design:**
  * Crisp digital aperture click when toggling the QR view.
  * Warm synthesizer pad sustaining under the explanation of zero key custody.
* **Cut / Transition:** Vertical downward scroll into the testnet verification terminal.

---

### Scene 5 — Privacy Requires Precision (0:48 – 1:02)
* **Duration:** 14.0 seconds (Timecode `00:00:48,000` to `00:01:02,300`)
* **Narration (0:48.9 – 0:01:02.3):**
  > *"When verifying payments, CheetahPay enforces strict technical honesty. On-chain block inclusion is confirmed through live testnet telemetry, while shielded note plaintexts remain protected until decrypted by the merchant's private wallet."*
* **Visual Composition (Real Screen: `04_testnet_verification`):**
  * Screen: **Live Testnet Verification Terminal**.
  * Lower-third typographic title:
    ```
    TECHNICAL HONESTY IN SETTLEMENT
    On-Chain Telemetry vs Private Note Decryption
    ```
  * Cursor clicks **Load Sample Testnet Tx**:
    * Mined reward transaction `a8810b4b...` fills the transaction ID field.
    * Viewer clearly sees the explicit label:
      **`Testnet example — not a customer payment.`**
  * Cursor clicks **Verify Tx**:
    * Real-time network query spinner spins; SoChain node responds with block `4548318` and block confirmations.
    * Status badge cleanly renders: **`AWAITING WALLET VERIFICATION`**
    * Subtext highlighted: *"On-Chain Inclusion Confirmed · Awaiting Merchant Wallet Decryption"*.
* **Sound Design:**
  * Low electronic data pulse as query resolves.
  * Subtle audio pause emphasizing the gravity of cryptographic truth.
* **Cut / Transition:** Clean lateral slide into the cross-rail ledger.

---

### Scene 6 — One Coherent Workflow (1:02 – 1:11)
* **Duration:** 9.0 seconds (Timecode `00:01:02,300` to `00:01:11,600`)
* **Narration (01:02.5 – 01:11.6):**
  > *"From cross-rail transaction records with CSV export to illustrative funding estimators, our checkout and settlement logic is built non-custodial, fail-closed, and transparent about verification limits."*
* **Visual Composition (Split-Screen / Rapid Sequence: `05_transactions` & `06_fund_wallet`):**
  * **01:02 – 01:06:** **Transactions** tab.
    * Multi-rail table showing provenance tags: `shielded-verified`, `onchain-verified`, `fiat-cleared`.
    * Cursor clicks **Export CSV Ledger**; download confirmation appears.
  * **01:06 – 01:11:** **Fund Wallet** tab.
    * Shows asset calculator for ZEC with clear badge: **`Demo estimate — not a live quote`**.
    * Cursor hovers over **Calculate Demo Estimate**; prominent status banner reinforces: *"Live funding unavailable — no payment order created."*
* **Sound Design:**
  * Crisp paper-like rustle / shutter sound on CSV export.
  * Reassuring low-pass filtered electronic bass cadence.
* **Cut / Transition:** Seamless zoom-out dissolving back into the minimalist dark space of Scene 1.

---

### Scene 7 — The Brand Statement (1:11 – 1:18)
* **Duration:** 7.0 seconds (Timecode `00:01:11,600` to `00:01:18,300`)
* **Narration (01:11.7 – 01:18.3):**
  > *"One coherent payment experience, bridging disparate financial worlds. CheetahPay Shield. Pay fiat to Web3. Pay crypto to Web2."*
* **Visual Composition:**
  * The amber line sweeps inward from top and bottom horizons, intersecting in the golden ratio center.
  * A geometric shield vector outlines in crisp amber (`#D6A23D`).
  * The CheetahPay mark resolves with immaculate typographic precision:
    ```
    CHEETAHPAY SHIELD
    ```
  * Subtitle unfolds beneath:
    ```
    Pay fiat to Web3. Pay crypto to Web2.
    ```
* **Sound Design:**
  * Musical theme ascends to its emotional peak—a rich, warm analog synthesizer chord (C minor to E-flat major) infused with deep sub-bass and a crystalline piano note.
* **Cut / Transition:** Dissolve to the final closing card.

---

### Scene 8 — Closing Card (1:18 – 1:22)
* **Duration:** 4.0 seconds (Timecode `00:01:18,300` to `00:01:22,000`)
* **Narration:** Natural silence; musical reverb tail fades smoothly into pristine silence.
* **Visual Composition:**
  * Minimalist, institutional closing lockup centered on dark charcoal canvas (`#0B0D10`):
    ```
    CHEETAHPAY SHIELD
    Pay fiat to Web3. Pay crypto to Web2.

    ZECATHON 2026 PROTOTYPE
    https://cheetah-pay-ht9p.vercel.app
    ```
  * A tiny 1px amber dot pulses once at the base, then holds steady.
* **Sound Design:**
  * Signature CheetahPay sonic logo: a three-note warm acoustic resolve with a 2-second ambient reverb tail fading to -inf dB.
* **Finish:** Fades to black at 01:22.0.
