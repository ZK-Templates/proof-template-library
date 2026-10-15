import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TESTNET_CIRCUIT_ID,
  attachRiskProofToPassport,
  normalizeRiskInput,
  proveAgentRiskGuard
} from "../src/testnet.js";

const artifact = JSON.parse(readFileSync("artifacts/agent-risk-guard.json", "utf8"));
const input = JSON.parse(readFileSync("integrations/proof-network/testnet-input.json", "utf8"));
const policy = JSON.parse(readFileSync("integrations/proof-rails/agent-policy.example.json", "utf8"));
const intent = JSON.parse(readFileSync("integrations/proof-rails/trade-intent.example.json", "utf8"));

test("testnet risk guard generates and verifies an EVM-targeted proof", { timeout: 30000 }, async () => {
  const result = await proveAgentRiskGuard(artifact, input);

  assert.equal(result.verified, true);
  assert.equal(result.circuitId, TESTNET_CIRCUIT_ID);
  assert.equal(result.proofSystem, "ultrahonk-evm");
  assert.ok(result.proof.startsWith("0x"));
  assert.ok(result.proofBytes > 8000);
  assert.equal(Object.keys(result.publicInputs).length, 7);
  assert.equal(result.publicInputs.action_commitment, result.actionCommitment);

  const passport = attachRiskProofToPassport(policy, intent, result, {
    issuedAt: "2026-01-01T00:00:00.000Z"
  });
  const rail = passport.rails.find((candidate) => candidate.templateId === "ai-agent-risk-guard");
  assert.equal(rail.status, "attached");
  assert.equal(rail.verifierId, TESTNET_CIRCUIT_ID);
});

test("testnet risk guard rejects an order above its public policy limit", { timeout: 30000 }, async () => {
  await assert.rejects(
    proveAgentRiskGuard(artifact, { ...input, order_notional: "2500001" }),
    /Assertion failed|Failed constraint|Cannot satisfy constraint/
  );
});

test("testnet input normalization rejects invalid secrets and integer ranges", () => {
  assert.throws(() => normalizeRiskInput({ ...input, agent_secret: "0" }), /non-zero/);
  assert.throws(() => normalizeRiskInput({ ...input, post_trade_exposure_bps: "4294967296" }), /32-bit/);
});
