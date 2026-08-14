import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { getCategories, getTags, getTemplate, listTemplates, recommendProofRails, scaffoldTemplate } from "../src/index.js";

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
