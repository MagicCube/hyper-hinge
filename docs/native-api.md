# Native sensor and JavaScript API

All HyperHinge apps share one service. Prefer the app SDK below. The raw preload bridge is for the shared SDK and diagnostics, not a second integration path per mini-app.

## App SDK

```ts
import { hinge, useHinge } from "../../hinge";
import type { HingeState } from "../../hinge";
```

React:

```tsx
export function MyApp() {
  const { angle, velocity, direction, source, available } = useHinge();
  if (!available) return <p>Turn on Simulate to try this app.</p>;
  return (
    <p>
      {angle.toFixed(1)}° · {velocity.toFixed(1)}°/s · {source}
    </p>
  );
}
```

Plain JavaScript / a Three.js loop:

```js
import { hinge } from "./src/hinge/index";

const unsubscribe = hinge.subscribe(() => {
  const state = hinge.getSnapshot();
  if (!state.available) return;
  console.log(state.angle, state.direction);
});

// Cleanup on unmount / route exit:
unsubscribe();
```

For a frame loop, call `hinge.getSnapshot()` each frame; don't subscribe separately just to maintain another copy. `subscribe` callbacks take no arguments (the React external-store convention). Read the snapshot inside the callback.

### Snapshot contract

| Field         | Type / unit                   | Meaning                                                                                                          |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `angle`       | number, degrees               | Smoothed physical lid angle. 0 is closed; ~90 is upright.                                                        |
| `rawAngle`    | number, degrees               | Last validated hardware sample, or simulator target.                                                             |
| `velocity`    | number, degrees/second        | Smoothed derivative; negative closing, positive opening.                                                         |
| `direction`   | `opening`, `closing`, `still` | Velocity above +2, below −2, or inside the ±2°/s deadband.                                                       |
| `baseline`    | number, degrees               | Comfortable calibrated reference.                                                                                |
| `delta`       | number, degrees               | `angle - baseline`.                                                                                              |
| `openness`    | number, 0–1                   | `clamp(angle / 140, 0, 1)`; convenience value, not a hardware specification.                                     |
| `closure`     | number, 0–1                   | Relative closure from baseline toward 10°; convenience effect value. Games should set their own nonzero targets. |
| `source`      | `live` or `simulation`        | Explicit provenance. Never present simulation as hardware input.                                                 |
| `available`   | boolean                       | The selected source is usable and fresh.                                                                         |
| `message`     | string                        | Human-readable source / error status.                                                                            |
| `timestamp`   | number, milliseconds          | Monotonic `performance.now()` at snapshot publication; local renderer clock.                                     |
| `sensorAgeMs` | number, milliseconds          | Elapsed renderer time since native frame receipt; zero in simulation.                                            |

Do not interpret angle=0 or velocity=0 as an availability signal. Check `available`. On loss of input, the last angle is retained for a stable display, velocity is zeroed, and availability becomes false. First valid input after a gap resets the derivative so a resume is not mistaken for a fast slam.

### Methods

```ts
hinge.getSnapshot(): HingeState
hinge.subscribe(listener: () => void): () => void
hinge.calibrate(): void
hinge.simulate(enabled: boolean): void
hinge.setSimulatedAngle(angle: number): void
hinge.fullscreen(enabled: boolean): Promise<void>
```

- `calibrate()` saves the current filtered angle as the reference in local storage. It does not alter raw hardware values. The UI owns the user interaction that invokes it.
- `simulate(true)` begins from the current angle and resets velocity. `simulate(false)` selects the real sensor, exposing unavailable state if necessary. Browser previews begin in simulation.
- `setSimulatedAngle` accepts finite degrees and clamps to 0–140. The shared UI deliberately exposes **15–140**; no demo requires full closure. It only changes the simulator target, never hardware.
- `fullscreen` delegates to Electron on desktop and the Fullscreen API in a browser. Invoke it from a user gesture in browser previews and handle rejection.

## Raw Electron bridge

Available only in the desktop renderer:

```ts
window.hyperHinge.getSnapshot(): Promise<SensorFrame | null>
window.hyperHinge.onFrame(listener: (frame: SensorFrame) => void): () => void
window.hyperHinge.setFullscreen(enabled: boolean): Promise<void>
window.hyperHinge.onFullscreenChange(listener: (enabled: boolean) => void): () => void

interface SensorFrame {
  available: boolean;
  angle: number | null;
  message: string;
  timestamp: number; // Date.now(), epoch milliseconds from the main process
}
```

This is a narrow `contextBridge` API, not the Electron `ipcRenderer` object. Subscribe before requesting an initial snapshot, and disregard an older initial snapshot if a newer event has arrived. `onFrame` returns a remover. `onFullscreenChange` also returns a remover and reports native enter/leave events, including the macOS title-bar control. The SDK already implements these details.

The preload exposes no filesystem, shell execution, arbitrary channel, or arbitrary URL-opening method. Renderer `nodeIntegration` is disabled; context isolation and sandboxing are enabled. The main process validates its IPC sender and prevents unexpected navigation and popup creation.

## Native protocol

`native/lid-sensor.c` is compiled into `bin/lid-sensor`. The Electron main process starts exactly one helper. It matches Apple HID vendor `0x05AC`, usage page `0x20`, usage `0x8A`. It requests feature report ID 1, checks success, minimum length, report ID and a 0–180° range, then decodes a little-endian 16-bit angle from bytes 1 and 2.

```sh
npm run native
./bin/lid-sensor --once
# {"angle":108}     (example only; actual machine reading varies)
./bin/lid-sensor
# newline-delimited JSON, requested every 20ms
```

The helper emits `{"error":"..."}` and exits nonzero when unavailable. It handles termination signals and closes the HID device. IOKit is used read-only; it does not change sleep behavior or seize the device.

The helper requests **50 Hz**. This does not imply 50 independent hardware measurements per second: actual sensor rate, resolution, access and accuracy depend on model/driver. On the development machine the report is integer-valued degrees. The SDK uses a time-based exponential angle filter (75ms time constant) and velocity filter (100ms), publishing at 50 Hz. A 500ms sample gap resets the signal derivative.

The main process retries failed helpers after 3 seconds, restarts a helper whose last valid reading exceeds 1.5 seconds, and stops/restarts across suspend/resume. The renderer separately marks its live stream stale after 1.5 seconds. Recovery is implemented; physical sleep/wake cycles still require hardware QA.

## Adding an app

1. Read `docs/design-language.md` and `AGENTS.md`.
2. Add `src/apps/my-app/MyApp.tsx` and an icon component. Use `useHinge()` or `hinge.getSnapshot()`.
3. Register a `MiniAppDefinition` in `src/apps/registry.ts`: `id`, `name`, `subtitle`, `description`, `icon`, `component`, and `tone` (`light` or `red`).
4. The shell supplies launch, home, fullscreen, simulation and settings automatically.
5. Clean up all subscriptions, RAFs, event listeners and audio/3D resources. Freeze game mechanics when `available` is false. Audio must start from a user gesture and stop on route exit / focus loss.
6. Test with simulated slow motion, sudden motion, stopped input and an unavailable sensor. Include screenshots and meaningful tests.

There is no network control API or automatic untrusted-plugin loader. Apps are local code reviewed and registered at build time. The sample in `examples/angle-meter/AngleMeter.tsx` is intentionally small.
