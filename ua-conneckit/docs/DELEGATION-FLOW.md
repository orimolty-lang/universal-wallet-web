# EIP-7702 Delegation Flow (Fresh Account)

## When does delegation happen?

Delegation is required when your Universal Account needs to execute transactions on an EVM chain where the EOA has not yet delegated to the UA contract. Delegation happens **automatically** as part of the first transaction that touches that chain.

## Triggers for delegation

| Action | Delegation? | Notes |
|--------|-------------|-------|
| **Convert** (cross-chain) | Yes | Base→BNB convert delegates both Base and BNB in one tx |
| **Swap** (buy/sell) | Yes, if chain not delegated | Base USDC→WETH on Base: delegates Base. Buy token on BNB: delegates BNB (and Base if sourcing from there) |
| **Send** | Yes, if chain not delegated | Sending USDC on Arbitrum delegates Arbitrum |
| **Settings → Delegate** | Yes | Manual one-chain delegation (USDC transfer to self) |

## Fresh account flow

1. **Deposit** – Fund your UA (e.g. bridge USDC to Base).
2. **First action on a chain** – Convert, Swap, or Send that touches a new chain will:
   - Build a UA transaction with `userOps` for each chain
   - Each `userOp` may have `eip7702Auth` (delegation needed)
   - You sign the root hash + 7702 authorizations
   - UA executes: delegation + the actual operation in one shot

3. **No pre-delegation** – You do not need to delegate before converting or swapping. The first Convert/Swap/Send that uses a chain will delegate it automatically.

## Summary

- **Convert**: Cross-chain converts delegate all involved chains.
- **Swap**: LiFi buy/sell delegates the chain(s) used (source + destination).
- **Send**: Delegates the chain you send from.
- **Settings**: Manual delegation for a specific chain.

All of these use the same 7702 flow: sign root hash + sign 7702 authorizations → `sendTransaction` with both.
