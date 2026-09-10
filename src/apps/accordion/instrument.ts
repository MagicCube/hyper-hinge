import type { Score } from "./score";
export class Instrument {
  context = new AudioContext();
  master = this.context.createGain();
  compressor = this.context.createDynamicsCompressor();
  voices = new Set<OscillatorNode>();
  playing = false;
  offset = 0;
  started = 0;
  cursor = 0;
  octave = 0;
  timer: ReturnType<typeof setInterval> | undefined;
  constructor(public score: Score) {
    this.master.gain.value = 0.12;
    this.master.connect(this.compressor);
    this.compressor.threshold.value = -16;
    this.compressor.ratio.value = 8;
    this.compressor.connect(this.context.destination);
  }
  get position() {
    return Math.min(
      this.score.duration,
      this.playing
        ? this.offset + this.context.currentTime - this.started
        : this.offset,
    );
  }
  async play() {
    await this.context.resume();
    if (this.playing) return;
    if (this.offset >= this.score.duration) this.offset = 0;
    this.started = this.context.currentTime;
    this.cursor = this.score.notes.findIndex((n) => n.time >= this.offset);
    if (this.cursor < 0) this.cursor = this.score.notes.length;
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }
  pause() {
    this.offset = this.position;
    this.playing = false;
    clearInterval(this.timer);
    this.voices.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    this.voices.clear();
  }
  seek(time: number) {
    const active = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(this.score.duration, time));
    if (active) void this.play();
  }
  phrase(direction: number) {
    const current = Math.max(
      0,
      this.score.bars.findIndex((t) => t > this.position) - 1,
    );
    const phrase = Math.floor(current / 4) * 4;
    const next = Math.max(
      0,
      Math.min(this.score.bars.length - 1, phrase + direction * 4),
    );
    this.seek(this.score.bars[next]);
  }
  expression(velocity: number) {
    const intensity = 0.065 + Math.min(Math.abs(velocity) / 65, 1) * 0.11;
    this.master.gain.setTargetAtTime(intensity, this.context.currentTime, 0.08);
  }
  schedule() {
    if (!this.playing) return;
    const time = this.position;
    if (time >= this.score.duration) {
      this.pause();
      return;
    }
    while (
      this.cursor < this.score.notes.length &&
      this.score.notes[this.cursor].time < time + 0.12
    ) {
      const note = this.score.notes[this.cursor++];
      if (note.time < time - 0.12) continue;
      const start = Math.max(
        this.context.currentTime + 0.004,
        this.started + note.time - this.offset,
      );
      const duration = Math.max(0.06, note.duration * 0.96);
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(note.velocity * 0.22, start + 0.018);
      gain.gain.setTargetAtTime(note.velocity * 0.12, start + 0.045, 0.08);
      gain.gain.setTargetAtTime(0, start + duration, 0.045);
      gain.connect(this.master);
      let remaining = 2;
      [0, 5].forEach((detune) => {
        const o = this.context.createOscillator();
        o.type = "sawtooth";
        o.frequency.value =
          440 * 2 ** ((note.midi + this.octave * 12 - 69) / 12);
        o.detune.value = detune;
        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1800;
        filter.Q.value = 0.4;
        o.connect(filter);
        filter.connect(gain);
        o.start(start);
        o.stop(start + duration + 0.25);
        this.voices.add(o);
        o.onended = () => {
          this.voices.delete(o);
          o.disconnect();
          filter.disconnect();
          if (--remaining === 0) gain.disconnect();
        };
      });
    }
  }
  dispose() {
    this.pause();
    void this.context.close();
  }
}
