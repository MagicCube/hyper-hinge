# Make the next HyperHinge app

A hinge is a surprisingly good controller. Help find out what else it can do.

New little apps are especially welcome: an instrument, a game, a piece of generative art, an accessibility tool, or something we haven't thought of. You can contribute entirely in browser simulation; owning a supported MacBook is not required.

## Start small

1. Follow the setup in README.md.
2. Read `docs/design-language.md`, `docs/native-api.md` and `AGENTS.md`.
3. Copy `examples/angle-meter/AngleMeter.tsx` into a new `src/apps/<id>/` folder.
4. Add a `MiniAppDefinition` to `src/apps/registry.ts`.
5. Use the shared input. Home, fullscreen, settings and simulation already work.
6. Open a pull request with a short description, a screenshot or video, controls, and what you tested.

Keep app scope small enough that someone can understand it by moving their laptop a little. Make it useful or funny in its first few seconds. Don't require slamming, force, or closing the lid completely. Clearly handle missing input and allow a return home.

## Other ways to help

- Test a MacBook / macOS combination and report its model identifier, OS version, whether the sensor reads, and whether resume reconnects. Do not include serial numbers.
- Improve the original 3D monster's topology, fur, rigging, lighting and expressions while preserving continuous interaction and the peeking-window icon.
- Improve the accordion timbre, score-following or musical keyboard controls. Include exact score provenance for new MIDI material.
- Improve accessibility, performance, tests, documentation, or compact layout.

## Pull request checklist

- The new app consumes `useHinge()` or `hinge.getSnapshot()`, not a new hardware process.
- Live, unavailable and simulated states are correctly labeled.
- Visuals follow the font/palette rules; the screenshot shows the actual implementation.
- Home, fullscreen and keyboard controls remain usable. Input handlers do not interfere with text fields or modals.
- Timers, RAFs, event handlers, Three.js resources and audio are cleaned up on exit.
- `npm run build`, `npm test`, and relevant Electron tests pass.
- Assets have provenance. Do not add third-party binary files with unverified redistribution terms.

The repository has not yet selected an open-source license for project code. Ask the maintainer before reusing substantial code outside this project; submitting a contribution does not change third-party asset rights.
