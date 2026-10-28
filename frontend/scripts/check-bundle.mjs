import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const root = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL(".vite/manifest.json", root), "utf8"),
);
const files = new Set();
const visited = new Set();
/** @param {string} key */
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const item = manifest[key];
  if (!item) throw new Error("Entrada ausente no manifest.");
  files.add(item.file);
  for (const css of item.css || []) files.add(css);
  for (const imported of item.imports || []) visit(imported);
}
for (const [key, value] of Object.entries(manifest)) {
  if (/** @type {any} */ (value).isEntry) visit(key);
}
let bytes = 0;
for (const file of files) {
  if (/\.(js|css)$/.test(file))
    bytes += gzipSync(await readFile(new URL(file, root))).length;
}
if (bytes > 250 * 1024) throw new Error("Bundle inicial excedeu 250 KiB gzip.");
console.log(
  JSON.stringify({
    status: "passed",
    initial_gzip_bytes: bytes,
    budget_bytes: 250 * 1024,
  }),
);
