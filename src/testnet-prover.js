import { BackendType, Barretenberg, BN254_FR_MODULUS, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

export const TESTNET_CIRCUIT_ID = "expandzk:agent-risk-guard:testnet-1";
export const TESTNET_PROOF_SYSTEM = "ultrahonk-evm";

const PUBLIC_INPUT_NAMES = [
  "max_order_notional",
  "max_daily_loss",
  "max_exposure_bps",
  "agent_id",
  "policy_commitment",
  "intent_hash",
  "action_commitment"
];

export async function proveAgentRiskGuard(artifact, input, options = {}) {
  const normalized = normalizeRiskInput(input);
  const api = options.api ?? await Barretenberg.new({
    threads: options.threads ?? 1,
    skipSrsInit: options.skipSrsInit ?? true,
    ...(options.srsSize ? { srsSize: options.srsSize } : {}),
    ...(typeof window === "undefined" ? {} : { backend: options.backend ?? BackendType.Wasm }),
    ...(options.wasmPath ? { wasmPath: options.wasmPath } : {})
  });
  const ownsApi = options.api === undefined;

  try {
    const actionCommitment = await createActionCommitment(normalized, api);
    const noir = new Noir(artifact);
    const startedAt = performance.now();
    const { witness } = await noir.execute({ ...normalized, action_commitment: actionCommitment });
    const witnessTimeMs = Math.round(performance.now() - startedAt);
    const backend = new UltraHonkBackend(artifact.bytecode, api);
    const provingStartedAt = performance.now();
    const proofData = await backend.generateProof(witness, { verifierTarget: "evm" });
    const provingTimeMs = Math.round(performance.now() - provingStartedAt);
    const verificationStartedAt = performance.now();
    const verified = await backend.verifyProof(proofData, { verifierTarget: "evm" });
    const verificationTimeMs = Math.round(performance.now() - verificationStartedAt);

    return {
      circuitId: TESTNET_CIRCUIT_ID,
      proofSystem: TESTNET_PROOF_SYSTEM,
      verified,
      actionCommitment,
      proof: toHex(proofData.proof),
      proofBytes: proofData.proof.length,
      publicInputs: Object.fromEntries(PUBLIC_INPUT_NAMES.map((name, index) => [name, proofData.publicInputs[index]])),
      timings: {
        witnessTimeMs,
        provingTimeMs,
        verificationTimeMs,
        totalTimeMs: witnessTimeMs + provingTimeMs + verificationTimeMs
      }
    };
  } finally {
    if (ownsApi) {
      await api.destroy();
    }
  }
}

export async function createActionCommitment(input, api) {
  const fields = [
    input.agent_secret,
    input.agent_id,
    input.order_notional,
    input.daily_loss,
    input.post_trade_exposure_bps,
    input.policy_commitment,
    input.intent_hash
  ];
  const { hash } = await api.pedersenHash({
    inputs: fields.map((value) => fieldToBytes(value)),
    hashIndex: 0
  });
  return toHex(hash);
}

export function normalizeRiskInput(input = {}) {
  return {
    agent_secret: normalizeField(input.agent_secret, "agent_secret", { nonZero: true }),
    order_notional: normalizeUnsigned(input.order_notional, "order_notional", 64),
    daily_loss: normalizeUnsigned(input.daily_loss, "daily_loss", 64),
    post_trade_exposure_bps: normalizeUnsigned(input.post_trade_exposure_bps, "post_trade_exposure_bps", 32),
    max_order_notional: normalizeUnsigned(input.max_order_notional, "max_order_notional", 64),
    max_daily_loss: normalizeUnsigned(input.max_daily_loss, "max_daily_loss", 64),
    max_exposure_bps: normalizeUnsigned(input.max_exposure_bps, "max_exposure_bps", 32),
    agent_id: normalizeField(input.agent_id, "agent_id"),
    policy_commitment: normalizeField(input.policy_commitment, "policy_commitment"),
    intent_hash: normalizeField(input.intent_hash, "intent_hash")
  };
}

function normalizeField(value, label, options = {}) {
  const parsed = parseBigInt(value, label);
  if (options.nonZero && parsed === 0n) {
    throw new Error(`${label} must be non-zero.`);
  }
  if (parsed < 0n || parsed >= BN254_FR_MODULUS) {
    throw new Error(`${label} must be a valid BN254 field element.`);
  }
  return parsed.toString();
}

function normalizeUnsigned(value, label, width) {
  const parsed = parseBigInt(value, label);
  const maximum = 1n << BigInt(width);
  if (parsed < 0n || parsed >= maximum) {
    throw new Error(`${label} must fit in an unsigned ${width}-bit integer.`);
  }
  return parsed.toString();
}

function parseBigInt(value, label) {
  try {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
      throw new Error();
    }
    return BigInt(value);
  } catch {
    throw new Error(`${label} must be an integer or integer string.`);
  }
}

function fieldToBytes(value) {
  let field = BigInt(value);
  const bytes = new Uint8Array(32);
  for (let index = 31; index >= 0; index -= 1) {
    bytes[index] = Number(field & 255n);
    field >>= 8n;
  }
  return bytes;
}

function toHex(bytes) {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
