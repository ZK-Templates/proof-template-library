export const PROOF_RAILS_TEMPLATE_MAP = {
  agentRisk: "ai-agent-risk-guard",
  tradingEligibility: "private-rwa-trading-eligibility",
  executionHook: "rwa-compliance-hook",
  portfolioExposure: "private-portfolio-exposure",
  dividendEntitlement: "dividend-entitlement-proof",
  issuerBacking: "tokenized-asset-backing"
};

export function recommendProofRails(policy = {}, intent = {}) {
  const checks = [];
  const templates = new Set();

  const agentEnabled = Boolean(policy.agent?.id || intent.agent?.id || intent.agent?.enabled);
  const rwaAsset = isRwaAsset(intent.asset) || hasPolicyScope(policy, "rwa");
  const hookExecution = policy.execution?.mode === "hook" || intent.execution?.mode === "hook";
  const eligibilityRequired = policy.eligibility?.required !== false && rwaAsset;
  const portfolioLimit = numeric(policy.limits?.maxPortfolioExposureBps);
  const postTradeExposure = numeric(intent.portfolio?.postTradeExposureBps);
  const orderNotional = numeric(intent.order?.notional);
  const maxOrderNotional = numeric(policy.limits?.maxOrderNotional);
  const dailyLoss = numeric(intent.agent?.dailyLoss);
  const maxDailyLoss = numeric(policy.limits?.maxDailyLoss);

  if (agentEnabled) {
    templates.add(PROOF_RAILS_TEMPLATE_MAP.agentRisk);
    checks.push(limitCheck({
      id: "max-order-notional",
      label: "Order notional limit",
      template: PROOF_RAILS_TEMPLATE_MAP.agentRisk,
      actual: orderNotional,
      limit: maxOrderNotional,
      unit: policy.units?.notional ?? "quote-units"
    }));
    checks.push(limitCheck({
      id: "max-daily-loss",
      label: "Agent daily loss limit",
      template: PROOF_RAILS_TEMPLATE_MAP.agentRisk,
      actual: dailyLoss,
      limit: maxDailyLoss,
      unit: policy.units?.notional ?? "quote-units"
    }));
  }

  if (eligibilityRequired) {
    templates.add(PROOF_RAILS_TEMPLATE_MAP.tradingEligibility);
    checks.push({
      id: "trading-eligibility",
      label: "Trading eligibility credential",
      template: PROOF_RAILS_TEMPLATE_MAP.tradingEligibility,
      status: intent.eligibility?.credentialCommitment ? "ready" : "needs-witness",
      detail: "Proves the wallet or session satisfies the market eligibility policy."
    });
  }

  if (hookExecution) {
    templates.add(PROOF_RAILS_TEMPLATE_MAP.executionHook);
    checks.push({
      id: "execution-hook",
      label: "Hook or router proof gate",
      template: PROOF_RAILS_TEMPLATE_MAP.executionHook,
      status: intent.execution?.swapIntentHash ? "ready" : "needs-intent",
      detail: "Binds the proof to chain, venue, asset, recipient, and execution window."
    });
  }

  if (portfolioLimit !== undefined || postTradeExposure !== undefined) {
    templates.add(PROOF_RAILS_TEMPLATE_MAP.portfolioExposure);
    checks.push(limitCheck({
      id: "portfolio-exposure",
      label: "Post-trade portfolio exposure",
      template: PROOF_RAILS_TEMPLATE_MAP.portfolioExposure,
      actual: postTradeExposure,
      limit: portfolioLimit,
      unit: "bps"
    }));
  }

  if (intent.distribution?.claim === true) {
    templates.add(PROOF_RAILS_TEMPLATE_MAP.dividendEntitlement);
    checks.push({
      id: "distribution-claim",
      label: "Distribution entitlement",
      template: PROOF_RAILS_TEMPLATE_MAP.dividendEntitlement,
      status: intent.distribution?.snapshotRoot ? "ready" : "needs-snapshot",
      detail: "Proves a private snapshot balance is eligible and emits a claim nullifier."
    });
  }

  if (policy.issuer?.requiresBackingProof || intent.issuer?.reportBacking) {
    templates.add(PROOF_RAILS_TEMPLATE_MAP.issuerBacking);
    checks.push({
      id: "issuer-backing",
      label: "Issuer backing proof",
      template: PROOF_RAILS_TEMPLATE_MAP.issuerBacking,
      status: intent.issuer?.backingCommitment ? "ready" : "needs-attestation",
      detail: "Proves effective backing covers public tokenized supply."
    });
  }

  return {
    policyId: policy.id ?? "inline-policy",
    intentId: intent.id ?? "inline-intent",
    requiredTemplates: [...templates],
    checks,
    summary: `${templates.size} proof template${templates.size === 1 ? "" : "s"} recommended for this flow.`
  };
}

function isRwaAsset(asset = {}) {
  const type = String(asset.type ?? "").toLowerCase();
  const tags = (asset.tags ?? []).map((tag) => String(tag).toLowerCase());
  return type === "rwa" || type === "tokenized-stock" || tags.includes("rwa") || tags.includes("tokenized-stock");
}

function hasPolicyScope(policy, scope) {
  return (policy.scope ?? []).map((value) => String(value).toLowerCase()).includes(scope);
}

function numeric(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function limitCheck({ id, label, template, actual, limit, unit }) {
  if (actual === undefined || limit === undefined) {
    return {
      id,
      label,
      template,
      status: "needs-witness",
      detail: "Provide both the private measurement and policy limit to prove this rail."
    };
  }

  return {
    id,
    label,
    template,
    status: actual <= limit ? "pass" : "breach",
    actual,
    limit,
    unit,
    detail: `${actual} ${unit} ${actual <= limit ? "is within" : "exceeds"} the ${limit} ${unit} limit.`
  };
}
