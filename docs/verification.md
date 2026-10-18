# Release verification — 18 October 2026

This report covers the three-stage action redesign. It distinguishes automated evidence from unverified human experience.

## Encounter and controls

- `npm test`: **53 passing, zero failing**. Coverage includes dash recovery/no immunity, sprint slide, clear-landing desk vaults and tall-wall rejection, accurate interception commitments, contact/follow-through timing, stationary melee abuse, sweep height/range/LOS, feints, repositioning, collision, reload resources, navigation/search, adaptation, win/loss/reset, audio and saved records.
- Complete simulation controllers use real movement and normal attack/command methods without setting hits, AI states or timers. Normal and Hard each win across three seeds; Precision and Teamwork objectives pass. A teammate-free angle route also wins. A prepared Kaede/net setup produces a real net mark.
- Deliberately stationary shooting with repeated single-classmate commands and stationary knife spam lose. Repeated unsupported counters require an additional threat; adaptation expires. Representative classroom, corner, veranda and yard pressure/search checks pass. This is not exhaustive map coverage.
- Input-driven Chrome victory: **12 marks, three stages, zero mistakes, 49.16 seconds**, six evasions, with challenge, angle and counter routes. The driver reads state, aims precisely and emits keyboard/mouse events; it does not assign outcomes. This is not a human pacing measurement.
- Natural stationary-fire browser loss: **five mistakes at 22.39 seconds**, followed by a successful same-seed reset.
- Browser control checks cover pointer lock, movement, crouch/jump/quickstep, tools, aiming/reload, net placement/retrieval, both commands, pause freezing, settings, result records and retry. Result-screen fixture coverage uses explicit score/timeout setup and is separate from the input-only playthrough.

## Presentation, sound and lifecycle

- Reviewed normal gameplay, classroom/veranda/garden, sweep and front/side/back character screenshots. Corrected missing rounded desk surfaces, window glass casting opaque shadows and Koro-sensei shadow artifacts.
- HUD/settings checked at **1280×720, 1366×768 and 1440×900** with both classmates active; core groups stay on screen and no undefined/NaN labels appear.
- **Twelve consecutive retries** reset marks, mistakes, traps, stage and ally cooldowns. After warming the persistent net meshes, renderer memory remains **259 geometries and 10 textures** before and after. Temporary visual effects are capped at 32 and disposed.
- During the winning headless Chrome run, the 95th-percentile animation-frame interval was **7ms**; peak observed render statistics were **442 draw calls, 147,498 triangles and nine transient effects**. These workstation/headless measurements are not a low-end GPU benchmark.
- Audio buffer tests cover finite samples, variation, headroom, positional routing and distinct movement/combat cues. Rendering the actual stereo Web Audio graph with overlapping cues produced peak amplitude **0.346**, below digital clipping. The review WAV is generated in ignored `test-results/`. Human headphone listening quality remains unverified.
- Independent review found misleading knife-flash instructions and Teamwork progress above 12 marks. Guidance now uses the reachable, cooldown-ready white crosshair; Teamwork progress is capped while missing assistance objectives remain explicit.

## Packaging

- Vite production build succeeds. Three.js is split into its own roughly 509.5kB chunk; Vite's size advisory remains. The application chunk is roughly 104.8kB. Runtime fonts, portraits and sound are local.
- Static build audit checks relative entries, local fonts/portraits and absence of localhost or development hooks in production JavaScript.
- Production offline check blocks external requests and tests settings and both variations. The workstation antivirus injects its own external request into localhost responses; the test blocks and separately identifies it. The application makes no external runtime requests.
- Source publication excludes dependencies, build output, credentials, environment files, private briefs, internal notes and temporary test artifacts. Third-party notices and verified user commit identity are retained.

## Limits

The requested five-to-eight-minute human session, broad difficulty tuning, subjective enjoyment, headphone listening quality and low-end GPU performance remain unverified. Expert simulation controllers finish in approximately 56–75 seconds. No forced waiting or padded health was added to simulate duration.

Models and animations are procedural stylizations, not production anime assets. Some cloth/tentacle poses can intersect scenery; collision uses simplified geometry. Dialogue is text and sound is locally synthesized. This is a desktop keyboard/mouse browser game, not a commercial AAA release.
