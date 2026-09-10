import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
if (process.platform !== "darwin") {
  console.log("macOS sensor unavailable; simulation remains usable.");
  process.exit(0);
}
mkdirSync("bin", { recursive: true });
execFileSync(
  "xcrun",
  [
    "clang",
    "-O2",
    "-Wall",
    "-Wextra",
    "native/lid-sensor.c",
    "-framework",
    "IOKit",
    "-framework",
    "CoreFoundation",
    "-o",
    "bin/lid-sensor",
  ],
  { stdio: "inherit" },
);
