import { _electron as electron } from "playwright";
import assert from "node:assert/strict";
import { accessSync, constants } from "node:fs";
import path from "node:path";
const appPath = path.resolve("release/HyperHinge-darwin-arm64/HyperHinge.app");
accessSync(path.join(appPath, "Contents/Resources/lid-sensor"), constants.X_OK);
const desktop = await electron.launch({
  executablePath: path.join(appPath, "Contents/MacOS/HyperHinge"),
});
try {
  const page = await desktop.firstWindow();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.waitForSelector(".launcher");
  assert.equal(await page.title(), "HyperHinge");
  assert.equal(await page.locator(".launcher").count(), 3);
  if (process.env.HYPERHINGE_REQUIRE_SENSOR === "1")
    await page.waitForFunction(
      async () => Boolean((await window.hyperHinge.getSnapshot())?.available),
      null,
      { timeout: 15000 },
    );
  console.log(
    "Packaged sensor:",
    await page.evaluate(() => window.hyperHinge.getSnapshot()),
  );
  assert.ok(await page.evaluate(() => document.fonts.check('20px "Ndot 57"')));
  await page.getByRole("button", { name: "Accordion Play it by ear" }).click();
  await page.getByRole("button", { name: "Play space", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log("Packaged app, executable helper, fonts and MIDI passed.");
} finally {
  await desktop.close();
}
