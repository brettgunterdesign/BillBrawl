# Bill Brawl

An original browser arena shooter starring platypuses, ducks, pelicans, toucans, puffins, and shoebills. Species are cosmetic and share one movement model and body hitbox.

## Play locally

Serve `dist` with any static HTTP server, for example:

```sh
python -m http.server 8080 --directory dist
```

Open `http://localhost:8080` in a desktop browser. Two players can share a keyboard or use controllers. Four-player mode uses the keyboard for players 1–2 and two controllers for players 3–4. Solo mode includes a simple practice opponent. Controls appear below the arena and in How to Play. Browser/mobile rendering is responsive; touch gameplay is not implemented.

## Features

- Three rotating handcrafted arenas and first-to-ten matches.
- Pistol, shotgun, timed grenade; pickups, limited ammo, drops, throws.
- Jump, flutter, crouch, facing lock, player calls, recoil.
- One-hit elimination and simultaneous-death draws.
- High tide after 25 seconds to end standoffs.
- Six species, original Canvas pixel art, synthesized sound, pause, fullscreen.

This is a local multiplayer prototype. Internet multiplayer, map editing, replay recording, and progression are future work.

## Implementation and verification

Buildless JavaScript modules with a Canvas renderer and a fixed 60 Hz game simulation. Bullet collisions use swept segments. Combat resolves deaths together before scoring a round. The engine is independent of the DOM.

`npm test` runs engine tests; `npm run check` checks JavaScript syntax. Browser verification covered lobby choices, starting matches, keyboard input, pause/resume, sound, help, four-player controller gating, practice mode, and narrow layouts. Physical gamepad hardware has not been tested.

The only external page resource is an optional Google Fonts stylesheet; system fonts provide a fallback. Game code, art, and sounds are self-contained.
