import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const directory = fileURLToPath(
  new URL(
    "../../specs/004-frontend-financial-dashboard/contracts/",
    import.meta.url,
  ),
);
export async function verifyContract() {
  const names = [
    "upstream-openapi.json",
    "frontend-api.openapi.json",
    "service-observation.json",
  ];
  /** @type {Record<string,any>} */ const docs = {};
  for (const name of names)
    docs[resolve(directory, name)] = JSON.parse(
      await readFile(resolve(directory, name), "utf8"),
    );
  const observation = docs[resolve(directory, "service-observation.json")],
    bytes = await readFile(resolve(directory, "upstream-openapi.json"));
  if (
    createHash("sha256").update(bytes).digest("hex") !==
    observation.upstream_snapshot.sha256
  )
    throw new Error("O snapshot upstream mudou sem atualização da evidência.");
  /** @param {any} value @param {string} file */
  function walk(value, file) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) {
      const [name, fragment] = value.$ref.split("#");
      let target = docs[name ? resolve(directory, name) : file];
      if (!target) throw new Error("Referência externa ausente.");
      for (const part of (fragment || "").split("/").slice(1)) {
        target = target[part.replaceAll("~1", "/").replaceAll("~0", "~")];
        if (target === undefined) throw new Error("Referência inválida.");
      }
    }
    for (const child of Object.values(value)) walk(child, file);
  }
  for (const [file, doc] of Object.entries(docs)) walk(doc, file);
  return {
    status: "passed",
    snapshot_sha256: observation.upstream_snapshot.sha256,
    documents: names.length,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(JSON.stringify(await verifyContract()));
