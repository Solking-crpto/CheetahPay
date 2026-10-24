# CheetahPay — PaymentRouter

Non-custodial USDC checkout and refund routing for [Arc](https://arc.io), Circle's USDC-native blockchain.

Built with [Arc Studio](https://studio.arc.io)

---

## What it does

CheetahPay's `PaymentRouter` contract lets a payer send USDC to a merchant via a unique payment ID. The router transfers funds directly (payer → merchant) and never takes custody. Merchants can issue partial or full refunds by approving the router to pull USDC back to the original payer. All limits are enforced on-chain.

## Tech stack

- **Contracts:** Solidity 0.8.28, Foundry, OpenZeppelin Contracts 5.6.1
- **Chain:** Arc Testnet (Chain ID 5042002) / Arc Mainnet (Chain ID 5042)
- **Token:** USDC ERC-20 at `0x3600000000000000000000000000000000000000` (6 decimals, same address on both networks)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, wagmi v2, ConnectKit

## Development

### Prerequisites

- [Bun](https://bun.sh) (package manager and runtime)
- [Foundry](https://getfoundry.sh) (forge, cast)

### Install

```bash
bun install
```

### Environment variables

None required for local development and testing. The USDC address is fixed in the contract source.

### Run the dev server

```bash
bun run dev
```

### Build contracts

```bash
bun run contracts:build
# or: forge build
```

### Test contracts

```bash
bun run contracts:test
# or: forge test --match-path "contracts/test/PaymentRouter.t.sol" -v
```

Expected output: **27 tests, 0 failed** (25 unit tests + 2 fuzz tests with 256 runs each).

### Run all checks (lint + typecheck)

```bash
bun run check
```

---

## Contract: PaymentRouter

| Property | Value |
|----------|-------|
| File | `contracts/PaymentRouter.sol` |
| Tests | `contracts/test/PaymentRouter.t.sol` |
| Accepted token | USDC (`0x3600000000000000000000000000000000000000`) |
| USDC decimals | 6 |
| Owner role | Pause / unpause only — cannot move funds |
| Custody | None — router never holds USDC |

### Deployment inputs

| Parameter | Description |
|-----------|-------------|
| `initialOwner` | Address that receives the owner role. Use a multi-sig for production. |

### Key functions

| Function | Who can call | What it does |
|----------|-------------|--------------|
| `pay(paymentId, token, merchant, amount)` | Anyone (payer) | Pulls USDC from caller, forwards to merchant |
| `refund(paymentId, amount)` | Recorded merchant only | Pulls USDC from merchant, returns to original payer |
| `pause()` / `unpause()` | Owner only | Stops / resumes `pay` and `refund` |
| `getPayment(paymentId)` | Anyone | Returns full payment record |
| `remainingRefundable(paymentId)` | Anyone | Returns refundable balance remaining |

---

## Security

- Full self-review completed; see `docs/PaymentRouter-security-review.md` for findings, threat model, and deployment checklist.
- 27/27 Foundry unit + fuzz tests pass.
- **NOT independently audited.** Do not deploy to mainnet without a third-party audit.
- Arc Studio does not support Arc mainnet deployment. Mainnet requires a self-deploy workflow from your own wallet.

## Files

```
contracts/
  PaymentRouter.sol              # Main contract
  test/
    PaymentRouter.t.sol          # Foundry unit + fuzz tests
docs/
  PaymentRouter-security-review.md  # Threat model, checklist, residual risks
```
