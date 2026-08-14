import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export { PROOF_RAILS_TEMPLATE_MAP, recommendProofRails } from "./proof-rails.js";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const catalogPath = join(packageRoot, "templates", "catalog.json");

function readCatalog() {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

export function listTemplates(filters = {}) {
  const templates = readCatalog();
  const tag = filters.tag?.toLowerCase();
  const category = filters.category?.toLowerCase();
  const system = filters.system?.toLowerCase();
  const maturity = filters.maturity?.toLowerCase();

  return templates.filter((template) => {
    if (tag && !template.tags.some((candidate) => candidate.toLowerCase() === tag)) {
      return false;
    }
    if (category && template.category.toLowerCase() !== category) {
      return false;
    }
    if (system && !template.systems.some((candidate) => candidate.toLowerCase() === system)) {
      return false;
    }
    if (maturity && template.maturity.toLowerCase() !== maturity) {
      return false;
    }
    return true;
  });
}

export function getTemplate(id) {
  const template = readCatalog().find((candidate) => candidate.id === id);
  if (!template) {
    throw new Error(`Unknown proof template "${id}".`);
  }
  return template;
}

export function getCategories() {
  return [...new Set(readCatalog().map((template) => template.category))].sort();
}

export function getTags() {
  return [...new Set(readCatalog().flatMap((template) => template.tags))].sort();
}

export function scaffoldTemplate(id, options = {}) {
  const template = getTemplate(id);
  const system = options.system ?? template.systems[0];
  const outDir = options.outDir ?? join(process.cwd(), id);
  const starters = template.starterFiles.filter((file) => file.system === system);

  if (starters.length === 0) {
    const available = template.systems.join(", ");
    throw new Error(`Template "${id}" does not have a ${system} starter. Available systems: ${available}.`);
  }

  mkdirSync(outDir, { recursive: true });

  const written = [];
  writeManagedFile(join(outDir, "template.json"), `${JSON.stringify(template, null, 2)}\n`, options.force);
  written.push(join(outDir, "template.json"));

  writeManagedFile(join(outDir, "README.md"), renderTemplateReadme(template, system), options.force);
  written.push(join(outDir, "README.md"));

  writeManagedFile(join(outDir, "inputs.example.json"), renderExampleInputs(template), options.force);
  written.push(join(outDir, "inputs.example.json"));

  for (const starter of starters) {
    const source = join(packageRoot, starter.source);
    const target = join(outDir, starter.output);
    mkdirSync(dirname(target), { recursive: true });
    writeManagedFile(target, readFileSync(source, "utf8"), options.force);
    written.push(target);
  }

  return {
    template,
    system,
    outDir,
    written
  };
}

function writeManagedFile(path, contents, force = false) {
  if (!force && existsSync(path)) {
    throw new Error(`Refusing to overwrite existing file: ${path}. Pass --force to replace it.`);
  }
  writeFileSync(path, contents);
}

function renderExampleInputs(template) {
  const publicInputs = Object.fromEntries(template.publicInputs.map((input) => [input.name, null]));
  const privateInputs = Object.fromEntries(template.privateInputs.map((input) => [input.name, null]));
  return `${JSON.stringify({ publicInputs, privateInputs }, null, 2)}\n`;
}

function renderTemplateReadme(template, system) {
  const publicInputs = template.publicInputs.map((input) => `- \`${input.name}\` (${input.type}): ${input.description}`).join("\n");
  const privateInputs = template.privateInputs.map((input) => `- \`${input.name}\` (${input.type}): ${input.description}`).join("\n");
  const constraints = template.constraints.map((constraint) => `- ${constraint}`).join("\n");
  const notes = template.securityNotes.map((note) => `- ${note}`).join("\n");

  return `# ${template.title}

${template.summary}

## Statement

${template.statement}

## System

Starter target: ${system}

## Maturity

${formatMaturity(template.maturity)}

## Public inputs

${publicInputs}

## Private inputs

${privateInputs}

## Core constraints

${constraints}

## Security notes

${notes}

## Status

This is a starter template, not an audited production circuit. Treat it as a specification and scaffold for implementation, tests, and review.
`;
}

function formatMaturity(value) {
  return value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}
