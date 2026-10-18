# Last Bell — Class 3-E

A local first-person **Assassination Classroom** fan game. Play Nagisa in the mountain classroom, veranda and yard. Karma and Kaede help you create three training marks against Koro-sensei.

## Launch

**Double-click `Play.cmd`**, then click **Enter the classroom**. The game opens at **http://127.0.0.1:4173**. Keep the server console open; Ctrl+C stops it. Use Chrome or Edge with graphics acceleration.

The rebuilt game is included in `dist/`. Node.js is installed on this computer. Playing needs no installation, account, internet, API key or remote assets. If an older tab is open, reload it to load the overhaul.

```powershell
node server.mjs      # alternative launch
npm run dev          # development at http://127.0.0.1:5173
npm test             # simulation, navigation, combat and audio checks
npm run build        # rebuild the local production game
```

Run `npm install` only if development dependencies are missing.

## Controls

| Input | Action |
| --- | --- |
| WASD / mouse | Move / look |
| Shift / Ctrl | Sprint / crouch quietly |
| Space | Small jump; not a desk vault |
| Left click | Fire, slash or place selected net |
| Right click | Aim pistol |
| 1 / 2 / 3 | Pistol / knife / net |
| R | Reload pistol |
| E | Retrieve nearby unused net |
| Q | Command selected classmate |
| Tab | Switch Karma / Kaede |
| Escape | Pause and release mouse |

Settings include sensitivity, field of view, separate effects/music levels and reduced incidental motion. They persist in this browser. Switching tools remains available during a reload; a tag briefly lowers your equipment.

## Revised tactics

**A distraction is a contribution, not a free hit.** Watch the classmates' preparation and Koro-sensei's response. An intercepted attack gives a specific explanation.

- **Crossfire:** call Karma and Kaede from separated angles using Q, then Tab + Q. Move away from the lane Koro-sensei last saw while both engage. Aim from a third angle. One classmate alone cannot guarantee a pistol mark.
- **Prepared net:** place a net on clear ground ahead of him; it takes 1.25 seconds to arm and cannot be placed underneath him. Use Karma to occupy attention while Kaede moves beyond an unseen net. Move around the guard before firing when the net catches a tentacle. Nets seen by an attentive teacher are avoided; a committed lunge can still cross one.
- **Knife counter:** the yellow warning marks his committed destination. Sidestep, let the lunge finish, then close on his side with the knife. A distant pistol shot during recovery does not count. After a successful counter, change the side of your next approach or combine another threat.
- **Quiet ambush:** a crouched knife approach behind an engaged classmate's challenge can also work. Avoid recent gunfire and leave the old lane. Facing the blackboard by itself does not make Koro-sensei vulnerable.

Koro-sensei tracks visible approaches and audible intent, checks visible nets, navigates toward exposed positions, and searches the classroom and yard after losing contact. Repeating a successful route from the same position is guarded; changing angles or setups restores possibilities. Misses cost ammunition and expose intent without ending the attempt.

The lesson retains **four minutes, three marks and three mistakes**. Tags have a readable windup and three seconds of damage immunity. Same-setup retry preserves the seed and fully resets the attempt. Precision retains 24 pellets total. Teamwork requires at least three marks including a net-assisted mark and classmate assistance.

## What changed in the overhaul

- Replaced timer-based vulnerabilities with deterministic threat, lane, perception and commitment checks. Added search behavior, pressure routes and reversible repetition handling.
- Rebuilt Karma and Kaede with lean proportions, shaped faces and layered hair, separate uniform panels, articulated elbows/knees, distance-driven walking, preparation, action and reaction poses. Preserved Koro-sensei's established model and added head attention and interception gestures. Nagisa remains the first-person player, represented by hands/equipment and the reference portrait.
- Retuned classroom materials, window-shaped daylight, ceiling and teacher-area lighting; refined equipment, material impacts, hit marks and interception feedback.
- Replaced the card-heavy HUD with one restrained equipment/team rail, centered clock, small marks, targeting brackets and contextual field notes. Menus share local Barlow typography, ruled paper and the same palette.
- Replaced generic oscillator cues with 24 original procedural foley recipes and variations: wood/dirt movement, cloth, mechanical handling, surface impacts, knife, tentacles, speed/arrivals, net phases, abilities, UI and ambience. Distance filtering, stereo positioning, room tails, a compressor and music ducking support urgent cues. Music uses an original plucked sequence with pressure changes.

## Verification

See [docs/verification.md](docs/verification.md) for evidence and limits. Tests include three distinct tactical approaches, all three modes, exploit attempts, lost-contact searches, audio rendering and a real-time browser victory/loss through input handlers.

```powershell
npm test
npm run test:browser
node tests/playthrough.mjs
node tests/loss-playthrough.mjs
node tests/responsive.mjs
node tests/audio-render.mjs
node tests/production.mjs
```

Browser tests require Chrome and the development server; production tests also require `node server.mjs --no-open`. Screenshots and a rendered audio review sequence are written to `test-results/`.

## Remaining limitations

The cast is authored stylized procedural 3D, not production TV-anime models. Facial expression, hair, clothing and animation remain simpler than the references. Dialogue is text; there is no recorded voice acting or anime soundtrack. Audio is intentionally synthesized foley and music, not recorded production sound.

Desktop keyboard/mouse only. Navigation uses conservative floor footprints; no desk vaulting or physical classmate collisions. Some gestures can overlap props. Small stationery is decorative. Pellets are immediate obstructed rays with visual streaks. There is no online play, gamepad support or progression system.

Automated controllers use precise state-aware aiming and can finish quickly. Several strategies and representative navigation positions are tested; broad human difficulty tuning, exhaustive map coverage and low-end GPU testing remain unverified.

## Source and credits

`src/simulation.js` owns behavior; `combat.js` owns opening rules; `world.js` owns collision/navigation; `characters.js` and `students.js` own models; `scene.js` owns rendering; `main.js` and `style.css` own UI; `audio.js` and `audio-design.js` own the local audio system. The pre-overhaul source is archived in `docs/pre-overhaul.zip`.

Local portraits were downloaded from the [official 2014–2016 character directory](https://www.ansatsu-anime.com/2014-2016/character/). Character art belongs to its original creators and rights holders. This is an unofficial personal fan project with no affiliation or endorsement. Three.js and Vite use MIT licenses. Barlow and Barlow Condensed use the SIL Open Font License, included in `public/fonts/`. Nothing has been published or deployed.
