# HyperHinge design language

This document is normative. New apps inherit the shared shell. Do not redesign the brand while adding functionality.

## Identity

- Product name: **HyperHinge**. Repository: `magiccube/hyper-hinge`.
- Slogan, verbatim: **Did you know there's a hinge sensor in your Macbook?**
- Structure: an iPad-like home screen. Useful live widgets come first, then application icons. No permanent dashboard sidebar. Derive the installed app list and count from the registry.
- Visual reference: the early Nothing OS monochrome/red widget language, dot typography, rounded system controls, and restrained spacing. Not Apple glassmorphism, a generic SaaS dashboard, or an editorial poster.

## Fonts — mandatory

| Role                                                                     | Face        | Implementation        |
| ------------------------------------------------------------------------ | ----------- | --------------------- |
| Brand, page headings, major numeric readouts                             | **Ndot 57** | `var(--font-display)` |
| App names under icons, body, captions, settings, buttons, keyboard hints | **Inter**   | `var(--font-body)`    |

The supplied local display file is **Ndot 57 Aligned**. Do not substitute a CSS dot pattern, Doto, a system monospace, a pixel font, or a faux dotted SVG alphabet. Do not silently ship the fallback. Build checks require the actual font file; runtime QA must verify it loads.

Use dot typography for prominent short text. Do not use it for small paragraphs or dense controls. Preserve readable Inter for full sentences. Do not add serif fonts or a third decorative face. `src/tokens.css` owns all font faces and family tokens. Fonts load locally, including in a packaged app with no network.

## Shell palette — mandatory

| Token             | Value     | Use                                              |
| ----------------- | --------- | ------------------------------------------------ |
| `--color-bg`      | `#101010` | Wallpaper / canvas backdrop                      |
| `--color-surface` | `#242424` | Dark widgets and dock                            |
| `--color-raised`  | `#303030` | Pressable surfaces / keycaps                     |
| `--color-paper`   | `#eeeeee` | Light widgets and icons                          |
| `--color-text`    | `#f5f5f5` | Primary text                                     |
| `--color-muted`   | `#a5a5a5` | Secondary text                                   |
| `--color-dim`     | `#787878` | Tertiary details                                 |
| `--color-line`    | `#414141` | Necessary separators                             |
| `--color-red`     | `#e5232e` | Active controls, sensor indicator, focal accents |
| `--color-ink`     | `#101010` | Content on light surfaces                        |

CSS colors reference tokens. Red is a deliberate signal, not a background wash applied to every component. No green online dots, purple/blue shell gradients, neon glow, cream poster cards, or random semantic colors. Unavailable states use gray plus explicit text; color alone never conveys state.

## Components and proportion

- Widgets use 28px corners, light or dark solid fills, no decorative nested cards. Angle and motion are live data. Motion bars represent recent measured velocities, not a fabricated waveform.
- App icons use a consistent rounded-square silhouette (~30% radius). Desktop size is 132–150px; compact width uses 80px. App labels stay on one line. The entire icon/label group is clickable.
- The monster icon is a small window with a red frame. A real 3D monster peeks out. It shares the model with the game, rather than displaying unrelated stock art.
- Home-screen spacing follows the widget/icon columns. Keep usable empty space. Do not add invented weather, fake productivity counts, a giant marketing hero, repeated feature panels, or inactive page indicators.
- A compact dock contains the input source, simulation switch and settings. Only show the simulator slider while simulation is enabled. Settings hold calibration.
- Native window controls remain native. Never draw fake traffic lights, a URL bar or a pretend operating-system frame.
- Every app has a home route and shares fullscreen. F toggles fullscreen, H goes home, Esc first exits fullscreen and otherwise returns home. Do not intercept the keys while a modal or form field is active.

## 3D/game art exception

The shell, HUD, labels, menus and controls always obey the monochrome/red palette and fonts above. The actual 3D scene and rendered app-icon artwork may use a coherent character/material palette. This exception is explicitly requested for the owner-requested green cyclops: lime-green textured skin, teal iris, ivory horns and teeth, and warm stage lighting.

The monster is procedural 3D geometry with a single large eye, pear-shaped body, slim articulated limbs, materials, depth, lights and continuously animated eyelids, gaze, eyebrows, breathing, fingers and arms. The owner-provided green cyclops references supersede the previous cyan/purple furry character. Reference quality: an appealing American animated-film/game creature. Do not replace the scene with a raster screenshot, CSS blob, flat illustration, or a finite sprite-state swap. Do not claim film-production fidelity for a prototype model. Model animation is continuously driven by game arousal, derived from hinge movement.

The Lid Lab model represents the real lid pivot. Its display plane rotates relative to its base using the angle in degrees. Keep its technical illustration legible. The Accordion folds are geometric UI art, driven by the live angle.

## Motion, accessibility, and performance

- UI transitions: 120–200ms, gentle transform/opacity changes. No bouncing marketing animation or gratuitous parallax.
- Respect reduced-motion for ornamental transitions. Hinge-driven educational geometry and game feedback remain explicit functional motion; disable decorative camera movement.
- Every control is keyboard operable and named. Restore focus after dialogs; keep native dialog focus trapping. Provide text for unavailable sensor and WebGL states.
- Support the main desktop window and verify 320, 375, 414, and 768px widths for the browser preview. No horizontal overflow, clipped controls, or wrapping app labels.
- Use one native sensor service and one shared store. App render loops read the latest snapshot; do not run hardware reads per frame.
- Cancel animation frames, dispose Three.js geometry/materials/textures and Web Audio nodes on unmount. Cap pixel ratio; icon renderers use lower geometry detail. Do not keep the full game renderer alive on the home screen.

## Review gate

Check exact slogan, font load, palette, widget hierarchy, all registered app routes, the peeking icon, fullscreen/home behavior, simulator labeling, and unavailable states. New app contributions must include a screenshot and describe how hinge angle or motion affects the interaction. Changes to these brand rules require explicit project-owner direction.

References: [Nothing OS](https://us.nothing.tech/nothing-os), [Nothing community discussion of Ndot 57](https://nothing.community/en/d/104-ndot57-the-nothing-typeface), and the owner-provided home-screen / monster references. `docs/home-concept.png` is the initial Nothing concept; subsequent explicit owner changes add the widget row, exact slogan and real 3D window icon. It is not a frozen screenshot to copy over those newer requirements.

## The Other Side · 屏幕后面

Owner-requested app: a monochrome desktop lifts in perspective as the lid closes from 105° to 35°, revealing a real procedural 3D miniature city. The city material palette includes teal, terracotta, warm windows, foliage and sandstone, inspired by the supplied miniature-city reference. The shell retains its prescribed tokens. Reopening reverses the reveal; unavailable input freezes the scene at its last angle. Reduced motion stops traffic. No full closure is needed.

## Laptop Pinball

Owner-requested app: a real Three.js table rotates about its hinge axis. A silver ball rolls in a central guide lane under projected gravity and damping. Closing below the round’s neutral angle rolls away; opening rolls back. Neutral defaults to 105° and can be reset while paused. Each course requires two continuous, low-speed stops in alternating directions before the final hole opens. The three courses tighten hold, capture and time requirements (28/25/24 seconds). Both open ends drain the ball; sustained full tilt loses. All courses are reachable using 75–135° simulated lid angles. The final red-ringed hole is an actual opening in the mesh, covered until unlocked. Freeze mechanics on unavailable input, lost focus, hidden document or open dialog. Home icons use a monochrome/red table glyph. All game copy is English.
