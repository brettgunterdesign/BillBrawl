# Arena movement and escape audit

The reported Rooftop Rumble trap was reproduced with the game physics. A held jump rose only 59.43 world pixels, below the first 60-pixel balcony; its solid underside also blocked jumps from the starting alcove. Other maps had interrupted upper routes and courtyards that depended on destructible crates for escape.

## Repairs

Player jump speed is now 380 world pixels/second, producing an 81.79-pixel held jump (about 38% higher). Tap jumps remain shorter, and holding jump still slows descent. Bot navigation uses a conservative rise budget derived from the actual jump speed.

| Arena | Layout repair |
| --- | --- |
| DOCKSIDE | Existing layout; benefits from the increased jump clearance. |
| ROOFTOP RUMBLE | Thinner pass-through starting balconies; direct jump exits on both sides. |
| PUMP STATION | Existing layout; benefits from the increased jump clearance. |
| SUNKEN TEMPLE | Permanent stone footholds in the central courtyard; escape survives lost crates. |
| NEON NIGHT MARKET | Existing layout; benefits from the increased jump clearance. |
| FROSTBITE COVE | Existing layout; benefits from the increased jump clearance. |
| EMBER WORKS | Existing layout; benefits from the increased jump clearance. |
| TIMBERLINE TREETOPS | Permanent steps inside the two tall tree trunks; escape survives lost crates. |
| GLASSHOUSE | Existing layout; benefits from the increased jump clearance. |
| MOLTEN LOCK | Existing layout; benefits from the increased jump clearance. |
| SANDSTONE VAULT | Existing layout; benefits from the increased jump clearance. |
| FREIGHT YARD | Side loading ledges connect container roofs to the upper cargo routes. |
| CLOCKWORK ATTIC | Existing layout; benefits from the increased jump clearance. |
| CRYSTAL CAVERN | Existing layout; benefits from the increased jump clearance. |
| BAMBOO BATHHOUSE | Existing layout; benefits from the increased jump clearance. |
| STORMPIER | Hanging side ledges connect the upper harbour routes. |
| FURNACE RUN | Existing layout; benefits from the increased jump clearance. |
| MOONBILL OBSERVATORY | Stone inspection steps let players cross the glass dividers without ammunition. |
| SEWER CIRCUIT | Existing layout; benefits from the increased jump clearance. |
| SKY ORCHARD | Existing layout; benefits from the increased jump clearance. |
| FOUNDRY CATHEDRAL | Side balconies connect the upper wings. |

## Repeatable checks

Run `npm run test:levels` after any terrain or movement change. `npm run audit:levels` prints per-arena coordinates for unreachable areas and traps. For a particular arena, run `node scripts/audit-levels.mjs --arena 1`. The CLI also accepts `--zombie` and `--variant platforms`, `cover`, or `destroyed`.

The audit samples safe standing and crouching regions on every terrain and object top, using a 24-pixel horizontal grid plus collision boundaries. It simulates walking, jumping, fluttering, reversing in the air, delayed horizontal jumps, crouching, and dropping through platforms at 60 Hz. Simulations use the game's shared movement and spring physics. Doors can be opened with grab during walking; jumping can reach closed door tops. No weapons, destruction, or ammunition are needed to traverse intact maps. Hazard crossings are rejected; lava, acid, electric areas, and falling off the world remain intentional dangers.

A directed graph checks all four spawn positions. In intact maps, every safe region must be reachable from every spawn and offer a return route. Damaged maps may lose access to upper decks, but every remaining standing region must offer an escape back to each player's connected starting area, including decks a player could have occupied before destruction.

The suite audits all 21 arenas in six configurations: intact PvP, intact survival, all fragile platforms removed, fragile platforms and short cover removed with tall obstacles still intact, all breakable terrain removed, and survival with fragile platforms and short cover removed. Removing short cover specifically tests whether crates or barrels were the only escape step. A sealed-courtyard fixture must fail; a crouch-only tunnel with a closed door must pass. Both rooftop floor spawns also receive a direct jump regression test, and a browser test exercises the real keyboard controls.

This is a sampled movement audit, not an exhaustive proof over every possible input sequence or combination of destruction. The six configurations cover the identified trap mechanisms. Regular gameplay tests additionally check bots, zombie pursuit, terrain interactions, and network prediction.

## Verification result

All 126 arena/configuration audits passed. Both rooftop jump regressions, the jump/flutter check, and the audit's sealed-courtyard and crouch/door fixtures passed. The standard gameplay and online/prediction suites passed (60 checks), as did the complete local-game and four-browser online integration suites. The browser check visibly places both rooftop players on their first balconies after a normal held jump.
