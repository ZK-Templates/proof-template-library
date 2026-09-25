import { createHash } from "node:crypto";
import { recommendProofRails } from "./proof-rails.js";

export const PROOF_PASSPORT_VERSION = "expandzk-proof-passport/1.0";
export const POLICY_REGISTRY_VERSION = "expandzk-policy-registry/1.0";

export function createProofPassport(policy = {}, intent = {}, options = {}) {
  requireIdentifier(policy.id, "Policy");
  requireIdentifier(intent.id, "Intent");

  const issuedAt = normalizeDate(options.issuedAt ?? new Date(), "issuedAt");
  const ttlSeconds = positiveInteger(options.ttlSeconds ?? 300, "ttlSeconds");
  const expiresAt = new Date(Date.parse(issuedAt) + ttlSeconds * 1000).toISOString();
  const plan = recommendProofRails(policy, intent);
  const proofs = indexProofs(options.proofs ?? []);
  const rails = plan.requiredTemplates.map((templateId) => {
    const evidence = proofs.get(templateId) ?? {};
    const proof = nonEmptyString(evidence.proof) ? evidence.proof : null;
    const publicInputs = evidence.publicInputs ?? {};

    return {
      id: `rail:${templateId}`,
      templateId,
      verifierId: evidence.verifierId ?? `expandzk:${templateId}:v1`,
      checks: plan.checks.filter((check) => check.template === templateId).map((check) => check.id),
      status: proof ? "attached" : "requested",
      proofSystem: evidence.proofSystem ?? null,
      publicInputs,
      publicInputsHash: hashCanonical(publicInputs),
      proof,
      nullifier: evidence.nullifier ?? null
    };
  });
  const hasPolicyBreach = plan.checks.some((check) => check.status === "breach");
  const allProofsAttached = rails.length > 0 && rails.every((rail) => rail.status === "attached");

  const payload = {
    version: PROOF_PASSPORT_VERSION,
    status: hasPolicyBreach
      ? "policy-breach"
      : allProofsAttached
        ? "ready-for-verification"
        : "proofs-required",
    issuedAt,
    expiresAt,
    subject: {
      agentId: intent.agent?.id ?? policy.agent?.id ?? "unassigned-agent",
      controller: intent.agent?.controller ?? policy.agent?.controller ?? null
    },
    action: {
      intentId: intent.id,
      type: inferActionType(intent),
      chainId: intent.execution?.chainId ?? null,
      target: intent.execution?.target ?? intent.execution?.venue ?? null,
      intentHash: intent.execution?.swapIntentHash ?? hashCanonical(intent)
    },
    policy: {
      id: policy.id,
      commitment: options.policyCommitment ?? hashCanonical(policy)
    },
    rails
  };

  return {
    version: payload.version,
    passportId: hashCanonical(payload),
    ...Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "version"))
  };
}

export function createPolicyRegistry(policies = [], options = {}) {
  if (!Array.isArray(policies) || policies.length === 0) {
    throw new Error("Policy registry requires at least one policy.");
  }

  const entries = policies.map((policy) => {
    requireIdentifier(policy.id, "Policy");
    return {
      id: policy.id,
      version: policy.version ?? "1.0.0",
      name: policy.name ?? policy.id,
      commitment: hashCanonical(policy),
      active: policy.active !== false,
      requiredTemplates: [...new Set(policy.proofRequirements ?? [])]
    };
  });

  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
    throw new Error("Policy registry contains duplicate policy ids.");
  }

  return {
    version: POLICY_REGISTRY_VERSION,
    network: options.network ?? "expandzk-local",
    policies: entries
  };
}

export function inspectProofPassport(passport = {}, options = {}) {
  const errors = [];
  const warnings = [];
  const now = Date.parse(normalizeDate(options.now ?? new Date(), "now"));

  if (passport.version !== PROOF_PASSPORT_VERSION) {
    errors.push(`Unsupported passport version: ${passport.version ?? "missing"}.`);
  }
  requirePassportField(passport.passportId, "passportId", errors);
  requirePassportField(passport.policy?.id, "policy.id", errors);
  requirePassportField(passport.policy?.commitment, "policy.commitment", errors);
  requirePassportField(passport.action?.intentId, "action.intentId", errors);
  requirePassportField(passport.action?.intentHash, "action.intentHash", errors);

  const issuedAt = Date.parse(passport.issuedAt);
  const expiresAt = Date.parse(passport.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) {
    errors.push("Passport validity dates must be ISO-8601 timestamps.");
  } else {
    if (issuedAt > expiresAt) {
      errors.push("Passport expires before it is issued.");
    }
    if (now < issuedAt) {
      errors.push("Passport is not active yet.");
    }
    if (now > expiresAt) {
      errors.push("Passport has expired.");
    }
  }

  const rails = Array.isArray(passport.rails) ? passport.rails : [];
  if (rails.length === 0) {
    errors.push("Passport must contain at least one proof rail.");
  }
  const templateIds = rails.map((rail) => rail.templateId);
  if (new Set(templateIds).size !== templateIds.length) {
    errors.push("Passport contains duplicate proof rails.");
  }

  for (const rail of rails) {
    requirePassportField(rail.templateId, "rails[].templateId", errors);
    requirePassportField(rail.verifierId, "rails[].verifierId", errors);
    if (!['requested', 'attached'].includes(rail.status)) {
      errors.push(`Unsupported rail status for ${rail.templateId ?? "unknown"}.`);
    }
    if (rail.status === "attached" && !nonEmptyString(rail.proof)) {
      errors.push(`Attached rail ${rail.templateId ?? "unknown"} is missing proof bytes.`);
    }
  }

  if (passport.status === "policy-breach") {
    errors.push("Passport records a policy breach and must not be routed for execution.");
  }

  const expectedPassportId = hashPassportPayload(passport);
  if (nonEmptyString(passport.passportId) && passport.passportId !== expectedPassportId) {
    errors.push("Passport id does not match its canonical payload.");
  }

  const registryResult = inspectRegistryBinding(passport, options.registry, templateIds);
  errors.push(...registryResult.errors);
  warnings.push(...registryResult.warnings);

  const attachedProofs = rails.filter((rail) => rail.status === "attached").length;
  if (attachedProofs < rails.length) {
    warnings.push(`${rails.length - attachedProofs} proof rail${rails.length - attachedProofs === 1 ? " is" : "s are"} still requested.`);
  }

  return {
    structurallyValid: errors.length === 0,
    registryMatch: registryResult.match,
    readyForRouter: errors.length === 0 && registryResult.match !== false && attachedProofs === rails.length,
    cryptographicStatus: "not-run",
    attachedProofs,
    totalProofs: rails.length,
    errors,
    warnings
  };
}

export function hashCanonical(value) {
  return `0x${createHash("sha256").update(canonicalStringify(value)).digest("hex")}`;
}

function hashPassportPayload(passport) {
  const { passportId: _passportId, ...payload } = passport;
  return hashCanonical(payload);
}

function inspectRegistryBinding(passport, registry, templateIds) {
  if (!registry) {
    return {
      match: null,
      errors: [],
      warnings: ["No policy registry was supplied; registry binding was not checked."]
    };
  }

  const policies = Array.isArray(registry) ? registry : registry.policies;
  if (!Array.isArray(policies)) {
    return { match: false, errors: ["Policy registry has no policies array."], warnings: [] };
  }

  const entry = policies.find((candidate) => candidate.id === passport.policy?.id);
  if (!entry) {
    return { match: false, errors: [`Policy ${passport.policy?.id ?? "unknown"} is not registered.`], warnings: [] };
  }

  const errors = [];
  if (entry.active === false) {
    errors.push(`Policy ${entry.id} is inactive.`);
  }
  if (entry.commitment !== passport.policy?.commitment) {
    errors.push(`Policy commitment does not match registry entry ${entry.id}.`);
  }
  const missingTemplates = (entry.requiredTemplates ?? []).filter((id) => !templateIds.includes(id));
  if (missingTemplates.length > 0) {
    errors.push(`Passport is missing required templates: ${missingTemplates.join(", ")}.`);
  }

  return { match: errors.length === 0, errors, warnings: [] };
}

function indexProofs(proofs) {
  const entries = Array.isArray(proofs)
    ? proofs
    : Object.entries(proofs).map(([templateId, proof]) => ({ templateId, ...proof }));
  return new Map(entries.map((proof) => [proof.templateId, proof]));
}

function inferActionType(intent) {
  if (intent.distribution?.claim) {
    return "distribution-claim";
  }
  if (intent.issuer?.reportBacking) {
    return "issuer-report";
  }
  return intent.order ? "trade" : "agent-action";
}

function canonicalStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeDate(value, label) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`${label} must be a valid date.`);
  }
  return date.toISOString();
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

function requireIdentifier(value, label) {
  if (!nonEmptyString(value)) {
    throw new Error(`${label} id is required.`);
  }
}

function requirePassportField(value, label, errors) {
  if (!nonEmptyString(value)) {
    errors.push(`Passport field ${label} is required.`);
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
