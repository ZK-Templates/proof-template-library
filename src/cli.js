#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { getCategories, getTags, getTemplate, listTemplates, recommendProofRails, scaffoldTemplate } from "./index.js";

const args = process.argv.slice(2);
const command = args[0] ?? "help";

try {
  if (command === "list") {
    const options = parseOptions(args.slice(1));
    const templates = listTemplates({
      tag: options.tag,
      category: options.category,
      system: options.system,
      maturity: options.maturity
    });
    const idWidth = Math.max("template".length, ...templates.map((template) => template.id.length)) + 2;
    const categoryWidth = Math.max("category".length, ...templates.map((template) => template.category.length)) + 2;
    const systemsWidth = Math.max("systems".length, ...templates.map((template) => template.systems.join(",").length)) + 2;

    for (const template of templates) {
      console.log(`${template.id.padEnd(idWidth)}${template.category.padEnd(categoryWidth)}${template.systems.join(",").padEnd(systemsWidth)}${template.summary}`);
    }
    process.exit(0);
  }

  if (command === "show") {
    const id = args[1];
    if (!id) {
      throw new Error("Usage: proof-templates show <id> [--json]");
    }
    const options = parseOptions(args.slice(2));
    const template = getTemplate(id);

    if (options.json) {
      console.log(JSON.stringify(template, null, 2));
    } else {
      printTemplate(template);
    }
    process.exit(0);
  }

  if (command === "scaffold") {
    const id = args[1];
    if (!id) {
      throw new Error("Usage: proof-templates scaffold <id> [--system noir|circom] [--out path] [--force]");
    }
    const options = parseOptions(args.slice(2));
    const result = scaffoldTemplate(id, {
      system: options.system,
      outDir: options.out,
      force: Boolean(options.force)
    });

    console.log(`Scaffolded ${result.template.id} (${result.system}) in ${result.outDir}`);
    for (const file of result.written) {
      console.log(`- ${file}`);
    }
    process.exit(0);
  }

  if (command === "rails") {
    const options = parseOptions(args.slice(1));
    if (!options.policy || !options.intent) {
      throw new Error("Usage: proof-templates rails --policy path --intent path [--json]");
    }

    const plan = recommendProofRails(readJson(options.policy), readJson(options.intent));
    if (options.json) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      printRailsPlan(plan);
    }
    process.exit(0);
  }

  if (command === "tags") {
    console.log(getTags().join("\n"));
    process.exit(0);
  }

  if (command === "categories") {
    console.log(getCategories().join("\n"));
    process.exit(0);
  }

  printHelp();
  process.exit(command === "help" || command === "--help" || command === "-h" ? 0 : 1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function parseOptions(tokens) {
  const options = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=");
    const next = tokens[index + 1];
    const value = inlineValue ?? (next && !next.startsWith("--") ? next : true);
    options[toCamelCase(rawKey)] = value;

    if (inlineValue === undefined && value === next) {
      index += 1;
    }
  }

  return options;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function printTemplate(template) {
  console.log(`${template.title} (${template.id})`);
  console.log(template.summary);
  console.log("");
  console.log(`Category: ${template.category}`);
  console.log(`Systems: ${template.systems.join(", ")}`);
  console.log(`Tags: ${template.tags.join(", ")}`);
  console.log("");
  console.log("Statement:");
  console.log(template.statement);
  console.log("");
  console.log("Core constraints:");
  for (const constraint of template.constraints) {
    console.log(`- ${constraint}`);
  }
  console.log("");
  console.log("Security notes:");
  for (const note of template.securityNotes) {
    console.log(`- ${note}`);
  }
}

function printRailsPlan(plan) {
  console.log(`Proof Rails plan for ${plan.intentId}`);
  console.log(plan.summary);
  console.log("");
  console.log("Required templates:");
  for (const template of plan.requiredTemplates) {
    console.log(`- ${template}`);
  }
  console.log("");
  console.log("Checks:");
  for (const check of plan.checks) {
    console.log(`- [${check.status}] ${check.label}: ${check.detail}`);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function printHelp() {
  console.log(`Proof Template Library

Usage:
  proof-templates list [--tag tag] [--category category] [--system noir|circom] [--maturity starter|experimental|reviewed|production-pattern|audited]
  proof-templates show <id> [--json]
  proof-templates scaffold <id> [--system noir|circom] [--out path] [--force]
  proof-templates rails --policy path --intent path [--json]
  proof-templates tags
  proof-templates categories
`);
}
