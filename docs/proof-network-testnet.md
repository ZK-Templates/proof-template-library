# ExpandZK Proof Network Testnet

The Proof Network Testnet turns the Agent Risk Guard template into a complete proving path. It compiles a Noir circuit, builds a private witness, generates an EVM-targeted UltraHonk proof, verifies that proof locally, and attaches the verified result to a Proof Passport.

This release is a developer testnet and reference implementation. It is not an audited circuit, a hosted proving network, or a production verifier deployment.

## What ships

- an executable Noir circuit at `circuits/agent-risk-guard/`
- a reusable JavaScript prover at `src/testnet-prover.js`
- Proof Passport attachment support at `src/testnet.js`
- a browser prover at `site/testnet.html`
- a generated UltraHonk Solidity verifier at `integrations/evm/generated/AgentRiskGuardUltraHonkVerifier.sol`
- positive and negative proof tests

## Proof statement

The prover knows an agent secret, order notional, daily loss, and post-trade exposure such that:

- the agent secret is non-zero
- order notional is at or below the public maximum
- daily loss is at or below the public maximum
- post-trade exposure is at or below the public maximum
- the public maximum exposure is at most 10,000 basis points
- the public action commitment is the Pedersen hash of the private witness and action context

The circuit exposes the policy limits, agent id, policy commitment, intent hash, and action commitment as public inputs. It does not expose the agent secret or the three private measurements.

## Run locally

Install dependencies and compile the circuit:

```sh
npm install
npm run build:circuit
```

Generate a proof, verify it, and create a Proof Passport attachment:

```sh
npm run proof:testnet
```

Generate the Solidity verifier for the compiled artifact:

```sh
npm run build:verifier
```

Run the complete test suite:

```sh
npm test
```

## Browser flow

The GitHub Pages build exposes a dedicated Testnet page. The first run loads Noir, Barretenberg, the circuit artifact, WASM modules, and the structured reference string required by UltraHonk. Proving and verification happen in the browser tab; private witness values are not submitted to an ExpandZK service.

The included scenarios demonstrate both expected paths:

- `Within policy` generates and verifies a proof.
- `Over order limit` and `Over loss limit` fail circuit execution and produce no proof.

## EVM boundary

The generated verifier targets Solidity and the EVM, but this repository does not claim that the contract is deployed. Teams can connect the generated verifier to `ProofPassportRouter.sol`, then deploy and audit that integration for their chosen chain.

Regenerate the verifier whenever the circuit or proving stack changes. A verifier generated for one circuit artifact must not be used for a different artifact.

## Security boundary

- The circuit and Solidity verifier are unaudited.
- The demo agent secret is public test data and must never be reused as a real secret.
- Policy and intent field encodings need application-level domain separation before production use.
- A production action commitment should bind chain id, verifier address, execution target, nonce, and expiry according to the integrating protocol's replay model.
- Browser-local proving protects the witness from an ExpandZK backend, but it does not protect against a compromised browser, extension, device, or embedding application.
