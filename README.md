# Bill Brawl

An original browser arena shooter starring platypuses, ducks, pelicans, toucans, puffins, and shoebills. Species are cosmetic and share one movement model and body hitbox. Art, synthesized music, and sound effects are original; no Duck Game assets are used.

## Play locally

Serve `dist` with any static HTTP server:

```sh
python -m http.server 8080 --directory dist
```

Open `http://localhost:8080` in a desktop browser. Two players share a keyboard or use controllers. Three/four-human survival uses keyboard players 1–2 and one/two controllers for players 3–4; four-player PvP uses the same mapping. Solo practice has Beginner, Easy (default), Normal, and Hard bot settings. Choose DIFFICULTY on the character selection screen; W/S or controller bumpers cycle the four settings. Controls are available through the “?” button inside the game. Mobile rendering is responsive, but touch controls are not implemented. Internet Versus is available when a room server is configured; see [Render hosting setup](server/HOSTING.md).

## Arcade lobby

Match setup is a three-screen arcade flow: animated mode cards, character select, and destination select. Choose Classic Brawl, Bot Practice, or Horde Survival; choose the player count or bot difficulty; then lock in every human's species before choosing an arena. The game fills the browser viewport on first load, with no surrounding website, galleries, or scrolling page. Menus use short labels, large animated previews, player-coloured podiums, six roster tiles, and independent ready indicators. Controls open in a compact overlay; the gameplay HUD shows scores, weapon icons, ammunition, and survival health. A fullscreen button hides browser chrome after a user gesture; browsers prohibit entering native fullscreen automatically on page load. Pause and upgrade menus remain inside the game.

Mouse, keyboard, and standard-mapped controllers navigate the menu. Left/right selects modes and arenas; Enter confirms and Escape goes back. In character select, P1 uses A/D and F to ready, G to unlock; P2 uses left/right and K to ready, L to unlock. Controllers use left/right, south to ready/confirm, east to unlock/back, and Start to advance when the crew is ready. W/S or controller bumpers cycle the player count or bot difficulty. For three/four humans, controller mapping matches gameplay: controllers select players 3–4, keyboard selects players 1–2. The lobby preserves species, arena, player count, and difficulty across rematches but resets ready indicators. All species have equal gameplay stats. Reduced-motion preferences disable lobby sprite motion and transitions.

## Modes and content

- Classic PvP: 2 or 4 players, one-hit eliminations, first to ten round wins, simultaneous-death draws. 21 handcrafted arenas rotate from the selected starting arena; tide or lava rises after 25–34 seconds, with more exploration time in larger worlds.
- Bot practice: a navigating opponent that seeks usable pickups, jumps and drops between platforms, tracks the human, manages ammunition, fires with line of sight, and dodges incoming shots at normal/hard difficulty. Beginner and Easy give the player more reaction time, less accurate aim, short firing bursts, and recovery pauses without automatic dodging. Miniguns, charge weapons, and breaking cover respect the same difficulty timing. Navigation retains normal movement speed so all settings can reach platforms.
- Zombie survival: 1–4 local players, endless waves with increasing enemy health, damage, spawn pace, and wave size. Runners appear at wave 3 and brutes at wave 5. Alive enemies are capped at 48 for frame stability; total waves have no cap. PvP arena gaps become a continuous survival floor.
- Zombie health and ammo pickups, respawning equipment, kill rewards, 12-second upgrade breaks, escalating health/damage/speed purchase costs, and ammo refill between waves. Hold grab within 43 world pixels of a downed teammate for two seconds to revive them; bleed-out takes 18 seconds. Fallen teammates return at the next wave. Team wipe ends the run. Friendly fire is disabled; self explosions hurt.
- 22 weapons: pistol, shotgun, grenade, SMG, sniper, rocket launcher, bounce gun, flamethrower, railgun, crossbow, Bill Hammer, burst carbine, blunderbuss, minigun, prism laser, plasma cannon, Tesla fork, frost sprayer, acid lobber, billerang, proximity mine, and cluster launcher. Every weapon has a distinct attack, original sprite, ammo budget, reach, recoil, and firing sound. Rail shots pierce enemies and fragile cover but stop at permanent walls; bounce shots rebound up to five times.
- 21 arenas across four sizes (640×360, 960×540, 1280×720, and 1600×900). The original seven are remodeled with mixed materials, cover, and new layouts; 14 new arenas include forests, a glass conservatory, desert vault, freight yard, clockwork attic, crystal cavern, bathhouse, storm harbour, furnace line, observatory, sewer, sky orchard, volcanic locks, and iron cathedral. The largest has 6.25 times the original playable area. Arena selection uses three compact pages of seven, with arrows and keyboard/controller navigation across every page.
- Held jumps rise about 82 world pixels; tap jumps stay shorter, and holding jump controls descent. All 21 arenas have physics-based reachability and escape checks, including damaged layouts; see [arena audit](docs/level-audit.md).
- Wood, logs, rope, turf, leafy branches, brick, sandstone, stone, basalt, tiled floors, steel, cargo containers, conveyors, ice, and glass have distinct rendering. Closed doors and cover block bodies and shots. Grab near a door toggles it, including while armed; doors refuse to close onto players. Crates, barrels, trees, glass, and marked wooden barriers have damage and destruction. Barrels chain-react; destroyed terrain restores on a new round and never changes catalog data. Bots open doors and break cover; zombies can batter it down.
- Spring pads launch combatants; ice changes traction; conveyor surfaces carry players; lava pools and timed electrical coils require route choices. Survival removes fixed lethal pools and coils and fills floor gaps, retaining cover and traversal surfaces. All starting bodies are checked against solid geometry.
- A shared camera follows living players and downed teammates, zooms in when the group clusters, and expands when they spread out. Movement prediction and framing margins keep players, bills, and labels visible; zooming inward eases gradually. Eliminated bodies do not pull the camera away from the action.
- Flamethrower fire persists five seconds; lobbed acid pools persist eight and corrode metal as well as wood. Ice shots slow first and shatter on a second hit; impacts make slippery patches. Mines arm after landing and persist up to 25 seconds; explosions can hurt the owner. Plasma charges while held and launches on release; miniguns need spin-up and slow walking. Burst carbines consume three rounds across a timed salvo; blunderbusses have eleven short-range pellets and strong recoil; billerangs return and can be caught for reuse; Tesla arcs chain through nearby targets with line-of-sight checks; lasers strike instantly; cluster shells scatter four delayed bomblets. Persistent weapon fields spare co-op teammates.
- Higher-detail pixel sprites with recognizable species silhouettes, unique bills, player colours, weapon machining, and muzzle effects. A 1280×720 backing canvas renders a 640×360 viewport at 2× detail, with camera scaling over each arena’s world coordinates.
- Original layered chiptune music for the lobby, seven musical theme families across 21 arenas, survival, and game over; distinct weapon effects and six species calls. Bot practice keeps a steady 126 BPM across arena changes; zombie music grows with wave intensity. Separate music/effects sliders, mute, automatic focus pause, fullscreen, controller Start pause and disconnect pause.

Audio begins with a play or sound-button gesture, as required by browser autoplay rules. Gameplay continues if the browser blocks audio.

## Implementation and verification

Buildless JavaScript modules with a Canvas renderer and a fixed 60 Hz game simulation. Swept bullet collision prevents tunnelling. Combat resolves simultaneous deaths before scoring. The engine is independent of the DOM. Graph navigation routes bots and zombies across platform geometry.

- `npm test`: Engine, bot difficulty, camera, audio, and terrain regression checks, including expanded-world bounds, varied arena sizes, smooth zooming, player framing, constant practice beat spacing across 84 rounds, and bot combat and zombie pursuit in all 21 arenas, all 22 attacks, wall/piercing collisions, friendly fire, rewards, revival, bleed-out, team wipe, supplies, upgrades, and progression beyond wave 100.
- `npm run check`: syntax checks for all game and room-server JavaScript modules.
- `npm run test:levels`: physics-based escape/reachability checks for all 21 arenas in six intact/destruction configurations, both rooftop spawn regressions, jump/flutter behavior, sealed-courtyard detection, crouch tunnels, and doors.
- `npm run test:browser`: Playwright integration checks using the environment-provided Chromium and Playwright. Tests cover the three lobby screens, independent ready/unlock and species choices, back navigation, virtual controller-only setup, keyboard/mouse input, fullscreen, all player counts at seven viewport widths from 320–1440 pixels, viewport coverage with no surrounding page, controls overlay and pause restoration, movement/pickup/fire, active bots and steady music across 42 practice rounds, co-op upgrades, audio controls, controller disconnect, huge-world previews, camera zooming and framing during play, simultaneous-death rendering, all 21 arena previews, and all 22 weapon sprites and audible effects. Physical controller hardware and subjective soundtrack listening have not been tested.

The read-only `getSnapshot()` module export supports diagnostics. `?qa=1` enables explicit local test hooks for late-wave UI checks; normal play does not enable those hooks. Browser test screenshots are ignored by Git.

The only external page resource is an optional Google Fonts stylesheet; system fonts provide a fallback. Local game code, art, and sounds are self-contained. Online Versus uses the separate Node/WebSocket room service in `server/`.

## Private online rooms

The fullscreen main menu gains an Online entry when `dist/online-config.js` contains a reachable WSS endpoint. The Node server also serves the game directly and configures its own endpoint automatically. Production query parameters cannot override the configured server.

Online Versus supports 2–4 guests, six-character room codes, host arena choice, per-player species and ready state, first to ten, arena rotation, and rematches. Each browser uses its keyboard or first controller for one assigned character. The server runs the shared engine at 60 Hz; compressed snapshots arrive at 20 Hz. Movement uses local prediction, acknowledged input replay and remote interpolation. The server owns hits, ammo, terrain, deaths and scoring. Opening a menu releases inputs while the match continues. Seats survive disconnects for 30 seconds; a reloaded tab can rejoin via tab-scoped session storage. Leaving or an expired seat releases the player; hosting transfers when the host expires.

Run `npm ci --prefix server` and `npm run start:rooms`, then open `http://localhost:3001`. `npm run test:online` runs six real-WebSocket server integration checks and two prediction checks. `npm run test:online:browser` runs separate browser contexts through a ~120 ms round-trip delay relay and covers rooms, prediction, shared combat/cover/scores, reconnect/reload, rematches, four players, narrow layouts and graceful leave. `npm run check` covers the original modules, client networking and server syntax.

See [server/HOSTING.md](server/HOSTING.md) and `render.yaml` for deployment. Use one always-on service instance initially; rooms live in RAM and end when it restarts. Bot practice and zombie survival remain local in this first online milestone. Actual hosting capacity and cross-region latency have not been measured.

## Automated playthroughs and Jev

`npm run playtest` plays seeded matches across all arenas, modes, practice difficulties and weapons; `npm run playtest:browser` tests real browser controls and saves screenshots/traces. `npm run setup:jev` installs the pinned JevHarness runtime; `npm run playtest:jev` lets Jev drive the browser player once a TypeSafe or Vercel key is configured. `npm run playtest:jev:mock` validates the integration offline and is explicitly not live AI testing. See [playtesting instructions, reports and findings](docs/playtesting.md).
