import { readFileSync } from "node:fs";
import { createProofPassport, inspectProofPassport } from "../../src/index.js";

const policy = JSON.parse(readFileSync("integrations/proof-rails/agent-policy.example.json", "utf8"));
const intent = JSON.parse(readFileSync("integrations/proof-rails/trade-intent.example.json", "utf8"));

const passport = createProofPassport(policy, intent, { ttlSeconds: 300 });
const inspection = inspectProofPassport(passport);

console.log(JSON.stringify({ passport, inspection }, null, 2));
