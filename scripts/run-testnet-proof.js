import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { attachRiskProofToPassport, proveAgentRiskGuard } from "../src/testnet.js";

const root = process.cwd();
const artifact = await readJson(resolve(root, "artifacts/agent-risk-guard.json"));
const input = await readJson(resolve(root, "integrations/proof-network/testnet-input.json"));
const policy = await readJson(resolve(root, "integrations/proof-rails/agent-policy.example.json"));
const intent = await readJson(resolve(root, "integrations/proof-rails/trade-intent.example.json"));

const result = await proveAgentRiskGuard(artifact, input);
const passport = attachRiskProofToPassport(policy, intent, result, {
  issuedAt: "2026-01-01T00:00:00.000Z",
  ttlSeconds: 300
});
const outputPath = resolve(root, "artifacts/testnet-proof-passport.json");

await writeFile(outputPath, `${JSON.stringify({ result, passport }, null, 2)}\n`);
console.log(JSON.stringify({
  verified: result.verified,
  proofBytes: result.proofBytes,
  publicInputs: Object.keys(result.publicInputs).length,
  totalTimeMs: result.timings.totalTimeMs,
  passportId: passport.passportId,
  outputPath
}, null, 2));

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
