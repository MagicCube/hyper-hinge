# Third-party assets and source notes

## Ndot 57

The local demo uses Ndot 57 Aligned, authored by Colophon for Nothing. This is not an open-source font. No redistribution license has been verified. The binary is excluded from Git; the local setup retrieves the referenced file and checks its hash. Do not assume the project grants font rights for a public release or reuse. The exact local filename, source URL and hash are in `assets.json`.

Primary context: https://nothing.community/en/d/104-ndot57-the-nothing-typeface . The old Nothing Shopify font URL discussed there now returns 404. The local Aligned face was obtained from the mirrored file recorded in the manifest. Font family is checked in the running app.

## Inter

Inter Variable is by Rasmus Andersson, under SIL Open Font License 1.1. The font and license are included in `public/fonts/`. Source: https://rsms.me/inter/font-files/InterVariable.woff2 . License: https://github.com/rsms/inter/blob/master/LICENSE.txt . No font modifications.

## Soleá MIDI

- Composer: Julián Arcas (1832–1882).
- Work: Soleá; guitar, D minor. Historical edition metadata: https://imslp.org/wiki/Solea_(Arcas,_Juli%C3%A1n) .
- Download page: https://bitmidi.com/arcas_solea-mid . Direct MIDI: https://bitmidi.com/uploads/31604.mid .
- Parsed file header: `Arcas_Solea`; PPQ 480; 3/4 time; 1,558 note events across two populated tracks; approximately 328.01 seconds; a tempo map beginning at approximately 130 BPM.
- Opening notes include bass A2 and the A-major sonority E3/A3/C♯4, consistent with the score's opening dominant/Phrygian context. This is a source transcription, not a newly composed approximation or a claimed archival performance.
- The historical composition is old, but the MIDI transcription's author and redistribution terms are not supplied on the download page. Its binary is therefore excluded from Git. The local setup retrieves it with a deterministic hash. Do not label the MIDI transcription CC0 or MIT.
- No original notes, note timing, tempo events or harmonies were invented. The app parses the MIDI at runtime and synthesizes all populated tracks. The accordion-like reed timbre, dynamics from lid velocity, octave shifts and phrase navigation are application behavior, not part of the original transcription.

## Native sensor technique

The HID report mechanism is informed by public experiments, including https://gist.github.com/alessaba/098f83c587e1372d30dea36a7c18b7cc . The project's C helper is implemented locally with report validation, streaming, cleanup and structured errors. Matching identifiers are hardware protocol facts. Apple documents the separate clamshell boolean in https://github.com/apple/darwin-xnu/blob/main/iokit/IOKit/pwr_mgt/IOPM.h .

## Artwork

The shipped laptop, accordion icon and original furry monster are code-native geometry. The monster's visible state is real-time 3D, with procedurally placed fur and continuous animation. Nothing shell inspiration and the owner's animated-monster references do not imply an affiliation with Nothing, Disney or Pixar. No supplied film poster, film character model, logo, or screenshot is included in the runtime app.

`docs/home-concept.png` was generated with the built-in image tool as a design reference. It is not an interactive screen or runtime artwork. Owner-directed changes after that concept are documented in `design-language.md`.
