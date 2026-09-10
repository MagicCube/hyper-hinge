import type { Score, ScoreNote } from "./score";
export class Instrument {
  context = new AudioContext();
  master = this.context.createGain();
  compressor = this.context.createDynamicsCompressor();
  voices = new Map<ScoreNote, { stop: () => void; octave: number }>();
  playing = false;
  offset = 0;
  octave = 0;
  rate = 0;
  updated = 0;
  disposed = false;
  generation = 0;
  timer: ReturnType<typeof setInterval> | undefined;
  score: Score;
  constructor(score: Score) {
    this.score = score;
    this.master.gain.value = 0;
    this.master.connect(this.compressor);
    this.compressor.threshold.value = -16;
    this.compressor.ratio.value = 8;
    this.compressor.connect(this.context.destination);
  }
  get position() {
    return this.offset;
  }
  async play() {
    const generation = ++this.generation;
    await this.context.resume();
    if (this.disposed || generation !== this.generation || this.playing) return;
    if (this.offset >= this.score.duration) this.offset = 0;
    this.updated = this.context.currentTime;
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), 20);
    this.schedule();
  }
  silence() {
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(0, this.context.currentTime);
    this.voices.forEach((voice) => voice.stop());
    this.voices.clear();
  }
  pause() {
    ++this.generation;
    this.playing = false;
    clearInterval(this.timer);
    this.silence();
  }
  seek(time: number) {
    this.silence();
    this.offset = Math.max(0, Math.min(this.score.duration, time));
    this.updated = this.context.currentTime;
  }
  phrase(direction: number) {
    const following = this.score.bars.findIndex((t) => t > this.position);
    const current =
      following < 0 ? this.score.bars.length - 1 : Math.max(0, following - 1);
    const phrase = Math.floor(current / 4) * 4;
    const next = Math.max(
      0,
      Math.min(this.score.bars.length - 1, phrase + direction * 4),
    );
    this.seek(this.score.bars[next]);
  }
  expression(velocity: number) {
    // Advance the old interval before applying the latest bellows speed.
    this.schedule();
    const speed = Number.isFinite(velocity) ? Math.abs(velocity) : 0;
    this.rate = speed > 2 ? Math.min(speed / 30, 3) : 0;
    if (!this.rate) this.silence();
  }
  schedule() {
    const now = this.context.currentTime;
    const elapsed = Math.max(0, Math.min(now - this.updated, 0.1));
    this.updated = now;
    if (!this.playing || !this.rate) return;
    this.offset = Math.min(
      this.score.duration,
      this.offset + elapsed * this.rate,
    );
    if (this.offset >= this.score.duration) {
      this.pause();
      return;
    }
    this.master.gain.setTargetAtTime(
      0.065 + Math.min(this.rate / 2, 1) * 0.11,
      now,
      0.015,
    );
    // Notes live on the motion-driven score clock, so stopping mid-note preserves
    // its remaining duration and changing speed never changes its pitch.
    const active = new Set(
      this.score.notes.filter(
        (note) =>
          note.time <= this.offset && note.time + note.duration > this.offset,
      ),
    );
    for (const [note, voice] of this.voices) {
      if (!active.has(note) || voice.octave !== this.octave) {
        voice.stop();
        this.voices.delete(note);
      }
    }
    for (const note of active) {
      if (this.voices.has(note)) continue;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(note.velocity * 0.16, now + 0.012);
      gain.connect(this.master);
      const oscillators = [0, 5].map((detune) => {
        const oscillator = this.context.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.frequency.value =
          440 * 2 ** ((note.midi + this.octave * 12 - 69) / 12);
        oscillator.detune.value = detune;
        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1800;
        filter.Q.value = 0.4;
        oscillator.connect(filter);
        filter.connect(gain);
        oscillator.start();
        return { oscillator, filter };
      });
      this.voices.set(note, {
        octave: this.octave,
        stop: () => {
          for (const { oscillator, filter } of oscillators) {
            oscillator.stop();
            oscillator.disconnect();
            filter.disconnect();
          }
          gain.disconnect();
        },
      });
    }
  }
  dispose() {
    this.disposed = true;
    this.pause();
    this.master.disconnect();
    this.compressor.disconnect();
    void this.context.close();
  }
}
