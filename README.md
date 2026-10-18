# Mach 20 — Class 3-E

An unofficial **Assassination Classroom** fan game. You are Nagisa Shiota. Koro-sensei splits into afterimages at twenty times the speed of sound, shuffles around the room and dares you to find the real one.

[Play in your browser](https://bouwles.github.io/assassination-classroom-last-bell/)

## How it plays

1. **He splits.** The real Koro-sensei moves first; his afterimages fade in late.
2. **He shuffles at Mach 20.** Follow the real one with your eyes.
3. **They freeze.** Shoot the real one to knock off a tentacle. Shoot an afterimage and a tentacle grows back, his face turns purple with a big ✕, and you lose three seconds.
4. **No tentacles left?** Clap to stun him (Nagisa's clap stunner), then strike as the red ring meets the yellow one.

Five periods, each faster with more afterimages: Homeroom, P.E., After school, Night study and Graduation under the broken moon. Koro-sensei grades every attempt on a test paper. A perfect run earns a hanamaru.

| Input | Action |
| --- | --- |
| Mouse | Aim and shoot, or strike with the knife |
| Q | Karma lunges in and pops every afterimage |
| E | Kaede brings pudding; he slows down and lingers |
| Space | Clap when the chance comes |
| Esc | Pause |

Settings cover volume, music, and screen shake and flashes.

## Run it locally

Double-click **Play.cmd** after building once, or:

```powershell
npm ci
npm run build
node server.mjs        # http://127.0.0.1:4173
```

Development: `npm run dev`. Rules tests: `npm test`. `npm run shots` plays a period in installed Chrome and saves screenshots to `test-results/screens` (run `npm run build` first).

`src/game.js` holds the rules, `src/render.js` paints the scenes and effects, `src/main.js` runs screens and input, `src/audio.js` synthesizes all sound.

## Credits

Unofficial personal fan project with no affiliation or endorsement. Assassination Classroom and its characters belong to Yūsei Matsui, Shueisha and the anime's rights holders. Character art comes from the official anime site; see [third-party notices](THIRD_PARTY_NOTICES.md). Scenes, effects, music and sound are made in code.
