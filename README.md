# tribeapp.wtf

Demo build of the Tribe web UI — a hyperlocal social experience that runs entirely
off bundled seed/dummy data so it can be explored without any backend setup.

This is the `tribeapp.wtf` flavor of the Tribe web client, packaged as a
TribeEco submodule.

## Stack

| Layer     | Tech                                   |
|-----------|----------------------------------------|
| Framework | Next.js 16 (App Router, webpack)       |
| UI        | React 19, Tailwind CSS 4, shadcn/ui    |
| Animation | Framer Motion                          |
| State     | Zustand (with persistence)             |
| Theming   | next-themes + city-dynamic accents     |
| Testing   | Vitest, Testing Library                |

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>.

The app boots with `NEXT_PUBLIC_SEED_DATA=true` so every screen is wired to
in-repo dummy data — no Farcaster / Neynar / XMTP keys are required.

## Scripts

| Command            | Description                       |
|--------------------|-----------------------------------|
| `npm run dev`      | Start dev server                  |
| `npm run build`    | Production build                  |
| `npm run start`    | Serve production build            |
| `npm run lint`     | ESLint                            |
| `npm run test`     | Vitest suite                      |
| `npm run test:watch` | Vitest watch mode               |
