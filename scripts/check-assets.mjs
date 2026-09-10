import { existsSync } from "node:fs";
for (const path of [
  "public/fonts/ndot57.woff2",
  "public/fonts/InterVariable.woff2",
  "public/music/arcas-solea.mid",
])
  if (!existsSync(path)) {
    console.error(
      `Missing ${path}. Run npm run setup:assets; see docs/third-party.md.`,
    );
    process.exit(1);
  }
