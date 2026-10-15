import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, createFileManager } from "@noir-lang/noir_wasm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const circuitDir = resolve(root, "circuits/agent-risk-guard");
const outputPath = resolve(root, "artifacts/agent-risk-guard.json");

const result = await compile(createFileManager(circuitDir));
if (result.program === undefined) {
  const messages = result.errors
    .map((error) => error.message ?? JSON.stringify(error))
    .join("\n");
  throw new Error(`Noir compilation failed:\n${messages}`);
}

const program = sanitizeArtifactPaths(result.program);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(program)}\n`);

console.log(`Compiled Agent Risk Guard to ${outputPath}`);

function sanitizeArtifactPaths(program) {
  for (const file of Object.values(program.file_map ?? {})) {
    if (typeof file.path === "string" && isAbsolute(file.path)) {
      file.path = relative(root, file.path);
    }
  }
  return program;
}
