# Verification — 2026-09-10

## Executed checks

- TypeScript typecheck, Vite production build and native C compilation pass.
- Nine Node tests pass: directional filtering, invalid input, sleep-gap derivative reset, calibration, sample-rate invariance, game win/loss/unavailable behavior, and the source MIDI's hash/contents.
- Playwright drives the actual Electron app. No Browser plugin was available, so testing uses Electron's real Chromium renderer rather than a mock UI.
- Native bridge reads successfully on the development M3 Pro (`Mac15,6`), reporting 0° while `AppleClamshellState` is true. No physical sweep is claimed.
- The test invokes Electron's suspend/resume handlers without sleeping the machine and verifies offline state plus simulator availability. Actual hardware sleep/wake recovery remains a hands-on check.
- Simulated input stays consistent through Home, all three apps and fullscreen transitions. Native fullscreen is checked through `BrowserWindow.isFullScreen()`; Esc returns normally.
- A fast simulated close wakes the continuously animated 3D monster. A slow sweep wins at 70°, before full closure.
- Source MIDI starts, advances, jumps phrases, changes octaves, pauses and produces a nonzero waveform measured through an AnalyserNode. Initial cold audio-device startup required waiting on actual transport progress rather than a fixed 1-second delay.
- Settings calibration saves, dialogs close with Esc, and contribution instructions are accessible.
- The main viewport is 1536×1024 CSS pixels; screenshots may include macOS's backing scale. Home was also checked at 320, 375, 414 and 768px with no horizontal overflow.
- No renderer `pageerror` events during the full interaction run.
- Final packaged `.app` smoke test passes with `HYPERHINGE_REQUIRE_SENSOR=1`: the helper exists outside ASAR, has execute permission, returns a real available reading, and the packaged renderer loads Ndot 57 and the MIDI score.

## Visual fidelity review

Both `docs/home-concept.png` and the latest real Electron screenshots were opened with `view_image`. The current product follows the concept's Nothing language **with the owner's subsequent explicit changes**; it is not claimed to be pixel-identical to the earlier concept.

| Point              | Evidence and disposition                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palette            | Black wallpaper, gray dock, light angle widget, white text and red active controls match the requested Nothing family. Old green accents were removed.                                                         |
| Typography         | Real local Ndot 57 Aligned and Inter loaded; dotted titles/readouts and readable UI text are visibly distinct.                                                                                                 |
| Layout             | Owner-requested live angle/motion widgets precede the three app icons. No sidebar or paper poster. This intentionally changes the initial sparse concept.                                                      |
| Copy               | Exact owner slogan replaces concept copy. App labels remain Lid Lab, Don’t Wake Up and Accordion. Visible additions are functional widget labels, source status, and simulator controls.                       |
| App icons          | Uniform rounded-square geometry. The middle icon is a real 3D furry monster peeking through a red window, per the later reference. Original 2D blob art is not shipped.                                        |
| Game art           | Actual 3D geometry, dense instanced fur, horns, eyes and teeth, with continuous arousal-driven animation. Color is confined to the art exception. It remains a procedural prototype, not a film-quality asset. |
| Interaction chrome | Home/fullscreen remain available, dock is shared, simulator slider appears only when enabled, and native dialogs retain focus behavior.                                                                        |
| Responsive layout  | Compact icons retain one-line labels; source/simulation/settings remain usable. Descriptive icon subtitles hide at compact widths.                                                                             |

Packaged-build smoke testing also caught the helper being archived inside ASAR by the current packager default. The helper is now copied as an extra resource and launched outside the archive.

Material issues fixed: stale initial visual direction, static sprite approach, fabricated motion waveform, missing native fullscreen-state synchronization, contribution-dialog focus trapping, and cold audio startup test assumptions. Above-the-fold copy matches the final owner-directed content inventory. No known clipped primary controls or horizontal-overflow issue remains in the checked home viewports.

## Remaining limits

Real physical opening/closing dynamics, broader hardware compatibility, sustained GPU/battery profiling and physical sleep/wake transitions need hands-on testing. The macOS build is local and unsigned/unnotarized for distribution. External font/MIDI binaries stay outside Git; the setup script records sources and verifies hashes. The repo does not assert those third-party files have an open redistribution license.
