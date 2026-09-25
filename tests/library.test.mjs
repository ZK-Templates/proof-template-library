import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROOF_PASSPORT_VERSION,
  createPolicyRegistry,
  createProofPassport,
  getCategories,
  getTags,
  getTemplate,
  inspectProofPassport,
  listTemplates,
  recommendProofRails,
  scaffoldTemplate
} from "../src/index.js";

test("catalog exposes starter proof templates", () => {
  const templates = listTemplates();

  assert.equal(templates.length, 24);
  assert.deepEqual(
    templates.map((template) => template.id).sort(),
    [
      "age-gate",
      "ai-agent-action-receipt",
      "ai-agent-risk-guard",
      "anonymous-rate-limit",
      "anonymous-vote",
      "confidential-dataset-eligibility",
      "dividend-entitlement-proof",
      "email-domain",
      "geo-eligibility",
      "group-membership",
      "model-version-proof",
      "private-allowlist",
      "private-classification-threshold",
      "private-portfolio-exposure",
      "private-prompt-evaluation",
      "private-reputation",
      "private-rwa-trading-eligibility",
      "proof-of-reserves",
      "range-proof",
      "rwa-compliance-hook",
      "token-ownership",
      "tokenized-asset-backing",
      "verifiable-ai-inference",
      "web-data-attestation"
    ]
  );
});

test("templates can be filtered by system, category, and tag", () => {
  assert.equal(listTemplates({ system: "circom" }).length, 1);
  assert.equal(listTemplates({ category: "ai" }).length, 6);
  assert.equal(listTemplates({ category: "rwa" }).length, 6);
  assert.equal(listTemplates({ category: "identity" }).length, 4);
  assert.equal(listTemplates({ category: "data" }).length, 2);
  assert.equal(listTemplates({ maturity: "experimental" }).length, 8);
  assert.ok(listTemplates({ tag: "merkle" }).some((template) => template.id === "group-membership"));
  assert.ok(listTemplates({ tag: "ai" }).some((template) => template.id === "verifiable-ai-inference"));
  assert.ok(listTemplates({ tag: "rwa" }).some((template) => template.id === "private-rwa-trading-eligibility"));
  assert.ok(listTemplates({ tag: "uniswap-v4" }).some((template) => template.id === "rwa-compliance-hook"));
  assert.ok(listTemplates({ tag: "attestation" }).some((template) => template.id === "web-data-attestation"));
});

test("template lookup and facets work", () => {
  const template = getTemplate("age-gate");

  assert.equal(template.title, "Age Gate");
  assert.ok(getCategories().includes("identity"));
  assert.ok(getTags().includes("nullifier"));
  assert.throws(() => getTemplate("missing"), /Unknown proof template/);
});

test("catalog ids are unique and starter files exist", () => {
  const templates = listTemplates();
  const ids = templates.map((template) => template.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const template of templates) {
    for (const starter of template.starterFiles) {
      assert.ok(existsSync(starter.source), `${template.id} references missing starter: ${starter.source}`);
    }
  }
});

test("scaffold writes docs, metadata, example inputs, and starter circuit", () => {
  const outDir = mkdtempSync(join(tmpdir(), "proof-template-"));
  const result = scaffoldTemplate("age-gate", { outDir, system: "noir" });

  assert.equal(result.template.id, "age-gate");
  assert.ok(result.written.some((file) => file.endsWith("src/main.nr")));

  const readme = readFileSync(join(outDir, "README.md"), "utf8");
  const circuit = readFileSync(join(outDir, "src", "main.nr"), "utf8");
  const inputs = JSON.parse(readFileSync(join(outDir, "inputs.example.json"), "utf8"));

  assert.match(readme, /Age Gate/);
  assert.match(circuit, /fn main/);
  assert.deepEqual(Object.keys(inputs.publicInputs), ["current_year", "minimum_age", "identity_commitment"]);
});

test("tokenized markets templates scaffold RWA starters", () => {
  const outDir = mkdtempSync(join(tmpdir(), "rwa-template-"));
  const result = scaffoldTemplate("private-rwa-trading-eligibility", { outDir, system: "noir" });

  assert.equal(result.template.category, "rwa");
  assert.equal(result.template.maturity, "experimental");
  assert.ok(result.written.some((file) => file.endsWith("src/main.nr")));

  const readme = readFileSync(join(outDir, "README.md"), "utf8");
  const circuit = readFileSync(join(outDir, "src", "main.nr"), "utf8");
  const inputs = JSON.parse(readFileSync(join(outDir, "inputs.example.json"), "utf8"));

  assert.match(readme, /Private RWA Trading Eligibility/);
  assert.match(circuit, /wallet_binding/);
  assert.deepEqual(Object.keys(inputs.publicInputs), ["policy_commitment", "credential_root", "wallet_binding"]);
});

test("proof rails recommends templates from policy and intent manifests", () => {
  const policy = JSON.parse(readFileSync("integrations/proof-rails/agent-policy.example.json", "utf8"));
  const intent = JSON.parse(readFileSync("integrations/proof-rails/trade-intent.example.json", "utf8"));
  const plan = recommendProofRails(policy, intent);

  assert.equal(plan.policyId, "rwa-agent-policy-v1");
  assert.equal(plan.intentId, "intent:buy-tokenized-equity-demo");
  assert.deepEqual(plan.requiredTemplates, [
    "ai-agent-risk-guard",
    "private-rwa-trading-eligibility",
    "rwa-compliance-hook",
    "private-portfolio-exposure"
  ]);
  assert.ok(plan.checks.every((check) => ["pass", "ready"].includes(check.status)));
});

test("proof passport binds an agent action to policy and required rails", () => {
  const policy = JSON.parse(readFileSync("integrations/proof-rails/agent-policy.example.json", "utf8"));
  const intent = JSON.parse(readFileSync("integrations/proof-rails/trade-intent.example.json", "utf8"));
  const options = { issuedAt: "2030-01-01T00:00:00.000Z", ttlSeconds: 300 };
  const passport = createProofPassport(policy, intent, options);
  const repeated = createProofPassport(policy, intent, options);

  assert.equal(passport.version, PROOF_PASSPORT_VERSION);
  assert.equal(passport.status, "proofs-required");
  assert.equal(passport.passportId, repeated.passportId);
  assert.equal(passport.subject.agentId, "agent:market-maker-demo");
  assert.equal(passport.action.type, "trade");
  assert.deepEqual(passport.rails.map((rail) => rail.templateId), [
    "ai-agent-risk-guard",
    "private-rwa-trading-eligibility",
    "rwa-compliance-hook",
    "private-portfolio-exposure"
  ]);
  assert.ok(passport.rails.every((rail) => rail.status === "requested"));
  assert.equal(JSON.stringify(passport).includes("dailyLoss"), false);
  assert.equal(JSON.stringify(passport).includes("postTradeExposureBps"), false);
});

test("proof passport inspector checks registry binding and tamper resistance", () => {
  const policy = JSON.parse(readFileSync("integrations/proof-rails/agent-policy.example.json", "utf8"));
  const intent = JSON.parse(readFileSync("integrations/proof-rails/trade-intent.example.json", "utf8"));
  const passport = createProofPassport(policy, intent, {
    issuedAt: "2030-01-01T00:00:00.000Z",
    ttlSeconds: 300
  });
  const registry = createPolicyRegistry([policy], { network: "testnet" });
  const inspection = inspectProofPassport(passport, {
    registry,
    now: "2030-01-01T00:01:00.000Z"
  });

  assert.equal(inspection.structurallyValid, true);
  assert.equal(inspection.registryMatch, true);
  assert.equal(inspection.readyForRouter, false);
  assert.equal(inspection.attachedProofs, 0);

  const tampered = structuredClone(passport);
  tampered.action.intentHash = "0xtampered";
  const tamperedInspection = inspectProofPassport(tampered, {
    registry,
    now: "2030-01-01T00:01:00.000Z"
  });
  assert.equal(tamperedInspection.structurallyValid, false);
  assert.ok(tamperedInspection.errors.some((error) => error.includes("canonical payload")));
});

test("proof passport blocks policy-breaching intents", () => {
  const policy = JSON.parse(readFileSync("integrations/proof-rails/agent-policy.example.json", "utf8"));
  const intent = JSON.parse(readFileSync("integrations/proof-rails/trade-intent.example.json", "utf8"));
  intent.order.notional = policy.limits.maxOrderNotional + 1;

  const passport = createProofPassport(policy, intent, {
    issuedAt: "2030-01-01T00:00:00.000Z",
    ttlSeconds: 300
  });
  const inspection = inspectProofPassport(passport, {
    now: "2030-01-01T00:01:00.000Z"
  });

  assert.equal(passport.status, "policy-breach");
  assert.equal(inspection.readyForRouter, false);
  assert.ok(inspection.errors.some((error) => error.includes("policy breach")));
});
