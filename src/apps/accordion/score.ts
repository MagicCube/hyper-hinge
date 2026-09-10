import { Midi } from "@tonejs/midi";
export interface ScoreNote {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
  ticks: number;
}
export interface Score {
  notes: ScoreNote[];
  duration: number;
  bars: number[];
  title: string;
}
let cached: Promise<Score> | undefined;
export function loadScore(): Promise<Score> {
  return (cached ??= (async () => {
    const response = await fetch(
      new URL("../../../public/music/arcas-solea.mid", import.meta.url),
    );
    if (!response.ok) throw new Error("The MIDI score could not be loaded.");
    const midi = new Midi(await response.arrayBuffer());
    const notes = midi.tracks
      .flatMap((track) =>
        track.notes.map(({ midi, time, duration, velocity, ticks }) => ({
          midi,
          time,
          duration,
          velocity,
          ticks,
        })),
      )
      .sort((a, b) => a.time - b.time);
    if (!notes.length) throw new Error("This MIDI contains no notes.");
    const bars: number[] = [];
    for (let tick = 0; tick <= midi.durationTicks; tick += midi.header.ppq * 3)
      bars.push(midi.header.ticksToSeconds(tick));
    return {
      notes,
      duration: midi.duration,
      bars,
      title: "Soleá · Julián Arcas",
    };
  })().catch((error) => {
    cached = undefined;
    throw error;
  }));
}
