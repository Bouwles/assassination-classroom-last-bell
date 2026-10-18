# Last Bell — Class 3-E

A first-person **Assassination Classroom** fan game. Play Nagisa in the mountain classroom, veranda and garden. Create openings against Koro-sensei with movement, accurate fire, timed knife follow-ups, nets, Karma and Kaede.

[Play in your browser](https://bouwles.github.io/assassination-classroom-last-bell/) · [Source](https://github.com/Bouwles/assassination-classroom-last-bell)

## Play locally

On this computer, double-click **Play.cmd** and choose **Enter the classroom**. Keep the server console open; Ctrl+C stops it. Use desktop Chrome or Edge with graphics acceleration.

For a fresh source checkout, install Node.js 22.12 or newer, then:

```powershell
npm ci
npm run build
node server.mjs
```

The local game opens at http://127.0.0.1:4173. After the initial dependency installation and build, playing needs no internet, account, API key or backend. Runtime assets are local. `dist/` is generated rather than committed.

## Controls

| Input | Action |
| --- | --- |
| WASD / mouse | Move / look |
| Shift | Sprint |
| F + movement direction | Quickstep; recovery limits use, no invulnerability |
| Ctrl | Crouch; press while sprinting to slide |
| Space | Jump; vault a nearby marked low desk when the landing is clear |
| Left click | Fire, slash or place a net; hold for repeated pistol fire |
| Right click | Aim pistol |
| 1 / 2 / 3 | Pistol / knife / net |
| R / E | Reload / retrieve an unused nearby net |
| Q / Tab | Command selected classmate / switch Karma and Kaede |
| Escape | Pause and release the mouse |

Settings include mouse sensitivity, field of view, master/effects/music levels, dialogue subtitles and reduced camera motion. Settings and personal records persist in this browser.

## The encounter

Three stages require **3, 4 and 5 decisive marks** within an eight-minute limit. Later stages add sweeps, feints and rapid repositioning. Normal permits five mistakes; Hard permits four and tightens attack tells, follow-up timing and adaptation.

Accurate shots occupy a guarding tentacle. Move away from that lane, add a classmate threat or bind a tentacle to earn an initial contact. Then follow through within the opening: change angle again or close for a timed knife strike. The white crosshair and **Strike now** cue indicate a reachable, ready follow-up. Clicking repeatedly from one position will not finish the encounter.

- **Karma** creates an aggressive competing threat. **Kaede** moves into a distracting route that can draw Koro-sensei toward prepared nets. Watch their preparation and engagement; a command alone does not guarantee a mark.
- Place a net on clear ground before he arrives. It arms after a short delay. Visible traps can be avoided; distraction and committed movement make a catch possible.
- Evade the telegraphed tag, then exploit the missed commitment from his flank. Duck or slide below the high sweep. Feints require reading his next movement rather than attacking the first cue.
- Repeated successful setups are remembered temporarily. Change approach or combine another threat to overcome that response.

Training supplies generous ammunition. Precision supplies a smaller finite reserve, with limited stage refills. Teamwork also requires a net-assisted mark and classmate assistance. Results record time, accuracy, evasions, setup variety, mistakes and grade separately for each mode and difficulty. Same-setup retry preserves the seed and resets the encounter immediately.

## Development and checks

```powershell
npm run dev                 # http://127.0.0.1:5173
npm test                    # simulation, movement, combat, audio and records
npm run test:browser        # development server + installed Chrome required
node tests/playthrough.mjs  # state-aware controller emits ordinary input events
node tests/loss-playthrough.mjs
node tests/retries.mjs
node tests/responsive.mjs
node tests/audio-render.mjs
npm run build
node tests/deployment.mjs
node tests/published.mjs    # serves the build under a repository subpath
```

`GAME_URL` overrides the development URL for playthrough/retry tests. `LIVE_URL` makes `tests/published.mjs` check the deployed page. GitHub Actions builds, tests and deploys `main` to Pages. See [verification evidence and limits](docs/verification.md).

`config.js` owns movement/difficulty tuning; `simulation.js`, `combat.js`, `movement.js` and `world.js` own the encounter. Rendering, models, UI, sound and saved records are separate modules.

## Limits and attribution

This is a compact desktop browser fan game, with procedural stylized models and animation. It is not a commercial AAA production. Dialogue is text; effects and music are synthesized locally. There are no recorded anime voices or soundtrack, online multiplayer or gamepad controls. Some animated cloth and tentacles can intersect scenery; navigation and collision use simplified footprints.

Automated controllers use precise aiming and state knowledge. Their short completion times do not establish human pacing or enjoyment. The requested five-to-eight-minute human session, broad balance and low-end GPU performance remain unverified.

Unofficial personal fan project, with no affiliation or endorsement. Character art belongs to its original creators and rights holders. Local portraits come from the [official character directory](https://www.ansatsu-anime.com/2014-2016/character/). See [third-party notices](THIRD_PARTY_NOTICES.md) for source attribution and included software/font licenses.
