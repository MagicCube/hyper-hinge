import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";
const manifest = JSON.parse(
  readFileSync(new URL("../docs/assets.json", import.meta.url), "utf8"),
);
for (const item of Object.values(manifest)) {
  if (existsSync(item.path)) continue;
  const response = await fetch(item.url);
  if (!response.ok)
    throw new Error(`Could not fetch ${item.path}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== item.sha256)
    throw new Error(
      `Source changed for ${item.path}; verify provenance before updating the hash.`,
    );
  mkdirSync(dirname(item.path), { recursive: true });
  writeFileSync(item.path, bytes);
  console.log(`Downloaded ${item.path}`);
}
