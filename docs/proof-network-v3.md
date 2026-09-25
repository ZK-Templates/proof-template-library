# ExpandZK V3: Proof Network

ExpandZK V3 promotes the template library and Proof Rails Pack into a protocol foundation for autonomous agents. An agent can carry a standardized Proof Passport with an action so an application or smart contract can verify policy compliance before execution.

## Protocol Objects

### Proof Passport

A Proof Passport contains only routing and verification material:

- a canonical passport id and short validity window
- the agent identifier and optional controller
- the action intent id, intent hash, chain, and target
- the policy id and canonical policy commitment
- one entry for each required proof rail
- verifier ids, public inputs, proof bytes, and nullifiers when proofs are attached

Private witnesses, strategy parameters, credentials, portfolio contents, and model inputs do not belong in the passport.

### Policy Registry

The registry maps a versioned policy id to its commitment, activation status, and required templates. The JSON registry supports local tooling. `ExpandZKPolicyRegistry.sol` provides the matching onchain reference pattern.

### Verifier Router

`ProofPassportRouter.sol` resolves each rail verifier, checks the active policy commitment and passport validity window, enforces replay protection, binds every proof to the passport, policy, and intent, and calls the registered proof-system verifier.

## Agent Trading Flow

1. An agent proposes a trade intent.
2. Proof Rails selects the required templates from the active policy.
3. The SDK creates a Proof Passport with a five-minute validity window.
4. Provers attach proofs for risk, eligibility, exposure, and execution constraints.
5. The router checks the policy registry and dispatches each rail to its verifier.
6. The application, hook, or execution contract continues only after the passport is accepted.

## CLI

```sh
node src/cli.js passport create \
  --policy integrations/proof-rails/agent-policy.example.json \
  --intent integrations/proof-rails/trade-intent.example.json \
  --out /tmp/proof-passport.json

node src/cli.js registry \
  --policy integrations/proof-rails/agent-policy.example.json \
  --network ethereum-mainnet \
  --out /tmp/policy-registry.json

node src/cli.js passport inspect \
  --passport /tmp/proof-passport.json \
  --registry /tmp/policy-registry.json
```

## Security Boundary

This release defines a protocol envelope and reference adapters. It is not a hosted proving network and the Solidity contracts are not audited. Production deployments must use audited generated verifiers, define exact public-input encodings, protect registry administration, review nullifier domains, and test proof replay across chains, contracts, policies, and versions.
