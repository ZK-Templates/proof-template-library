# Proof Template Library

A starter library of reusable zero-knowledge proof templates. It gives a project team a shared catalog of proof patterns, their public/private inputs, security notes, and starter circuit files.

The catalog focuses on templates that show up often in privacy-preserving apps, including AI workflows and a new Tokenized Markets Pack for RWA, tokenized-stock, compliance-hook, and AI trading-agent use cases:

- Age Gate
- Group Membership
- Anonymous Vote
- Private Allowlist Claim
- Proof of Reserves
- Private Token Ownership
- Private Range Proof
- Anonymous Rate Limit
- Private Reputation Threshold
- Email Domain Credential
- Private Location Eligibility
- Private Web Data Attestation
- Verifiable AI Inference
- Private Prompt Evaluation
- AI Agent Action Receipt
- Model Version Proof
- Private Classification Threshold
- Confidential Dataset Eligibility
- Private RWA Trading Eligibility
- RWA Compliance Hook
- AI Agent Risk Guard
- Private Portfolio Exposure
- Dividend Entitlement Proof
- Tokenized Asset Backing

Templates include maturity labels such as `starter` and `experimental`. They are not audited production circuits. Treat them as implementation scaffolds and review checklists.

## Tokenized Markets Pack

The Tokenized Markets Pack gives builders a commercial set of ZK patterns for tokenized stocks, ETFs, RWAs, policy-gated swaps, and AI-assisted trading flows:

- prove trading eligibility without exposing KYC records or jurisdiction documents
- gate tokenized-asset execution through hook or router proof checks
- prove AI trading agents stayed inside private risk limits
- prove portfolio concentration remains below a public threshold
- prove dividend or distribution entitlement from a private snapshot
- prove issued token supply is covered by private backing records or attestations

See [docs/tokenized-markets-pack.md](docs/tokenized-markets-pack.md) for integration notes.

## Quick Start

List every template:

```sh
npm run list
```

Show one template:

```sh
node src/cli.js show group-membership
```

Scaffold a starter circuit:

```sh
node src/cli.js scaffold anonymous-vote --system noir --out ./examples/anonymous-vote
```

Run tests:

```sh
npm test
```

Build the static catalog site used by GitHub Pages:

```sh
npm run build:site
```

## CLI

```sh
proof-templates list [--tag tag] [--category category] [--system noir|circom] [--maturity starter|experimental|reviewed|production-pattern|audited]
proof-templates show <id> [--json]
proof-templates scaffold <id> [--system noir|circom] [--out path] [--force]
proof-templates tags
proof-templates categories
```

During local development, use `node src/cli.js ...` instead of the installed `proof-templates` binary.

## JavaScript API

```js
import { getTemplate, listTemplates, scaffoldTemplate } from "./src/index.js";

const identityTemplates = listTemplates({ category: "identity" });
const ageGate = getTemplate("age-gate");

scaffoldTemplate("age-gate", {
  system: "noir",
  outDir: "./examples/age-gate"
});
```

## Template Shape

Each template in `templates/catalog.json` includes:

- `id`, `title`, `summary`, and `category`
- supported `systems`, currently `noir` and `circom`
- `maturity`, currently used to distinguish starter patterns from experimental AI/ZK and RWA patterns
- public and private input descriptions
- the proof statement in plain language
- core constraints the circuit must enforce
- security notes for implementers and reviewers
- starter files that the CLI can scaffold

The schema lives at `schemas/template.schema.json`.

## Deployment

The GitHub Pages workflow in `.github/workflows/pages.yml` builds `site/` from `site-src/` and deploys it on every push to `main`.

## Adding a Template

1. Add a catalog entry to `templates/catalog.json`.
2. Add one or more starter files under `templates/scaffolds/`.
3. Reference each starter file from the catalog entry with `system`, `source`, and `output`.
4. Add or update tests when the template introduces new behavior.

## Production Checklist

Before using a scaffold in production:

- Replace placeholder hash and commitment functions with audited circuit-friendly primitives.
- Add witness tests, negative tests, and property/fuzz tests.
- Bind proofs to a verifier domain, chain ID, contract address, session, or challenge where replay matters.
- Document public input semantics and version every circuit.
- Get independent security review for circuits, verifier contracts, and off-chain builders.
