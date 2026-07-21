# Tokenized Markets Pack

ExpandZK's Tokenized Markets Pack is a set of reusable ZK proof templates for builders working on tokenized stocks, ETFs, real-world assets, AI trading agents, and policy-gated DeFi execution.

The pack is chain-agnostic. It is designed for ecosystems where tokenized assets trade through wallets, routers, AMMs, hooks, lending markets, agent frameworks, or issuer portals. It can support Uniswap v4-style hooks and intent-based routes, but it is not affiliated with Robinhood, Uniswap, or any issuer.

## Commercial Use Cases

### Private trading eligibility

A wallet proves it is allowed to trade a tokenized asset under a policy without revealing the user's identity documents, jurisdiction credential, or full KYC record.

Template: `private-rwa-trading-eligibility`

### Policy-gated swaps and liquidity

A pool hook, router, or app checks a proof before allowing a tokenized-stock swap, liquidity action, or collateral movement.

Template: `rwa-compliance-hook`

### AI trading agent guardrails

An agent proves an order stays inside configured limits for notional size, loss budget, allowed policy, and action commitment before execution.

Template: `ai-agent-risk-guard`

### Private portfolio exposure

A user proves a proposed trade keeps concentration below a public limit without revealing the full portfolio.

Template: `private-portfolio-exposure`

### Dividend or distribution claims

A holder proves they were included in a private balance snapshot and claims once with a nullifier.

Template: `dividend-entitlement-proof`

### Issuer backing and reserve attestations

An issuer proves tokenized supply is covered by private custodied inventory or attested backing records.

Template: `tokenized-asset-backing`

## Integration Shape

1. The issuer, app, or market publishes a versioned policy commitment.
2. A credential issuer creates private user, agent, portfolio, or backing attestations.
3. The prover creates a proof bound to the chain, verifier, asset, session, and action.
4. The app, hook, router, issuer portal, or verifier contract checks the proof and any public nullifier.
5. The system rejects reused nullifiers, stale policies, and proofs bound to the wrong market.

## Production Notes

- Replace starter hash and commitment placeholders with audited circuit-friendly primitives.
- Bind every proof to chain ID, verifier address, asset identifier, policy version, and execution window where replay matters.
- Use authenticated price feeds for portfolio and risk templates.
- Treat securities eligibility, transfer restrictions, distribution rules, and issuer attestations as legal and compliance surfaces outside the circuit too.
- Publish clear policy versioning, revocation, root rotation, and incident response processes.
