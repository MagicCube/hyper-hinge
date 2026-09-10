import test from "node:test";
import assert from "node:assert/strict";
import { revealAt } from "../src/apps/the-other-side/reveal.mjs";
test("desktop conceals the city at normal angles and reveals before closure", () => {
  assert.equal(revealAt(140), 0);
  assert.equal(revealAt(105), 0);
  assert.equal(revealAt(35), 1);
  assert.equal(revealAt(15), 1);
  assert.equal(revealAt(NaN), 0);
});
test("closing reveals continuously and reopening reverses along the same path", () => {
  let previous = 0;
  for (let angle = 105; angle >= 35; angle -= 0.25) {
    const current = revealAt(angle);
    assert.ok(current >= previous && current - previous < 0.006);
    previous = current;
  }
  assert.equal(revealAt(70), 0.5);
});
