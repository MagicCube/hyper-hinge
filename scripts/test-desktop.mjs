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
const waitFullscreen = async (expected) => {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (
      (await desktop.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isFullScreen(),
      )) === expected
    )
      return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.fail(`Native fullscreen did not become ${expected}`);
};
const errors = [];
const results = [];
try {
  const page = await desktop.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
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
  assert.equal(
    await page.locator(".launcher").count(),
    [...fs.readFileSync("src/apps/registry.ts", "utf8").matchAll(/id: "/g)]
      .length,
  );
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
  await waitFullscreen(true);
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await waitFullscreen(false);
  await page.waitForTimeout(600);
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
    .getByRole("heading", { name: "EASY DOES IT.", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Start sneaking", exact: true })
      .count(),
    0,
  );
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
  // Entry below the start angle waits, then starts automatically when opened.
  await slider().fill("20");
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: "Don’t Wake Up Let the little guy sleep" })
    .click();
  assert.match(
    await page.locator(".sleep-actions [role=status]").innerText(),
    /Open the lid/,
  );
  await slider().fill("108");
  await page
    .getByRole("heading", { name: "EASY DOES IT.", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForTimeout(1200);
  results.push({
    check: "monster auto-starts on entry and after opening a low lid",
    pass: true,
  });
  await page.getByRole("button", { name: "Accordion Play it by ear" }).click();
  await page
    .getByRole("button", { name: "Enable sound", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(1000);
  assert.ok(
    await page
      .getByRole("button", { name: "Sound enabled", exact: true })
      .isVisible(),
  );
  assert.equal(Number(await page.getByLabel("Score position").inputValue()), 0);
  for (let angle = 70; angle <= 115; angle += 3) {
    await slider().fill(String(angle));
    await page.waitForTimeout(60);
  }
  assert.ok(Number(await page.getByLabel("Score position").inputValue()) > 0.5);
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
  await page.waitForTimeout(1400);
  const held = Number(await page.getByLabel("Score position").inputValue());
  await page.waitForTimeout(400);
  assert.equal(
    Number(await page.getByLabel("Score position").inputValue()),
    held,
  );
  const quietPeak = await page.evaluate(() =>
    Math.max(
      ...window.__audioChecks.map((analyser) => {
        const buffer = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buffer);
        return Math.max(...buffer.map(Math.abs));
      }),
    ),
  );
  assert.ok(quietPeak < 0.00001, `Stopped bellows are silent: ${quietPeak}`);
  for (let angle = 115; angle >= 85; angle -= 3) {
    await slider().fill(String(angle));
    await page.waitForTimeout(60);
  }
  assert.ok(
    Number(await page.getByLabel("Score position").inputValue()) > held,
  );
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("ArrowUp");
  assert.match(await page.locator(".music-note").innerText(), /Octave \+1/);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  assert.ok(Number(await page.getByLabel("Score position").inputValue()) > 4);
  await page.keyboard.press("Space");
  assert.ok(
    await page
      .getByRole("button", { name: "Sound enabled", exact: true })
      .isDisabled(),
  );
  await page.waitForTimeout(1400);
  const paused = Number(await page.getByLabel("Score position").inputValue());
  await page.waitForTimeout(350);
  assert.ok(
    Math.abs(
      Number(await page.getByLabel("Score position").inputValue()) - paused,
    ) < 0.1,
  );
  await page.screenshot({ path: path.join(qa, "accordion.png") });
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
      `Accordion fits ${width}`,
    );
    await page.screenshot({ path: path.join(qa, `accordion-${width}.png`) });
  }
  await desktop.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1536, 1024),
  );

  results.push({
    check:
      "motion-driven source MIDI, stationary silence, resume, phrase selection, octave and ignored Space key",
    pass: true,
  });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Laptop Pinball Tilt. Roll. Hole." })
    .click();
  await page.waitForSelector(".pinball-scene canvas");
  await slider().fill("105");
  await page.waitForTimeout(600);
  await page
    .getByRole("button", { name: "Start rolling", exact: true })
    .click();
  await slider().fill("85");
  await page.waitForTimeout(1300);
  assert.match(await page.locator(".pinball-tilt strong").innerText(), /-13/);
  assert.ok(
    Number(await page.locator(".pinball-readouts b").innerText()) > 0.5,
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.waitForTimeout(150);
  const frozen = await page.locator(".pinball-readouts").innerText();
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".pinball-readouts").innerText(), frozen);
  await page.screenshot({ path: path.join(qa, "pinball.png") });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.keyboard.press("h");
  assert.ok(await page.locator(".pinball-app").isVisible());
  await page.keyboard.press("Escape");
  await desktop.evaluate(({ powerMonitor }) => powerMonitor.emit("suspend"));
  await page
    .getByRole("switch", { name: "Simulate lid angle", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Input unavailable" })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Resume", exact: true })
      .isDisabled(),
  );
  await page.screenshot({ path: path.join(qa, "pinball-unavailable.png") });
  await page
    .getByRole("switch", { name: "Simulate lid angle", exact: true })
    .click();
  await desktop.evaluate(({ powerMonitor }) => powerMonitor.emit("resume"));
  await page.getByRole("button", { name: "Reset ball", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".pinball-readouts b")?.textContent === "0.00",
  );
  await slider().fill("75");
  await page
    .getByRole("button", { name: "Start rolling", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "BALL LOST.", exact: true })
    .waitFor();
  assert.match(
    await page.locator(".pinball-status").innerText(),
    /over the edge/,
  );
  await page.screenshot({ path: path.join(qa, "pinball-lost.png") });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByRole("button", { name: "Start rolling", exact: true })
    .waitFor();
  await slider().fill("105");
  await page.waitForTimeout(500);
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
      `Pinball fits ${width}`,
    );
    await page.screenshot({ path: path.join(qa, `pinball-${width}.png`) });
  }
  await desktop.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1536, 1024),
  );
  await page
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await waitFullscreen(true);
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1300);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  results.push({
    check:
      "pinball tilt, gravity, pause, reset, unavailable, modal focus, fullscreen and compact layouts",
    pass: true,
  });
  await slider().fill("110");
  await page
    .getByRole("button", {
      name: "The Other Side Peek behind your desktop",
      exact: true,
    })
    .click();
  await page.waitForSelector(".other-city canvas");
  await page.waitForTimeout(1000);
  assert.equal(
    await page.locator(".other-side").getAttribute("data-reveal"),
    "0.000",
  );
  await page.screenshot({ path: path.join(qa, "other-side-desktop.png") });
  await slider().fill("70");
  await page.waitForTimeout(1000);
  assert.equal(
    await page.locator(".other-side").getAttribute("data-reveal"),
    "0.500",
  );
  await page.screenshot({ path: path.join(qa, "other-side-seam.png") });
  await slider().fill("35");
  await page.waitForTimeout(1000);
  assert.equal(
    await page.locator(".other-side").getAttribute("data-reveal"),
    "1.000",
  );
  await page.screenshot({ path: path.join(qa, "other-side-city.png") });
  for (const width of [320, 375, 414, 768]) {
    await desktop.evaluate(({ BrowserWindow }, w) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.setMinimumSize(300, 500);
      window.setContentSize(w, 1000);
    }, width);
    await page.waitForTimeout(250);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `The Other Side fits ${width}`,
    );
    await page.screenshot({ path: path.join(qa, `other-side-${width}.png`) });
  }
  await desktop.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1536, 1024),
  );
  await slider().fill("110");
  await page.waitForTimeout(1000);
  assert.equal(
    await page.locator(".other-side").getAttribute("data-reveal"),
    "0.000",
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  assert.equal(await page.locator(".other-city canvas").count(), 0);
  results.push({
    check:
      "The Other Side reveals reversibly at 105–35 degrees; desktop, seam, city, compact layouts and unmount",
    pass: true,
  });
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
