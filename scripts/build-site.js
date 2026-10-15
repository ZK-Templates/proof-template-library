import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

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

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });
writeFileSync(join(siteDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
copyFileSync(join(root, "site-src", "index.html"), join(siteDir, "index.html"));
copyFileSync(join(root, "site-src", "styles.css"), join(siteDir, "styles.css"));
copyFileSync(join(root, "site-src", "expandzk-logo.jpg"), join(siteDir, "expandzk-logo.jpg"));
copyFileSync(join(root, "site-src", "testnet.html"), join(siteDir, "testnet.html"));
copyFileSync(join(root, "site-src", "testnet.css"), join(siteDir, "testnet.css"));

const wasmModulePath = join(
  root,
  "node_modules/@aztec/bb.js/dest/browser/barretenberg_wasm/fetch_code/browser/barretenberg.js"
);
const { default: wasmDataUrl } = await import(pathToFileURL(wasmModulePath));
const wasmBase64 = wasmDataUrl.slice(wasmDataUrl.indexOf(",") + 1);
mkdirSync(join(siteDir, "assets"), { recursive: true });
writeFileSync(join(siteDir, "assets", "barretenberg.wasm.gz"), Buffer.from(wasmBase64, "base64"));
copyFileSync(
  join(root, "node_modules/@noir-lang/acvm_js/web/acvm_js_bg.wasm"),
  join(siteDir, "assets", "acvm_js_bg.wasm")
);
copyFileSync(
  join(root, "node_modules/@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm"),
  join(siteDir, "assets", "noirc_abi_wasm_bg.wasm")
);

await build({
  entryPoints: { "testnet-app": join(root, "site-src", "testnet-app.js") },
  outdir: siteDir,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  entryNames: "[name]",
  chunkNames: "assets/[name]-[hash]",
  logLevel: "warning"
});

console.log(`Built site with ${catalog.length} proof templates and the Proof Network Testnet.`);

function findTemplateLine(lines, id) {
  const needle = `"id": "${id}"`;
  const index = lines.findIndex((line) => line.includes(needle));
  if (index === -1) {
    throw new Error(`Could not find catalog line for template: ${id}`);
  }
  return index + 1;
}
