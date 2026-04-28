# tribeapp.wtf

Hyperlocal flavor of the Tribe web client — the consumer-facing app at
[tribeapp.wtf](https://tribeapp.wtf). Doubles as the protocol's landing page.

The app ships with a full bundled seed dataset, so every screen can be explored
without running a backend. Wire it to a real hub + ER server (or talk straight
to Solana) by flipping a single env var.

## What's in here

- **Landing page** (`/`) — pitch, feature tour, and a "the protocol is the
  point" section linking to the underlying repos (tribe-protocol, tribe-sdk,
  tribe-hub, tribe-er-server, tribeapp.wtf, root TribeEco).
- **Onboarding** (`/onboarding/connect`, `/city`, `/signup`) — wallet connect,
  pick a city, optional profile setup. Funnels into `/home`.
- **App** (`/(app)/...`) — the in-app experience:

  | Route             | Description                                      |
  |-------------------|--------------------------------------------------|
  | `/home`           | Hyperlocal feed                                  |
  | `/explore`        | Discover people, tribes, places                  |
  | `/map`            | Map view of nearby activity                      |
  | `/tribes`         | Tribes you're in / can join                      |
  | `/channels`       | Group/community channels                         |
  | `/chat`           | DM list and threads                              |
  | `/profile`        | Your profile (karma, followers, following)       |
  | `/notifications`  | Activity from the hub                            |
  | `/wallet`         | Wallet view (tips, balances)                     |
  | `/create`         | Composer for tweets / events / tasks / polls    |
  | `/settings`       | Settings + theme                                 |

- **Conference** (`/conference`) — Devconnect demo with schedule, speakers,
  venues, and networking tabs. Used as a real-world demo of the hyperlocal flow.

## Stack

| Layer        | Tech                                                   |
|--------------|--------------------------------------------------------|
| Framework    | Next.js 16 (App Router, webpack)                       |
| UI           | React 19, Tailwind CSS 4, shadcn/ui, Radix UI          |
| Animation    | Framer Motion                                          |
| State        | Zustand (with persistence)                             |
| Theming      | next-themes + city-dynamic accents                     |
| Solana       | `@solana/wallet-adapter-*`, `@solana/web3.js`, Anchor  |
| Crypto       | tweetnacl (ed25519), blake3                            |
| Testing      | Vitest, Testing Library                                |

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>.

The app boots with `NEXT_PUBLIC_SEED_DATA=true` so every screen is wired to
in-repo dummy data — no API keys, no running hub or ER server required.

To run against a real backend, set `NEXT_PUBLIC_SEED_DATA=false` and point the
URLs at your nodes (see env vars below).

### Cross-device dev (same Wi-Fi)

If your hub + ER server run on a different Mac on the same Wi-Fi, no `tribe`
install is needed on this dev laptop — just paste two env vars into your local
`.env` (or `.env.local`). Use the **LAN IP**, not the `*.local` hostname —
Chrome's `fetch()` trips on macOS' IPv6 link-local record for `.local` names
and surfaces `ERR_ADDRESS_UNREACHABLE`. The IPv4 has no such hazard:

```bash
NEXT_PUBLIC_SEED_DATA=false
NEXT_PUBLIC_HUB_URL=http://192.168.1.6:4000
NEXT_PUBLIC_ER_SERVER_URL=http://192.168.1.6:3003
```

Run `tribe share` on the machine running the hub to get the exact IP (it
prints them in this same shape so you can copy-paste). See the
[parent README](../Readme.md#cross-device-development-on-one-wi-fi)
for the full flow + troubleshooting.

## Environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SEED_DATA` | `true` | Use bundled seed data instead of live backends |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | devnet | Solana JSON-RPC |
| `NEXT_PUBLIC_HUB_URL` | `http://localhost:4000` | Hub HTTP endpoint |
| `NEXT_PUBLIC_ER_SERVER_URL` | `http://localhost:3003` | ER server HTTP endpoint |
| `NEXT_PUBLIC_HUB_URLS` | (empty) | Comma-separated hubs for multi-node failover |
| `NEXT_PUBLIC_ER_SERVER_URLS` | (empty) | Comma-separated ER servers for multi-node failover |
| `NEYNAR_API_KEY` | (empty) | Optional Farcaster integration; blank stays on seed data |
| `NEXT_PUBLIC_NEYNAR_CLIENT_ID` | (empty) | Optional Farcaster client ID |
| `NEXT_PUBLIC_XMTP_ENV` | `production` | `dev` / `production` / `local` |

## Scripts

| Command              | Description                       |
|----------------------|-----------------------------------|
| `npm run dev`        | Start dev server (Next + webpack) |
| `npm run build`      | Production build                  |
| `npm run start`      | Serve production build            |
| `npm run lint`       | ESLint                            |
| `npm run test`       | Vitest suite                      |
| `npm run test:watch` | Vitest watch mode                 |

The `--webpack` flag in `dev` and `build` is required by Next.js 16.

## Project structure

```
src/
  app/
    page.tsx                # Landing page (protocol pitch + feature tour)
    layout.tsx
    onboarding/             # /connect, /city, /signup
    conference/             # Devconnect demo
    (app)/                  # In-app routes (home, chat, tribes, …)
  components/               # UI primitives + feature components
  lib/                      # Helpers (Solana, hub client, formatting)
  store/                    # Zustand stores
  hooks/
  seed/                     # Bundled dummy data driving the demo build
  types/
public/                     # Static assets
```

## Where this fits

`tribeapp.wtf` is one frontend on top of the Tribe protocol. It does not own
any state — identity lives on Solana, content lives in hubs, fast follows live
in the ER server. Swap any layer and this app keeps working.

| Repo | Role |
|---|---|
| [tribe-protocol](../tribe-protocol) | Solana programs (Anchor) — identity, app keys, usernames, social graph, hub registry |
| [tribe-sdk](../tribe-sdk) | TypeScript SDK shared by every client |
| [tribe-hub](../tribe-hub) | Decentralized hub — message storage, indexing, gossip |
| [tribe-er-server](../tribe-er-server) | Ephemeral Rollup sequencer — instant follows |
| [tribe-app](../tribe-app) | The protocol-first reference client |

## License

MIT
