# Proof Rails Pack

The Proof Rails Pack turns the Tokenized Markets templates into a reference workflow for AI agents, tokenized stocks, and RWA market infrastructure.

Instead of asking builders to choose templates manually, the pack starts from an agent policy and a trade intent, then recommends the proof rails needed before execution.

## What It Adds

- agent policy manifest
- trade intent manifest
- CLI proof-rail recommendation command
- EVM verifier adapter example
- hook/router gate example
- site demo for matching a trade flow to templates

## Flow

1. A market, issuer, router, or agent controller publishes a policy manifest.
2. An AI agent proposes a trade intent.
3. ExpandZK recommends required proof templates.
4. The prover generates proofs for risk, eligibility, exposure, and execution policy.
5. A verifier contract, hook, router, or app checks the rails before execution.

## Run the Example

```sh
node src/cli.js rails \
  --policy integrations/proof-rails/agent-policy.example.json \
  --intent integrations/proof-rails/trade-intent.example.json
```

JSON output:

```sh
node src/cli.js rails \
  --policy integrations/proof-rails/agent-policy.example.json \
  --intent integrations/proof-rails/trade-intent.example.json \
  --json
```

## Recommended Rails

### AI agent risk guard

Template: `ai-agent-risk-guard`

Use when an agent must prove order notional, daily loss, venue, and policy bindings are inside configured limits.

### Trading eligibility

Template: `private-rwa-trading-eligibility`

Use when a wallet, account, or session must prove it is allowed to interact with a tokenized market without exposing the full credential.

### Execution hook

Template: `rwa-compliance-hook`

Use when an app, hook, router, or pool wants a proof check bound to a specific chain, venue, asset, recipient, and execution window.

### Portfolio exposure

Template: `private-portfolio-exposure`

Use when a trade should prove post-trade concentration stays inside a public limit without revealing full holdings.

## EVM Reference

The EVM examples live in `integrations/evm/`.

- `ProofRailsVerifier.sol` shows a rail dispatcher and nullifier registry.
- `ProofRailsHookExample.sol` shows where a hook or router would require all rail proofs before execution.

These are integration sketches, not audited contracts.

## Production Checklist

- Replace placeholder verifier logic with generated proof-system verifiers.
- Bind every proof to chain ID, verifier address, asset ID, policy version, recipient, and execution window.
- Reject reused nullifiers for any rail that should be one-time.
- Version policy manifests and publish root rotation procedures.
- Treat eligibility, tokenized securities, and issuer backing as legal and compliance surfaces outside the circuit too.
