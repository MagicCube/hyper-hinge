import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import pkg from "@tonejs/midi";
const { Midi } = pkg;
test("bundled Soleá is the verified source MIDI with notes and tempo map", () => {
  const bytes = fs.readFileSync("public/music/arcas-solea.mid");
  const manifest = JSON.parse(fs.readFileSync("docs/assets.json", "utf8"));
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    manifest.midi.sha256,
  );
  const midi = new Midi(bytes);
  assert.equal(midi.header.name, "Arcas_Solea");
  assert.deepEqual(midi.header.timeSignatures[0].timeSignature, [3, 4]);
  assert.equal(
    midi.tracks.reduce((n, t) => n + t.notes.length, 0),
    1558,
  );
  assert.ok(midi.header.tempos.length > 1);
  assert.ok(midi.duration > 320);
});
