# Automated Bill Brawl playtesting

Two harnesses play the game and save evidence. The fast simulation runner uses deterministic input agents. The browser runner operates the real lobby, keyboard/controller handlers, renderer, audio loop, and game updates. The Jev integration plugs the actual [JevHarness](https://github.com/TianyuCodings/JevHarness) Python runtime into that browser runner.

## Run the checks

```bash
npm run playtest
npm run playtest:soak
npm run playtest:browser
```

The default simulation run has 212 scenarios: all 21 arenas in duel, four-player party, four practice difficulties, and one/two-player survival, plus each of the 22 weapons in PvP and survival with controlled starting loadouts. PvP rotates through arenas naturally; a scenario's arena is its starting arena, and failures also record the actual arena and round. The default runs one seed for up to 45 simulated seconds per scenario; the soak uses three seeds and 120 seconds. Terminal matches/wipes end an episode early.

```bash
npm run playtest -- --seconds 60 --seeds 2
npm run playtest -- --case practice-easy-8 --seed 1 --seconds 60
npm run playtest -- --arena 12 --seconds 90
npm run playtest -- --replay artifacts/playtest/practice-easy-8-seed-1.json
npm run playtest:browser -- --all --seconds 30 --video
```

Reports go to ignored `artifacts/playtest/` and `artifacts/playtest-browser/`: JSON, readable Markdown, state history, failure input recordings, screenshots, Playwright traces, and optionally videos. `--out` chooses a different folder. Failure replay uses recorded inputs and seeded game randomness. Replaying against changed source can produce a different outcome; that is useful for verifying fixes, but is not an exact replay of the old engine.

The deterministic checks flag non-finite physics/entity state, living players outside world bounds, solid-body overlaps, invalid ammo/health/scores, exceeded entity caps, and camera loss. Movement stalls are marked **REVIEW**, not automatically declared level traps: an automated player can choose a bad route. Failures exit nonzero; `--strict` also fails on review findings. A generated report with no failures is evidence for the played scenarios, not proof that every possible play sequence is safe or that the game feels balanced.

The browser defaults to four cases: rooftop keyboard PvP, Timberline practice, huge Foundry co-op, and mobile-sized Glasshouse with virtual controllers. It changes only inputs during play. Install Playwright/Chromium on another machine (`npm install --no-save playwright`, then `npx playwright install chromium`); use `BILL_BRAWL_CHROMIUM` for its browser executable. `BILL_BRAWL_PLAYWRIGHT` optionally specifies the module path. This workspace already has both tools. `?qa=1` is used only for read-only game observations; the harness does not invoke wave cheats or relocate players.

## JevHarness setup

```bash
npm run setup:jev
npm run test:jev
npm run playtest:jev:mock -- --seconds 12
```

Setup installs the reviewed upstream commit `34d5c9602f6f73792e2c625cc31dd9ed7b4f39b5` in ignored `.jev-runtime/`. Python 3.11+ and Git are required. The actual `auto_jev.spec.validate_spec`, `PipelineRuntime`, and `JevClient` execute the v2 [pipeline](../scripts/playtest/jev/pipeline.json). This uses expression/Jev nodes on Linux; it does not bypass the upstream restriction on functional Python node sandboxes.

Mock mode verifies action plumbing, requests, normalized responses, and complete traces. It is **not live Jev**, and its decisions provide no evidence of Jev's gameplay quality. The mock provider selects simple canned answers and is labeled `mock-wiring-only` in each saved decision.

For live decisions, configure **one** provider credential in the local shell or environment's secret manager:

| Provider | Credential | Transport setting |
| --- | --- | --- |
| TypeSafe direct (default) | `TYPESAFE_API_KEY` | `BILL_BRAWL_JEV_TRANSPORT=typesafe` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `BILL_BRAWL_JEV_TRANSPORT=vercel` |

Obtain a key through the chosen provider's account/dashboard. Keep it out of game assets, source control, screenshots, and reports. Then run:

```bash
npm run playtest:jev -- --seconds 20
```

This controls P1 with Jev; P2 uses the independent scripted agent or the game's practice bot. It allows ten decisions per browser case, up to 40 logical Jev requests for the four-case pilot. Inputs are held in 250 ms chunks while the real game keeps running. The provider may retry transient request failures internally. `BILL_BRAWL_JEV_MAX_CALLS` controls the worker's hard logical-request limit; `--decisions` controls the per-case decision count. Increase both explicitly for larger runs. `BILL_BRAWL_JEV_PYTHON` can point at an existing environment with this pinned runtime installed.

The initial policy prioritizes movement, jumps/drop-throughs, doors, pickups, combat, and co-op revival. Code supplies current camera-visible positions, terrain, pickups, hazards, and recent movement. Jev selects among nine validated input actions and separately suggests a concern category. The adapter cannot edit health, geometry, scoring, RNG, or test outcomes. Only an ordinary game input plan reaches the game. A provider timeout or missing key blocks the run and is recorded as model infrastructure, without substituting a scripted answer and calling it Jev.

`artifacts/jev/decisions.jsonl` retains complete runtime observations, Jev questions, normalized answers, node timing, provider metadata, and usage. Browser inputs, screenshots, traces, and reports are in `artifacts/jev-browser/`. Runtime usage records distinguish unpriced calls from reported cost; absent provider price data does not imply free inference. Jev concern suggestions require investigation; the separate deterministic evaluator determines confirmed failures.

The checked-in [policy manifest](../scripts/playtest/jev/policy-lock.json) binds the initial spec, adapter, evaluator, and game rules by hash. `npm run freeze:jev` refreshes it after reviewing changes. This is an initial fixed policy, not a reflection-optimized or live-evaluated champion. No paid authoring/reflection experiment or GEPA search runs here. The hosted model alias can change; the source manifest does not lock provider weights. Stored decisions preserve observed behavior.

## Findings from the first run

The initial 424-playthrough run found two reproductions of the same bug after practice matches starting in Glasshouse rotated to Clockwork Attic. A character straddling a solid wooden pillar and a neighboring one-way rafter could use down+jump to drop into the pillar. Drop eligibility now requires no solid support under the same feet. The recorded failing input sequence passes with that correction; a focused regression covers the shared movement used by local games and online prediction.

After the correction, the same 424 playthroughs passed: 1,275,440 simulation ticks (about 5.9 simulated hours), 39,527 shots, and all 22 weapons fired. Four scripted browser cases passed. Four JevHarness browser cases passed with ten **mock** decisions each. Live Jev results are pending a provider key; neither key was configured in the work environment. These current arenas/seeds are regression evidence, not a fresh held-out AI benchmark or evidence of improved balance.

The full 126 arena/configuration escape audit also passed after the drop correction, along with the standard unit suites, server/prediction checks, and four-browser online integration. `npm run test:playtest` tests repeatable seeded runs, recorded input replay, deliberately injected numerical/collision faults, and the model input contract. `npm run test:jev` verifies the upstream runtime, visible-observation boundary, legal actions, frozen resource hashes, budget exhaustion, and missing-key behavior.
