import { createProofPassport } from "./proof-passport.js";

export {
  TESTNET_CIRCUIT_ID,
  TESTNET_PROOF_SYSTEM,
  createActionCommitment,
  normalizeRiskInput,
  proveAgentRiskGuard
} from "./testnet-prover.js";

export function attachRiskProofToPassport(policy, intent, proofResult, options = {}) {
  if (!proofResult?.verified) {
    throw new Error("Only a verified proof can be attached to a Proof Passport.");
  }

  return createProofPassport(policy, intent, {
    ...options,
    proofs: [
      ...(options.proofs ?? []).filter((proof) => proof.templateId !== "ai-agent-risk-guard"),
      {
        templateId: "ai-agent-risk-guard",
        verifierId: proofResult.circuitId,
        proofSystem: proofResult.proofSystem,
        proof: proofResult.proof,
        publicInputs: proofResult.publicInputs
      }
    ]
  });
}
