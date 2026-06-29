# tribeapp.wtf

Hyperlocal flavor of the Tribe web client — the consumer-facing app at
[tribeapp.wtf](https://tribeapp.wtf). Doubles as the protocol's landing page.

The app talks to the Tribe protocol end-to-end. Identity is a Solana TID +
ed25519 app key, content lives in a tribe-hub mesh, fast follows ride the
ER sequencer. There is no bundled demo dataset — every screen renders live
protocol data and nothing else.

## Screenshots

### Landing Page

<table>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.49.27%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.50.35%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.50.40%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.50.46%E2%80%AFPM.png" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.50.54%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.07%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.14%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.20%E2%80%AFPM.png" width="100%"/></td>
  </tr>
</table>

### Onboarding

<table>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.26%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.33%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.38%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.43%E2%80%AFPM.png" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.51.52%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.02%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.06%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.10%E2%80%AFPM.png" width="100%"/></td>
  </tr>
</table>

### App

<table>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.18%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.24%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.29%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.36%E2%80%AFPM.png" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.40%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.48%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.52.55%E2%80%AFPM.png" width="100%"/></td>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.53.05%E2%80%AFPM.png" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="cover/Screenshot%202026-05-12%20at%2012.53.52%E2%80%AFPM.png" width="100%"/></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>

## What's in here

- **Landing page** (`/`) — pitch, feature tour, and a "the protocol is the
  point" section linking to the underlying repos (tribe-protocol, tribe-sdk,
  tribe-hub, tribe-er-server, tribe-twitter-app, root TribeEco).
- **Onboarding** (`/onboarding/connect`, `/city`, `/signup`) — wallet connect
  → register-or-recover TID on Solana → generate app key → optional username
  → pick a city. Funnels into `/home`.
- **App** (`/(app)/...`) — the in-app experience:

  | Route             | Description                                                                 |
  |-------------------|-----------------------------------------------------------------------------|
  | `/home`           | Per-tab hub feed: All / City channel / Mine                                 |
  | `/explore`        | Debounced cross-primitive hub search (tweets, users, channels)              |
  | `/map`            | Geo-anchored city channels (kind = 2 with lat / lng)                        |
  | `/tribes`         | Hub channels (`/v1/channels`); join state from `/v1/channels/member/:tid`   |
  | `/channels`       | Sub-channel browser                                                         |
  | `/chat`           | NaCl-box DMs over `/v1/dm/*`                                                |
  | `/profile`        | Hub user + karma + on-chain karma + own posts; in-place USER_DATA editor    |
  | `/notifications`  | `/v1/notifications/:tid` + locally-staged events                            |
  | `/wallet`         | SOL balance from the connected wallet + on-chain tip ledger                 |
  | `/create`         | Signed-envelope composer for tweets, events, polls, tasks, crowdfunds, channels |
  | `/settings`       | Settings + theme                                                            |

## Stack

| Layer        | Tech                                                   |
|--------------|--------------------------------------------------------|
| Framework    | Next.js 16 (App Router, webpack)                       |
| UI           | React 19, Tailwind CSS 4, shadcn/ui, Radix UI          |
| Animation    | Framer Motion                                          |
| State        | Zustand (with persistence)                             |
| Theming      | next-themes + city-dynamic accents                     |
| Solana       | `@solana/wallet-adapter-*`, `@solana/web3.js`, Anchor  |
| Crypto       | tweetnacl (ed25519 + nacl.box), blake3                 |
| Testing      | Vitest, Testing Library                                |

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>.

You'll need a hub + ER server reachable at the URLs in `.env`. The defaults
assume a local stack — run `bin/tribe start` from the parent repo.

### Cross-device dev (same Wi-Fi)

If your hub + ER server run on a different Mac on the same Wi-Fi, no `tribe`
install is needed on this dev laptop — just point two env vars at the LAN IP:

```bash
NEXT_PUBLIC_HUB_URL=http://192.168.1.6:4000
NEXT_PUBLIC_ER_SERVER_URL=http://192.168.1.6:3003
```

Use the **LAN IP**, not the `*.local` hostname — Chrome's `fetch()` trips on
macOS' IPv6 link-local record for `.local` names and surfaces
`ERR_ADDRESS_UNREACHABLE`.

Run `tribe share` on the machine running the hub to get the exact IP (it
prints them in this same shape so you can copy-paste). See the
[parent README](../Readme.md#cross-device-development-on-one-wi-fi)
for the full flow + troubleshooting.

## Environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | devnet | Solana JSON-RPC |
| `NEXT_PUBLIC_HUB_URL` | `http://localhost:4000` | Hub HTTP endpoint |
| `NEXT_PUBLIC_ER_SERVER_URL` | `http://localhost:3003` | ER server HTTP endpoint |
| `NEXT_PUBLIC_HUB_URLS` | (empty) | Comma-separated hubs for multi-node failover |
| `NEXT_PUBLIC_ER_SERVER_URLS` | (empty) | Comma-separated ER servers for multi-node failover |
| `NEYNAR_API_KEY` | (empty) | Optional Farcaster integration |
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
    (app)/                  # In-app routes (home, chat, tribes, …)
  components/               # UI primitives + feature components
  hooks/                    # Tribe-specific hooks (use-tribe-*, useHub*, etc.)
  lib/
    cities.ts               # Curated catalog of cities the app scopes to
    tribe/                  # Hub client (api, dm, channels, messages, onchain)
    …
  store/                    # Zustand stores (tribe, identity, notifications, ui)
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
| [tribe-twitter-app](../tribe-twitter-app) | The protocol-first reference client |
| [tribe-twitter](../tribe-twitter) | Native SwiftUI iOS client |

## Related Repos

| Repo | Description |
|------|-------------|
| [tribe-protocol](../tribe-protocol) | Solana programs (Anchor) — 12 programs: tid-registry, app-key-registry, username-registry, social-graph w/ ER delegation, hub-registry, tip-registry, crowdfund-registry, task-registry, channel-registry, karma-registry, poll-registry, event-registry |
| [tribe-sdk](../tribe-sdk) | TypeScript SDK — DirectSolana and EphemeralRollup providers; clients for identity, tweets, DMs, profiles, channels, bookmarks, polls, events, tasks, crowdfunds, tips, search |
| [tribe-hub](../tribe-hub) | Decentralized hub — signed-message storage + Solana indexer + gossip peer sync; REST + WebSocket APIs |
| [tribe-er-server](../tribe-er-server) | Ephemeral Rollup sequencer — instant follows, batched L1 settlement every 10s |
| [tribe-twitter-app](../tribe-twitter-app) | Next.js frontend — protocol-first reference client with multi-node failover |
| [tribeapp.wtf](../tribeapp.wtf) | Consumer-facing web app + landing page at tribeapp.wtf — hyperlocal social built entirely on the protocol |
| [tribe-twitter](../tribe-twitter) | Native SwiftUI iOS client (Twitter-shaped) — full read/write against hub + ER, NaCl-box DMs, BLAKE3 + ed25519 signing via Apple CryptoKit |
| [tribe-insta](../tribe-insta) | Native SwiftUI iOS client (Instagram-shaped) — photo grid, stories, reels; same hub + envelope format as tribe-twitter. Scaffolding stage — see `tribe-insta/PLAN.md` |
| [tribe-core-swift](../tribe-core-swift) | Shared Swift package consumed by tribe-twitter + tribe-insta — crypto (BLAKE3, NaCl box, ed25519 signing, BIP39, SolanaHD), backup file format, envelope signer. See `tribe-core-swift/MIGRATION.md` |
| [homebrew-tap](../homebrew-tap) | Homebrew formulas: `brew install tribe` (hub + ER) and `brew install tribe-twitter-app` (demo UI) |

## License

MIT
