# ExpandZK Proof Network

This directory contains the offchain side of the V3 Proof Network reference flow. A Proof Passport is a portable envelope that binds an agent, action intent, policy commitment, validity window, and required proof rails.

Create a passport from the example policy and trade intent:

```sh
node src/cli.js passport create \
  --policy integrations/proof-rails/agent-policy.example.json \
  --intent integrations/proof-rails/trade-intent.example.json \
  --out integrations/proof-network/proof-passport.local.json
```

Create a local policy registry:

```sh
node src/cli.js registry \
  --policy integrations/proof-rails/agent-policy.example.json \
  --network ethereum-mainnet \
  --out integrations/proof-network/policy-registry.local.json
```

Inspect the passport and registry binding:

```sh
node src/cli.js passport inspect \
  --passport integrations/proof-network/proof-passport.local.json \
  --registry integrations/proof-network/policy-registry.local.json
```

The generated passport initially marks every rail as `requested`. A proving integration replaces those entries with actual proof bytes, public inputs, verifier ids, and optional nullifiers. The `proof-attachments.example.json` file shows the attachment shape but intentionally contains non-verifiable placeholders.

The JavaScript inspector checks envelope integrity, validity windows, policy-registry binding, and required rail coverage. It does not perform cryptographic verification. That job belongs to a proof-system verifier or the reference `ProofPassportRouter.sol` adapter.
