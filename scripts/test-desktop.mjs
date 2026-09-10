import { _electron as electron } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
execFileSync("npm", ["run", "build"], { stdio: "inherit" });
const qa = path.resolve(process.env.HYPERHINGE_QA_DIR || "work/qa");
fs.mkdirSync(qa, { recursive: true });
const desktop = await electron.launch({
  args: ["."],
  env: { ...process.env, HINGE_DEV: "0" },
});
const errors = [];
const results = [];
try {
  const page = await desktop.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  await desktop.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1536, 1024),
  );
  await page.addInitScript(() => {
    window.__audioChecks = [];
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      createDynamicsCompressor() {
        const compressor = super.createDynamicsCompressor();
        const analyser = this.createAnalyser();
        analyser.fftSize = 1024;
        compressor.connect(analyser);
        window.__audioChecks.push(analyser);
        return compressor;
      }
    };
  });
  await page.reload();
  await page.waitForSelector(".app-launchers");
  await page.waitForTimeout(1200);
  assert.equal(await page.title(), "HyperHinge");
  assert.equal(await page.locator(".launcher").count(), 3);
  assert.equal(
    await page.locator(".home-heading p").innerText(),
    "Did you know there's a hinge sensor in your Macbook?",
  );
  assert.ok(
    await page.evaluate(
      () =>
        document.fonts.check('20px "Ndot 57"') &&
        document.fonts.check("20px Inter"),
    ),
  );
  const initial = await page.evaluate(() => window.hyperHinge.getSnapshot());
  results.push({ check: "native bridge", frame: initial });
  // Exercise the existing handlers without putting the user's Mac to sleep.
  await desktop.evaluate(({ powerMonitor }) => powerMonitor.emit("suspend"));
  await page.waitForFunction(() =>
    document.querySelector(".dock-source")?.textContent.includes("Offline"),
  );
  await page
    .getByRole("switch", { name: "Simulate lid angle", exact: true })
    .click();
  const slider = () => page.getByLabel("Simulated lid angle", { exact: true });
  await slider().fill("108");
  await page.waitForTimeout(1100);
  await desktop.evaluate(({ powerMonitor }) => powerMonitor.emit("resume"));
  assert.match(await page.locator(".dock-source").innerText(), /Simulated/);
  await page.screenshot({ path: path.join(qa, "home.png") });
  await page
    .getByRole("button", { name: "Lid Lab See the sensor in 3D" })
    .click();
  await page.waitForSelector(".lab-model canvas");
  await slider().fill("70");
  await page.waitForTimeout(850);
  assert.match(await page.locator(".lab-readings").innerText(), /70/);
  await page.getByRole("button", { name: "Side view", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(qa, "lab.png") });
  await page
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await page.waitForTimeout(1300);
  assert.equal(
    await desktop.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isFullScreen(),
    ),
    true,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1300);
  assert.equal(
    await desktop.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isFullScreen(),
    ),
    false,
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  assert.match(await page.getByTestId("angle").innerText(), /70/);
  results.push({
    check: "shared simulated angle persists through routes and fullscreen",
    pass: true,
  });
  await slider().fill("108");
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: "Don’t Wake Up Let the little guy sleep" })
    .click();
  await page.waitForSelector(".monster-game-canvas canvas");
  await page
    .getByRole("button", { name: "Start sneaking", exact: true })
    .click();
  await slider().fill("20");
  await page.waitForTimeout(1200);
  assert.match(await page.locator(".sleep-copy h2").innerText(), /HELLO/);
  await page.screenshot({ path: path.join(qa, "monster-awake.png") });
  await slider().fill("108");
  await page.waitForTimeout(1600);
  await page.getByLabel("Finish angle").selectOption("70");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  for (let angle = 107; angle >= 69; angle--) {
    await slider().fill(String(angle));
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(400);
  assert.match(await page.locator(".sleep-copy h2").innerText(), /QUIETLY/);
  await page.screenshot({ path: path.join(qa, "monster.png") });
  results.push({
    check:
      "continuous 3D game reacts to fast movement and wins at nonzero target",
    pass: true,
  });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Accordion Play it by ear" }).click();
  await page.getByRole("button", { name: "Play space", exact: true }).waitFor();
  await page.keyboard.press("Space");
  await page.waitForTimeout(1000);
  assert.ok(
    await page
      .getByRole("button", { name: "Pause space", exact: true })
      .isVisible(),
  );
  await page.waitForFunction(
    () =>
      Number(document.querySelector('[aria-label="Score position"]').value) >
      0.5,
    null,
    { timeout: 10000 },
  );
  const peak = await page.evaluate(() =>
    Math.max(
      ...window.__audioChecks.map((analyser) => {
        const buffer = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buffer);
        return Math.max(...buffer.map(Math.abs));
      }),
    ),
  );
  assert.ok(
    peak > 0.00001,
    `Synthesized audio has a nonzero waveform: ${peak}`,
  );
  await page.keyboard.press("ArrowUp");
  assert.match(await page.locator(".music-note").innerText(), /Octave \+1/);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  assert.ok(Number(await page.getByLabel("Score position").inputValue()) > 4);
  await page.keyboard.press("Space");
  assert.ok(
    await page
      .getByRole("button", { name: "Play space", exact: true })
      .isVisible(),
  );
  const paused = Number(await page.getByLabel("Score position").inputValue());
  await page.waitForTimeout(350);
  assert.ok(
    Math.abs(
      Number(await page.getByLabel("Score position").inputValue()) - paused,
    ) < 0.1,
  );
  await page.screenshot({ path: path.join(qa, "accordion.png") });
  results.push({
    check: "source MIDI transport, phrase selection, octave and pause",
    pass: true,
  });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Calibrate", exact: true }).click();
  assert.ok(
    await page.getByRole("button", { name: "Saved", exact: true }).isVisible(),
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await page.getByRole("button", { name: "Make an app", exact: false }).click();
  assert.ok(await page.locator("dialog[open]").isVisible());
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  // The desktop min width is 800. Test compact renderer widths by lowering it only in this QA window.
  for (const width of [320, 375, 414, 768]) {
    await desktop.evaluate(({ BrowserWindow }, w) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.setMinimumSize(300, 500);
      window.setContentSize(w, 900);
    }, width);
    await page.waitForTimeout(250);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No overflow at ${width}`,
    );
    await page.screenshot({ path: path.join(qa, `home-${width}.png`) });
  }
  results.push({
    check: "dialogs, calibration, responsive home 320/375/414/768",
    pass: true,
  });
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(qa, "results.json"),
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally {
  await desktop.close();
}
