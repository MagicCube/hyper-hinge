import { spawn, execFileSync } from "node:child_process";
import electron from "electron";
import { createServer } from "vite";
execFileSync(process.execPath, ["scripts/build-native.mjs"], {
  stdio: "inherit",
});
const server = await createServer();
await server.listen();
const desktop = spawn(electron, ["."], {
  stdio: "inherit",
  env: { ...process.env, HINGE_DEV: "1" },
});
async function stop() {
  desktop.kill();
  await server.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
desktop.on("exit", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
