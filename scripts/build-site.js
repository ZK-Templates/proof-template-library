import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const siteDir = join(root, "site");
const catalog = JSON.parse(readFileSync(join(root, "templates", "catalog.json"), "utf8"));

mkdirSync(siteDir, { recursive: true });
writeFileSync(join(siteDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
copyFileSync(join(root, "site-src", "index.html"), join(siteDir, "index.html"));
copyFileSync(join(root, "site-src", "styles.css"), join(siteDir, "styles.css"));

console.log(`Built site with ${catalog.length} proof templates.`);
