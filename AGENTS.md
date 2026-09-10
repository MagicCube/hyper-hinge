# HyperHinge contributor and agent rules

Read `docs/design-language.md` and `docs/native-api.md` before changing UI or sensor integration. They are normative. Follow explicit project-owner instructions when they update these rules.

## Product

- Name: HyperHinge. Slogan exactly: `Did you know there's a hinge sensor in your Macbook?`
- An iPad-like Home Screen: useful hinge widgets above registered app icons. The app registry owns the list.
- Apps: Lid Lab, Don’t Wake Up, Accordion, The Other Side, Laptop Pinball. Keep the Home route and fullscreen available everywhere.
- Do not restore Reality Stabilizer, the original dashboard sidebar, green accents or paper-poster art.
- Nothing-inspired shell: exact red/black/white/gray tokens. Display font Ndot 57; all other UI Inter. Do not silently replace either font. Actual 3D game art may use its defined material palette.
- The monster must be a real, continuously animated 3D character. Its home icon is the same character peeking from a window. No sprite pose swapping as a substitute.
- Accordion uses the actual source MIDI. Do not invent a melody or label synthetic notes as an authentic score. Preserve provenance and deterministic asset hashes.
- Users should be able to pretend to play: keep keyboard input simple and musical. Games must finish before full lid closure.

## Architecture

- One C helper → one Electron main service → narrow preload → one shared JS store → all apps.
- Import app input from `src/hinge/index.ts`. Never spawn sensors or read IOKit from individual apps.
- Keep `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. Do not expose unrestricted IPC or Node APIs.
- Preserve `available`/`source` semantics; never pretend a simulated or stale reading is live.
- Cancel listeners/RAF/timers, dispose GPU resources and audio contexts when a mini-app unmounts. Avoid global key handlers that override dialogs, text inputs, or OS shortcuts.
- No system sleep changes, root requirement, login item, analytics or background network service.
- App-specific code belongs in `src/apps/<id>`. Shared controls belong in `src/components`. New apps register through `src/apps/registry.ts`.

## Workflow

- Use `rg` for searching. Prefer `uv` to `pip` for Python. For large CSV/JSONL/Excel data use pandas/NumPy; default Excel reads to `pandas.read_excel` with openpyxl.
- Keep third-party binaries excluded as listed in `.gitignore`; provenance and checksums live in `docs/assets.json`. Do not remove the asset checks just to make a build green.
- Run `npm run build`, `npm test`, and `npm run test:desktop` for changes to core interaction. For doc-only changes, verify the documented contract against source rather than adding mirror tests.
- Run formatting and inspect real Electron/browser screenshots after visual changes. Check desktop and compact layouts, live/unavailable/simulated states, focus handling, Home and fullscreen.
- Never claim a physical hardware sweep or sleep/wake cycle was tested when only the simulator was used. Do not claim the procedural monster matches a film asset's production quality.
- Keep review descriptions focused on behavior, validation and practical limits. Update these docs when the shared API changes.
