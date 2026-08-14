# Proof Rails Integration Pack

This folder contains runnable inputs and reference integration shapes for AI agents trading tokenized markets.

## Files

- `agent-policy.example.json`: policy manifest for an agent, venue, and RWA market.
- `trade-intent.example.json`: example proposed trade intent.
- `../evm/ProofRailsVerifier.sol`: verifier adapter interface for proof rails.
- `../evm/ProofRailsHookExample.sol`: Uniswap v4-style hook/router gate example.

## Try It

```sh
node src/cli.js rails \
  --policy integrations/proof-rails/agent-policy.example.json \
  --intent integrations/proof-rails/trade-intent.example.json
```

Expected templates:

- `ai-agent-risk-guard`
- `private-rwa-trading-eligibility`
- `rwa-compliance-hook`
- `private-portfolio-exposure`

## Integration Notes

The manifest is intentionally simple: it describes limits and proof requirements without deciding how credentials, roots, attestations, or proofs are issued. Production systems should pin policy versions, chain IDs, verifier addresses, asset identifiers, and execution windows.
