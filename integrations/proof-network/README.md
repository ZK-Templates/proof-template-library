# ExpandZK Proof Network

This directory contains the offchain side of the Proof Network reference flow. A Proof Passport is a portable envelope that binds an agent, action intent, policy commitment, validity window, and required proof rails.

The Proof Network Testnet now includes a real Agent Risk Guard proof attachment. Run it with:

```sh
npm run proof:testnet
```

The command compiles the circuit, generates and verifies an EVM-targeted UltraHonk proof, and writes a local Proof Passport result under `artifacts/`. The generated output is ignored because proof bytes are nondeterministic; the circuit artifact and testnet input are versioned.

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

The generated passport initially marks every rail as `requested`. A proving integration replaces those entries with actual proof bytes, public inputs, verifier ids, and optional nullifiers. The `proof-attachments.example.json` file shows the attachment shape but intentionally contains non-verifiable placeholders. The testnet runner demonstrates the same shape with an actual verified Agent Risk Guard proof.

The JavaScript inspector checks envelope integrity, validity windows, policy-registry binding, and required rail coverage. Cryptographic verification is performed by the testnet prover SDK or by a proof-system verifier connected to the reference `ProofPassportRouter.sol` adapter.
