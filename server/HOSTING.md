# Put Bill Brawl online with Render

The browser game and private-room server are implemented. The existing ChatGPT Site serves static files; internet matches need this additional running Node service. Render Web Services support WSS and TLS. Use a paid, always-on service so the room server does not sleep. This repository's `render.yaml` uses Starter and one instance. Review Render's current price before provisioning: https://render.com/pricing.

## Live service

- Room server and standalone game: https://bill-brawl-rooms.onrender.com
- Health check: https://bill-brawl-rooms.onrender.com/health
- Public WebSocket endpoint: `wss://bill-brawl-rooms.onrender.com/ws`
- Existing browser game: https://bill-brawl.brettgunter18.chatgpt.site
- Source: https://github.com/brettgunterdesign/BillBrawl

The browser endpoint is configured in `dist/online-config.js`. The service allows the existing Site origin and its own origin. Automatic deploys remain disabled; a server restart ends active rooms.

## Deploy

1. Connect the existing `brettgunterdesign/BillBrawl` GitHub repository, which includes `dist/`, `server/`, root `package.json`, `render.yaml`, and documentation. Do not set the service's root directory to `server`: the engine modules are in `dist`.
2. Sign in to https://dashboard.render.com and connect that repository. Choose **New → Blueprint** and select `render.yaml`. Alternatively choose **New → Web Service**, Node runtime, build command `npm ci --prefix server`, start command `node server/index.mjs`, health check `/health`, and one paid Starter instance.
3. Choose a region near the players. Set `NODE_VERSION=22` and `ALLOWED_ORIGINS=https://bill-brawl.brettgunter18.chatgpt.site`. Render supplies `PORT`; the server binds `0.0.0.0`. The Blueprint sets these values for you. Deploy manually; automatic deploys are disabled to avoid interrupting games during code pushes.
4. Open the actual service URL Render returns. `/health` must return `{"ok":true,"protocol":1,"modes":["versus","zombie"],"arenas":21,"rooms":0}` (the room count changes during play). The service URL itself also serves Bill Brawl with online play already enabled, using its own `/ws` endpoint. Test Create → share the six-character room code → Join → ready both players → Brawl in separate browsers.
5. Send the returned HTTPS service URL back in this conversation. I can set `dist/online-config.js` to its corresponding `wss://<actual-host>/ws` endpoint and publish it to the existing Bill Brawl Site. There is no secret in this public endpoint. Do not invent a hostname or configure the live game before the service is reachable.

## What ships

- Versus for 2–4 guests and Survival for 1–4 guests in private six-character rooms; no game accounts required. Choose MODE in the room, ready every player, and start.
- Host arena selection, six cosmetic species, per-player ready state, first to ten, rotating arenas, and rematches in the same room.
- Authoritative 60 Hz movement/combat/terrain/scoring, 20 Hz compressed snapshots, input sequence acknowledgements, local movement prediction and reconciliation, and interpolation of other players and projectiles.
- Keyboard or the first controller controls one assigned character per browser. In online menus, controller up/down moves focus; left/right adjusts species and the host’s mode/arena selectors; bumpers also cycle species. South confirms or readies, Start launches for the host, and east unreadies or leaves. The controller keyboard supports name and room-code entry. Opening a menu releases held controls while the room continues.
- Automatic reconnect with a 30-second reserved seat; a tab reload can rejoin using tab-scoped session storage. Leave releases the seat; an expired host transfers hosting. Closed rooms are removed. All room state is in RAM: service restarts end active rooms.
- Online Survival shares endless waves, zombie AI, health, ammo, hold-grab revives, points, terrain and upgrades. Every player buys only their own upgrades; the host can start a wave early, or the break advances automatically after 12 seconds. A team wipe returns players to the same room for a fresh run. Expired or departed seats stay eliminated; the remaining team can continue alone, and subsequent waves scale to the remaining seats.
- Bot practice remains local. There is no public matchmaking, account system, spectators, rollback hit compensation, or cross-region routing yet.

## Operations

Run a single service instance. Room codes and reconnect seats live in that process; adding replicas without routing and shared room coordination would split rooms. Do not enable horizontal autoscaling yet. The initial cap is 32 rooms, four guests each, with payload, message-rate, input-queue, and send-buffer limits. This is a private-room beta; the capacity of a specific hosting plan still needs production load measurements.

The server accepts the configured Site origin and its own served origin. Local development uses `npm ci --prefix server` then `npm run start:rooms` and opens `http://localhost:3001`. Local integration tests can use a `?rooms=ws://localhost:<port>/ws` override; that override is ignored on public hosts. Set `ALLOWED_ORIGINS` to a comma-separated list if you add another game origin. No deployment tokens or cloud credentials belong in `dist`, `render.yaml`, or the source bundle.

## Checks

```sh
npm ci --prefix server
npm run check
npm test
npm run test:online
npm run test:online:browser
```

The browser command uses the workspace's provided Playwright/Chromium. It runs independent browser contexts through a relay with 60 ms delay in each direction and verifies prediction, synchronization, reconnects, rematches, four players, menus, and leave handling. These local tests do not establish real-world latency or a deployed server's capacity.

Render references: https://render.com/docs/websocket and https://render.com/docs/deploy-node-express-app.

## Update the existing service for online Survival

The service has manual deployments enabled. After the new source is pushed, open **bill-brawl-rooms → Manual Deploy → Deploy latest commit** in the Render dashboard. Wait for the deployment to become Live; `/health` must list `"modes":["versus","zombie"]`. Refresh the game, choose **Online → Create → Mode: Survival**, share the room code, ready everyone, and select **Survive**. Deployment restarts the server and ends active rooms. The published client remains compatible with the previous Versus server and enables Survival only when the server advertises support.
