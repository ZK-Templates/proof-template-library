import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const siteDir = join(root, "site");
const catalogPath = join(root, "templates", "catalog.json");
const catalogSource = readFileSync(catalogPath, "utf8");
const catalogLines = catalogSource.split("\n");
const catalog = JSON.parse(catalogSource).map((template) => ({
  ...template,
  github: {
    catalogLine: findTemplateLine(catalogLines, template.id)
  }
}));

mkdirSync(siteDir, { recursive: true });
writeFileSync(join(siteDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
copyFileSync(join(root, "site-src", "index.html"), join(siteDir, "index.html"));
copyFileSync(join(root, "site-src", "styles.css"), join(siteDir, "styles.css"));

console.log(`Built site with ${catalog.length} proof templates.`);

function findTemplateLine(lines, id) {
  const needle = `"id": "${id}"`;
  const index = lines.findIndex((line) => line.includes(needle));
  if (index === -1) {
    throw new Error(`Could not find catalog line for template: ${id}`);
  }
  return index + 1;
}
