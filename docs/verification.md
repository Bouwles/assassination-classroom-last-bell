# Overhaul verification — 18 October 2026

This report supersedes the original build's verification. The old source and tests are preserved in `docs/pre-overhaul.zip`.

## Baseline and fixes

The pre-overhaul browser controller won in 18.6 seconds with three shots, no mistakes and little repositioning. Single distractions and nominal recovery states granted marks. The overhaul replaces those broad windows with actual threat separation, changed lanes, bound tentacles, or a missed close lunge.

Independent code review found and resolved four additional defects: knife spam cancelling committed tags, stale player memory preventing search, missing interception UI text, and missing floor/yard/ceiling impacts. Regressions cover each.

## Automated evidence

- `npm test`: **37 passing, 0 failing**. Includes real movement/command runs for crossfire, prepared net, and knife counter; complete standard/precision/teamwork runs across three seeds; stationary shooting and repeated single-ability failure; knife-spam failure; hidden-net perception; repeated-lane adaptation; obstruction, inventory, reset, timeout, and audio signatures.
- `node tests/playthrough.mjs`: real-time Chrome **Teamwork victory, three marks, zero mistakes, 14.8 simulated seconds**. Route sequence: prepared net, knife flank, opposite-side knife flank. Driver reads state to steer and emits keyboard/mouse events; it never assigns hits, AI states, inventory, positions or timers. This precise automated run is not a human difficulty measurement.
- `node tests/loss-playthrough.mjs`: natural **three-tag loss in17.7 seconds**, then same-seed retry with reset hits/mistakes/status.
- `npm run test:browser`: mouse capture, crouch/jump/movement, selection, net placement/retrieval, commands, pause freezing, persisted settings, aiming/reload, result screens and retry transitions pass. Result-screen coverage uses explicit score/timeout fixtures and is separate from the natural playthrough tests.
- Lost-contact tests start hidden players in yard `(20,0)`, veranda `(9,0)`, and a crouched classroom position `(-7,1)`. AI searches and tags within44 seconds without first giving it those coordinates. Other pressure tests cover representative classroom/corner/veranda/yard positions with known contact. These are samples, not an exhaustive proof of every map point.
- Procedural audio checks verify finite samples, audible energy, variation and individual headroom. `node tests/audio-render.mjs` renders the actual stereo Web Audio graph including a dense overlapping cue test: measured peak **0.563**, below digital clipping. Review sequence: `test-results/audio-review.wav`. No human headphone listening evaluation is claimed.
- Winning browser run measured a 95th-percentile animation frame interval of **7ms** on this workstation's headless Chrome configuration. This is not a low-end GPU benchmark. Static meshes are merged; transient geometry is disposed.

## Presentation and packaging

- Front/side/back cast views inspected; corrected reversed hair surfaces and uniform/collar silhouettes. Simplified forms and facial animation remain visible limitations.
- HUD/settings checked at1280×720,1366×768,1440×900 with both classmate commands active. Screenshots: `test-results/hud-*` and `settings-*`. No off-viewport core HUD groups or undefined/NaN labels.
- Local fonts/portraits, original generated audio and bundled Three.js need no runtime internet. Production check blocks external requests, tests settings and both lesson variants, and verifies development hooks are absent. Workstation antivirus injects an external script into localhost responses; the test blocks and separately identifies this OS injection.
- `npm run build` produces the included `dist/`. Vite reports a590.8kB JavaScript bundle (159.6kB gzip); its advisory chunk-size warning reflects the bundled 3D runtime, not a failed build.
- Impeccable's single final mechanical detector reported two accent-border warnings. The thin field-note rule and rectangular sheet top rule are intentional parts of the notebook treatment; sheets have no rounded corners.

## Limits

No anime-production model, recorded voice/audio, exhaustive navigation guarantee or broad human balance claim is made. Models are procedural stylized interpretations; movement uses conservative floor collision; some cloth/tentacle gestures can overlap scenery. The fast state-aware controller demonstrates feasibility and does not establish novice completion time. Details and controls are in README.md.
