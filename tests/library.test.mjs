import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { getCategories, getTags, getTemplate, listTemplates, scaffoldTemplate } from "../src/index.js";

test("catalog exposes starter proof templates", () => {
  const templates = listTemplates();

  assert.equal(templates.length, 5);
  assert.deepEqual(
    templates.map((template) => template.id).sort(),
    ["age-gate", "anonymous-vote", "group-membership", "private-allowlist", "proof-of-reserves"]
  );
});

test("templates can be filtered by system, category, and tag", () => {
  assert.equal(listTemplates({ system: "circom" }).length, 1);
  assert.equal(listTemplates({ category: "identity" }).length, 2);
  assert.ok(listTemplates({ tag: "merkle" }).some((template) => template.id === "group-membership"));
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
  const catalog = readFileSync("templates/catalog.json", "utf8").split("\n");
  const ids = templates.map((template) => template.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const template of templates) {
    assert.equal(catalog[template.github.catalogLine - 1].trim(), `"id": "${template.id}",`);

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
