import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const source = stripTypeScriptTypes(
  fs.readFileSync("src/apps/accordion/instrument.ts", "utf8"),
  { mode: "strip" },
);
const { Instrument } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
class Node {
  gain = {
    value: 0,
    cancelScheduledValues() {},
    setValueAtTime(value) {
      this.value = value;
    },
    setTargetAtTime(value) {
      this.value = value;
    },
    linearRampToValueAtTime() {},
  };
  threshold = {};
  ratio = {};
  frequency = {};
  detune = {};
  Q = {};
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}
globalThis.AudioContext = class {
  currentTime = 0;
  createGain() {
    return new Node();
  }
  createDynamicsCompressor() {
    return new Node();
  }
  createOscillator() {
    return new Node();
  }
  createBiquadFilter() {
    return new Node();
  }
  async resume() {}
  async close() {}
};
test("bellows gate sound and score time, resume held notes, and set tempo in either direction", async () => {
  const instrument = new Instrument({
    duration: 10,
    bars: [0, 3, 6],
    notes: [{ time: 0, duration: 5, midi: 60, velocity: 1 }],
  });
  const tick = () => {
    instrument.context.currentTime += 0.1;
    instrument.schedule();
  };
  try {
    await instrument.play();
    tick();
    assert.equal(instrument.position, 0);
    assert.equal(instrument.voices.size, 0);
    instrument.expression(30);
    tick();
    assert.ok(Math.abs(instrument.position - 0.1) < 1e-6);
    assert.equal(instrument.voices.size, 1);
    instrument.expression(0);
    const held = instrument.position;
    tick();
    tick();
    assert.equal(instrument.position, held);
    assert.equal(instrument.voices.size, 0);
    assert.equal(instrument.master.gain.value, 0);
    instrument.expression(-60);
    tick();
    assert.ok(Math.abs(instrument.position - held - 0.2) < 1e-6);
    assert.equal(instrument.voices.size, 1);
    instrument.expression(NaN);
    tick();
    assert.equal(instrument.voices.size, 0);
    instrument.pause();
    instrument.expression(60);
    tick();
    assert.equal(instrument.voices.size, 0);
  } finally {
    instrument.dispose();
  }
});
test("focus loss or disposal while audio resumes cannot restart playback", async () => {
  const instrument = new Instrument({ duration: 10, bars: [0], notes: [] });
  let resume;
  instrument.context.resume = () =>
    new Promise((resolve) => {
      resume = resolve;
    });
  const pending = instrument.play();
  instrument.dispose();
  resume();
  await pending;
  assert.equal(instrument.playing, false);
  assert.equal(instrument.timer, undefined);
});
