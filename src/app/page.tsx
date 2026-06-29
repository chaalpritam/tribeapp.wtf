"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Users,
  Calendar,
  Heart,
  Wallet,
  MessageCircle,
  ArrowRight,
  Coins,
  BarChart3,
  CheckCircle,
  Banknote,
  Share2,
  ImagePlus,
  Bell,
  Map,
  Shield,
  Zap,
  Globe,
  Star,
  Github,
  KeyRound,
  Database,
  Server,
  Layers,
  Lock,
  Hash,
  Radio,
  Code2,
  ExternalLink,
  Store,
  Newspaper,
  Terminal,
  ArrowDown,
  Fingerprint,
  Network,
  Cpu,
  Package,
  Smartphone,
  ChevronRight,
  Box,
  GitBranch,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cities as allCities } from "@/lib/cities";

// ─── Data ──────────────────────────────────────────────────────────────────

const keyConcepts = [
  {
    icon: Fingerprint,
    term: "TID (Tribe ID)",
    definition:
      "A unique 64-bit number minted on Solana. Each TID has a custody wallet (signs daily actions) and a recovery wallet (reclaims the TID if the custody key is lost). No email, no password — just keys you own.",
  },
  {
    icon: KeyRound,
    term: "App Keys",
    definition:
      "Scoped ed25519 signing keys delegated by your TID. Your main wallet stays safe; the app signs messages with a device-specific key. Keys can be revoked, rotated, or scoped to just tweets, social, or read-only.",
  },
  {
    icon: Hash,
    term: "Signed Messages",
    definition:
      "Every action — tweet, reaction, follow, DM, poll vote, RSVP — is a protobuf envelope signed with your app key and hashed with BLAKE3. The hub validates the signature against on-chain app key records before accepting anything.",
  },
  {
    icon: Server,
    term: "Hub",
    definition:
      "A Fastify + Postgres node anyone can run. It stores signed messages, indexes Solana events (follows, TID registrations), and gossips with peer hubs. No central server owns the data.",
  },
  {
    icon: Zap,
    term: "Ephemeral Rollup",
    definition:
      "A sequencer that accepts follow/unfollow intents signed by your custody wallet, confirms them instantly (~50 ms), then batches them to Solana L1 every 10 seconds. You see 'Following' immediately; the chain catches up.",
  },
  {
    icon: Lock,
    term: "End-to-end DMs",
    definition:
      "Each user publishes an x25519 pubkey on the hub. DMs are sealed with nacl.box (XSalsa20-Poly1305). The hub stores ciphertext — it never sees plaintext. Group DMs encrypt per recipient.",
  },
];

const solanaPrograms = [
  { name: "tid-registry", desc: "Mints TIDs, tracks custody + recovery addresses" },
  { name: "app-key-registry", desc: "Registers, revokes, and rotates app signing keys" },
  { name: "username-registry", desc: "Human-readable .tribe usernames bound to TIDs" },
  { name: "social-graph", desc: "PDA-per-relationship follow graph + ER delegation" },
  { name: "hub-registry", desc: "On-chain hub discovery — URL, gossip key, heartbeat" },
  { name: "tip-registry", desc: "On-chain tip receipts with SOL transfer in one ix" },
  { name: "crowdfund-registry", desc: "Campaign escrow — pledge, claim, or refund" },
  { name: "task-registry", desc: "Local tasks with optional reward escrow" },
  { name: "channel-registry", desc: "First-registration ownership of channel slugs" },
  { name: "karma-registry", desc: "Trustless karma from on-chain tip + task proofs" },
  { name: "poll-registry", desc: "One-vote-per-TID polls with 8-slot tally" },
  { name: "event-registry", desc: "Events with one-RSVP-per-TID and lat/lng" },
];

const dataFlowSteps = [
  {
    step: "01",
    title: "User signs a message",
    detail:
      "The app builds a MessageData payload (type, TID, timestamp, body). The ed25519 app key signs the BLAKE3 hash. This produces a TribeMessage envelope.",
    icon: Fingerprint,
  },
  {
    step: "02",
    title: "Hub validates and stores",
    detail:
      "The hub fetches the TID's app key record from Solana, verifies the ed25519 signature, checks the BLAKE3 hash, and writes the envelope to Postgres.",
    icon: Shield,
  },
  {
    step: "03",
    title: "Hub gossips to peers",
    detail:
      "Every 5 seconds each hub broadcasts 'have' frames (hashes of recent messages). Peer hubs reply with 'want' for any they're missing. Full envelopes flow back.",
    icon: Radio,
  },
  {
    step: "04",
    title: "Clients get real-time updates",
    detail:
      "Apps subscribe to the hub WebSocket (/v1/ws). New validated messages are pushed immediately — no polling, no central broker.",
    icon: Activity,
  },
];

const architectureLayers = [
  {
    icon: Smartphone,
    name: "Applications",
    repo: "tribe-twitter-app · tribeapp.wtf · tribe-twitter",
    color: "#f5f5f5",
    description:
      "Next.js web clients and a native SwiftUI iOS app. All build signed envelopes locally — the hub never receives plaintext intent.",
  },
  {
    icon: Code2,
    name: "TypeScript SDK",
    repo: "tribe-sdk",
    color: "#f0f0f0",
    description:
      "Single entry-point client covering identity, social graph, tweets, DMs, channels, bookmarks, polls, events, tasks, crowdfunds, tips, search, karma, and notifications. Published as @tribe-protocol/sdk.",
  },
  {
    icon: Server,
    name: "Decentralized Hub",
    repo: "tribe-hub",
    color: "#ebebeb",
    description:
      "Fastify + Postgres node that stores validated signed envelopes, indexes Solana events via WebSocket subscription + startup backfill, and syncs with peers over a pull-based gossip protocol.",
  },
  {
    icon: Zap,
    name: "Ephemeral Rollup Sequencer",
    repo: "tribe-er-server",
    color: "#e6e6e6",
    description:
      "Accepts follow/unfollow intents signed by custody wallets, confirms instantly (optimistic), batches follow_delegated / unfollow_delegated instructions, and settles to L1 every 10 seconds.",
  },
  {
    icon: Layers,
    name: "Solana Programs (12)",
    repo: "tribe-protocol",
    color: "#e0e0e0",
    description:
      "Anchor programs for identity (TID, app keys, usernames), social graph with ER delegation, hub discovery, tips, crowdfunds, tasks, channel ownership, karma, polls, and events.",
  },
];

const protocolPrimitives = [
  {
    icon: KeyRound,
    title: "TIDs and app keys",
    description:
      "Wallet-recoverable Tribe IDs registered on Solana, with rotatable per-device app signing keys.",
  },
  {
    icon: Hash,
    title: "Tweets, channels, polls",
    description:
      "Signed message envelopes for posts, channels, polls, events, tasks, crowdfunds, and tips.",
  },
  {
    icon: Lock,
    title: "End-to-end DMs",
    description:
      "x25519 + xsalsa20-poly1305 ciphertext on the wire. Hub never sees plaintext. Group DMs via per-recipient fanout.",
  },
  {
    icon: Radio,
    title: "Hub gossip",
    description:
      "Pull-based replication between independent hubs. Run your own; messages catch up on connect.",
  },
  {
    icon: Star,
    title: "On-chain reputation",
    description:
      "Karma rolls up tips received and completed tasks per TID — proofs are trustless and public.",
  },
  {
    icon: Code2,
    title: "Open SDK",
    description:
      "TypeScript client covering identity, social, DMs, channels, polls, events, tasks, crowdfunds, tips.",
  },
];

const repos = [
  {
    name: "tribeeco",
    description: "Mono-repo with all submodules and the tribe CLI.",
    url: "https://github.com/chaalpritam/tribeeco",
  },
  {
    name: "tribe-protocol",
    description: "12 Solana programs (Anchor): TID, app keys, usernames, social graph, and more.",
    url: "https://github.com/chaalpritam/tribe-protocol",
  },
  {
    name: "tribe-sdk",
    description: "TypeScript SDK for the whole protocol — @tribe-protocol/sdk.",
    url: "https://github.com/chaalpritam/tribe-sdk",
  },
  {
    name: "tribe-hub",
    description: "Decentralized hub: Fastify + Postgres + Solana indexer + gossip.",
    url: "https://github.com/chaalpritam/tribe-hub",
  },
  {
    name: "tribe-er-server",
    description: "Ephemeral Rollup sequencer for instant follows.",
    url: "https://github.com/chaalpritam/tribe-er-server",
  },
  {
    name: "tribe-twitter",
    description: "Native SwiftUI iOS client with NaCl-box DMs and BLAKE3 signing.",
    url: "https://github.com/chaalpritam/tribe-twitter",
  },
  {
    name: "tribeapp.wtf",
    description: "This frontend — Next.js + Solana wallet adapter.",
    url: "https://github.com/chaalpritam/tribeapp-wtf",
  },
];

const buildExamples = [
  {
    icon: Store,
    title: "Hyperlocal Marketplaces",
    description: "Build peer-to-peer commerce, local service directories, or neighborhood rental networks using the protocol's tasks and payments primitives.",
  },
  {
    icon: Newspaper,
    title: "Community Media",
    description: "Create specialized news feeds, local journalism platforms, or interest-based forums with built-in tipping and karma.",
  },
  {
    icon: Users,
    title: "Niche Social Networks",
    description: "Launch dedicated platforms for gamers, hobbyists, or professionals utilizing verifiable identity and the open social graph.",
  },
  {
    icon: Shield,
    title: "Governance & DAOs",
    description: "Develop neighborhood treasuries, local governance interfaces, or community voting systems using signed polls and Solana.",
  },
  {
    icon: Banknote,
    title: "Crowdfunding Portals",
    description: "Build mutual aid networks, local project funding, or transparent charity platforms leveraging the native value transfer.",
  },
  {
    icon: Terminal,
    title: "Developer Tools",
    description: "Create analytics dashboards, alternative clients, indexers, or automation bots that plug directly into the open protocol.",
  },
];

const steps = [
  {
    step: "01",
    title: "Pick Your City",
    description:
      "Choose from cities like Bangalore, Mumbai, San Francisco, London, and more. Each city has its own thriving community.",
    icon: Globe,
  },
  {
    step: "02",
    title: "Create Your Profile",
    description:
      "Set up your profile to unlock tipping, crowdfunding, and community reputation features.",
    icon: Users,
  },
  {
    step: "03",
    title: "Join Your Tribes",
    description:
      "Find communities that match your interests — cycling, food, tech, art, music, gaming, and 10+ more categories.",
    icon: Users,
  },
  {
    step: "04",
    title: "Start Contributing",
    description:
      "Post tweets, create events, run polls, help with tasks, fund causes, and earn karma to build your reputation.",
    icon: Zap,
  },
];

const features = [
  {
    icon: Heart,
    title: "Social Feed",
    description:
      "Share photo tweets, like and comment on posts, bookmark your favorites, and build a following in your neighborhood.",
  },
  {
    icon: Coins,
    title: "Tipping",
    description:
      "Tip creators directly. Choose from preset amounts and see your tip history.",
  },
  {
    icon: Calendar,
    title: "Local Events",
    description:
      "Discover meetups, cleanups, workshops, and festivals happening nearby. Create events and track RSVPs.",
  },
  {
    icon: BarChart3,
    title: "Community Polls",
    description:
      "Ask your community anything. Create multi-option polls and watch the votes come in real-time.",
  },
  {
    icon: CheckCircle,
    title: "Local Tasks",
    description:
      "Need help moving? Looking for a dog walker? Post tasks with optional rewards for community helpers.",
  },
  {
    icon: Banknote,
    title: "Crowdfunding",
    description:
      "Rally your neighborhood behind a cause. Fund community gardens, local art projects, or neighborhood repairs.",
  },
];


// ─── Component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const getDestination = () => {
    if (!isAuthenticated) return "/onboarding/connect";
    const savedCity = typeof window !== "undefined" ? localStorage.getItem("tribe-selected-city") : null;
    if (!savedCity) return "/onboarding/city";
    return "/home";
  };

  const destination = getDestination();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Floating Navigation */}
      <nav className="fixed right-8 top-8 z-50 flex items-center">
        <div className="flex items-center gap-1 rounded-full bg-[#f5f5f5]/60 p-1.5 backdrop-blur-md nav-pill-shadow transition-all hover:bg-[#f5f5f5]/80">
          <Link href="/" className="px-5 py-2.5 text-[14px] font-medium text-black transition-colors hover:text-black/60">
            What
          </Link>
          <Link href="#why" className="px-5 py-2.5 text-[14px] font-medium text-black transition-colors hover:text-black/60">
            Why
          </Link>
          <Link href="#concepts" className="px-5 py-2.5 text-[14px] font-medium text-black transition-colors hover:text-black/60">
            How
          </Link>
          <Link href="#architecture" className="px-5 py-2.5 text-[14px] font-medium text-black transition-colors hover:text-black/60">
            Architecture
          </Link>
          <Link href="#build" className="px-5 py-2.5 text-[14px] font-medium text-black transition-colors hover:text-black/60">
            Build
          </Link>
          <Link
            href={destination}
            className="rounded-full bg-primary px-7 py-2.5 text-[14px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            {isAuthenticated ? "Open" : "Get"}
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-[1200px] px-8 py-24 sm:py-32">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 flex justify-center"
        >
          <span className="text-[32px] font-black tracking-[-1.5px]">tribe</span>
        </motion.div>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section id="what" className="mb-48 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider"
          >
            <Layers className="h-3.5 w-3.5" />
            Open social protocol on Solana
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[900px] text-[64px] font-bold leading-[1.05] tracking-[-3.5px] sm:text-[96px]"
          >
            The hyper-local <br />
            social network.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="mx-auto mt-10 max-w-[640px] text-[20px] font-medium leading-[1.6] text-[#666] sm:text-[24px]"
          >
            Connect with your neighborhood. Discover local events, join tribes,
            and build trust where you live — on a protocol you own.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href={destination}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-5 text-xl font-bold text-white transition-all hover:scale-[1.05] active:scale-95 shadow-xl shadow-primary/20"
            >
              {isAuthenticated ? "Open App" : "Get started"} <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-10 py-5 text-xl font-bold text-black transition-all hover:bg-[#efefef]"
            >
              See the architecture <ArrowDown className="h-5 w-5" />
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-20 grid max-w-[700px] grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              { value: "12", label: "Solana programs" },
              { value: "100%", label: "Open source" },
              { value: `${allCities.filter((c) => c.id !== "bangalore").length}`, label: "Cities" },
              { value: "MIT", label: "License" },
            ].map((s) => (
              <div key={s.label} className="rounded-[20px] bg-[#f5f5f5] px-5 py-4 text-center">
                <div className="text-2xl font-black tracking-tight">{s.value}</div>
                <div className="mt-0.5 text-[12px] font-bold uppercase tracking-wider text-[#999]">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── What is Tribe? (plain-English explainer) ─────────────────── */}
        <section id="why" className="mb-48">
          <div className="mb-16">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] text-black sm:text-[56px]">
              What is Tribe, exactly?
            </h2>
            <p className="mt-6 max-w-[680px] text-[20px] font-medium leading-[1.6] text-[#666]">
              Tribe is a decentralized social protocol on Solana — like email, but for social. Anyone can run a node, build a client, or read the source. No company controls who can post or who can see what.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Fingerprint,
                title: "You own your identity",
                body: "Your account is a Solana keypair — no email, no password, no company that can deactivate you. Your TID and all your content go wherever you go.",
              },
              {
                icon: Database,
                title: "No single server",
                body: "Content lives across a mesh of independent hubs that gossip with each other. If one goes down, the others still have the data. Run your own hub on a $5 VPS or a Raspberry Pi.",
              },
              {
                icon: GitBranch,
                title: "Fork the client",
                body: "tribeapp.wtf is just one frontend. The protocol is open. Build a different UI, a mobile app, a CLI, a bot — they all speak the same signed-message format and talk to the same hubs.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-[40px] bg-[#f5f5f5] p-10 transition-all hover:bg-[#efefef]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-sm">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-bold tracking-tight">{item.title}</h3>
                <p className="text-[17px] font-medium leading-[1.5] text-[#666]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Key Concepts ─────────────────────────────────────────────── */}
        <section id="concepts" className="mb-48">
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
              Key concepts.
            </h2>
            <p className="text-xl font-medium text-[#666]">
              Six ideas that explain how the whole thing works. Read these once and everything else will click.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyConcepts.map((concept, idx) => (
              <motion.div
                key={concept.term}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-[32px] border border-[#f0f0f0] bg-white p-8 transition-all hover:border-black/5 hover:shadow-2xl hover:shadow-black/[0.02]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f5] text-black">
                  <concept.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-[13px] font-bold uppercase tracking-widest text-[#999]">
                  {concept.term}
                </h3>
                <p className="mt-3 text-[16px] font-medium leading-[1.6] text-[#444]">
                  {concept.definition}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── How data flows ───────────────────────────────────────────── */}
        <section className="mb-48">
          <div className="mb-16">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
              How a tweet travels.
            </h2>
            <p className="mt-6 max-w-[600px] text-xl font-medium text-[#666]">
              From keypress to every connected peer — four steps, zero central servers.
            </p>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div className="absolute left-[31px] top-16 hidden h-[calc(100%-80px)] w-[2px] bg-[#f0f0f0] sm:block" />

            <div className="space-y-4">
              {dataFlowSteps.map((step, idx) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="grid grid-cols-[64px_1fr] items-start gap-6"
                >
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="rounded-[28px] border border-[#f0f0f0] bg-white p-7 sm:p-9">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#ccc]">
                      Step {step.step}
                    </div>
                    <h3 className="mb-3 text-2xl font-bold tracking-tight">{step.title}</h3>
                    <p className="text-[16px] font-medium leading-[1.6] text-[#666]">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Architecture ─────────────────────────────────────────────── */}
        <section id="architecture" className="mb-48">
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
              Architecture.
            </h2>
            <p className="text-xl font-medium text-[#666]">
              Five independent layers. Each is a separate open-source repo with its own README. Swap any layer — the contracts between them are signed envelopes and public HTTP routes.
            </p>
          </div>

          {/* Stack diagram */}
          <div className="mb-8 overflow-hidden rounded-[48px] border border-[#f0f0f0] bg-white">
            {architectureLayers.map((layer, idx) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className="grid grid-cols-[80px_1fr] items-center gap-6 border-b border-[#f5f5f5] p-6 last:border-0 sm:p-8 transition-colors hover:bg-[#fafafa]"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-black"
                  style={{ background: layer.color }}
                >
                  <layer.icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-baseline gap-3">
                    <h3 className="text-xl font-bold tracking-tight">{layer.name}</h3>
                    <code className="rounded-md bg-[#f5f5f5] px-2 py-0.5 text-[12px] font-mono text-[#888]">
                      {layer.repo}
                    </code>
                  </div>
                  <p className="text-[15px] font-medium leading-[1.5] text-[#666]">
                    {layer.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Solana programs grid */}
          <div className="rounded-[48px] bg-black p-10 sm:p-14 text-white">
            <div className="mb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5" />
                tribe-protocol · 12 Anchor programs on Solana
              </div>
              <h3 className="text-[28px] font-bold tracking-[-1px] sm:text-[36px]">
                The on-chain layer.
              </h3>
              <p className="mt-4 max-w-[560px] text-[16px] font-medium leading-[1.6] opacity-60">
                Every program is independently deployed. Identity, social graph, hub discovery, and community primitives — each in its own Anchor workspace program.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {solanaPrograms.map((prog, idx) => (
                <motion.div
                  key={prog.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-[20px] bg-white/5 p-5 transition-colors hover:bg-white/10"
                >
                  <code className="mb-2 block text-[13px] font-bold text-white/90">{prog.name}</code>
                  <p className="text-[13px] font-medium leading-[1.5] text-white/50">{prog.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://github.com/chaalpritam/tribe-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-black transition-all hover:scale-[1.02]"
              >
                <Github className="h-4 w-4" />
                tribe-protocol on GitHub
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/chaalpritam/tribe-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-[13px] font-bold text-white transition-all hover:bg-white/20"
              >
                <Github className="h-4 w-4" />
                tribe-hub on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* ── How it works (steps) ─────────────────────────────────────── */}
        <section className="mb-48">
          <div className="mb-16">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] text-black sm:text-[56px]">
              Get going in four steps.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative flex h-full flex-col justify-between rounded-[40px] bg-[#f5f5f5] p-10 transition-all hover:bg-[#efefef]"
              >
                <div>
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-sm group-hover:scale-110 transition-transform">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold tracking-tight">{step.title}</h3>
                  <p className="text-[17px] font-medium leading-[1.5] text-[#666]">
                    {step.description}
                  </p>
                </div>
                <div className="mt-8 text-sm font-bold opacity-30">{step.step}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section className="mb-48">
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
            <h2 className="text-[32px] font-bold tracking-[-1px] text-black sm:text-[44px]">
              Everything you need for <br />
              your neighborhood.
            </h2>
            <p className="text-xl font-medium text-[#666]">
              From sharing moments to funding projects, Tribe gives you the tools
              to connect and grow your town.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-[32px] border border-[#f0f0f0] bg-white p-8 transition-all hover:border-black/5 hover:shadow-2xl hover:shadow-black/[0.02]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f5] text-black">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold tracking-tight">{feature.title}</h3>
                <p className="text-[16px] font-medium leading-[1.5] text-[#666]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Community value ──────────────────────────────────────────── */}
        <section className="mb-48">
          <div className="relative overflow-hidden rounded-[48px] bg-[#f5f5f5] p-12 sm:p-20">
            <div className="relative z-10 grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  <Heart className="h-4 w-4 text-primary" />
                  Community Powered
                </div>
                <h2 className="mb-8 text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
                  Real value for <br />
                  real people.
                </h2>
                <p className="mb-10 max-w-md text-xl font-medium leading-[1.6] text-[#666]">
                  Tip creators, fund projects, and earn reputation. Every interaction is real and meaningful.
                </p>
                <div className="space-y-4">
                  {[
                    "Direct tipping with one click",
                    "Transparent community crowdfunding",
                    "On-chain reputation and karma",
                    "Built for your neighborhood",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="text-lg font-bold tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-[32px] bg-white p-10 shadow-xl shadow-black/[0.03]">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#999]">
                    Community Impact
                  </p>
                  <p className="text-[44px] font-black tracking-[-1px]">2,450+</p>
                  <p className="text-sm font-medium text-[#666]">Active contributors</p>
                </div>
                <div className="rounded-[32px] bg-white p-10 shadow-xl shadow-black/[0.03]">
                  <p className="mb-6 text-xs font-bold uppercase tracking-widest text-[#999]">
                    Recent Activity
                  </p>
                  <div className="space-y-6">
                    {["@priya_art", "@rahul_cycles", "@maya_cooks"].map((user, i) => (
                      <div key={user} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-[#f5f5f5]" />
                          <span className="text-[17px] font-bold">{user}</span>
                        </div>
                        <span className="text-[17px] font-bold text-primary">+{(i + 1) * 10} karma</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Karma ────────────────────────────────────────────────────── */}
        <section className="mb-48 text-center">
          <div className="mb-16">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
              Earn karma. Build trust.
            </h2>
            <p className="mt-6 text-xl font-medium text-[#666]">
              Every contribution builds your neighborhood reputation — tips received and tasks completed settle on-chain as trustless proofs.
            </p>
          </div>

          <div className="mx-auto flex flex-wrap justify-center gap-4">
            {["Newcomer", "Neighbor", "Local", "Trusted", "Pillar", "Legend"].map((level, idx) => (
              <motion.div
                key={level}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center gap-3 rounded-[24px] bg-[#f5f5f5] px-8 py-6 transition-all hover:bg-black hover:text-white group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white group-hover:bg-white/10 text-primary">
                  <Star className="h-6 w-6" />
                </div>
                <p className="text-lg font-bold">{level}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Cities ───────────────────────────────────────────────────── */}
        <section className="mb-48">
          <div className="flex flex-col items-center gap-12 rounded-[48px] bg-black p-12 text-white sm:p-20">
            <div className="text-center">
              <h2 className="mb-6 text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
                {allCities.filter((c) => c.id !== "bangalore").length} cities on the network.
              </h2>
              <p className="mx-auto max-w-[560px] text-lg font-medium opacity-60">
                Each city has its own channel on the protocol — scoped by latitude and longitude,
                owned on-chain via the channel registry.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allCities
                .filter((c) => c.id !== "bangalore")
                .map((city) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 rounded-[20px] bg-white/5 p-5 transition-colors hover:bg-white/10"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ background: city.accentColor + "22" }}
                    >
                      {city.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold">{city.name}</div>
                      <div className="text-[11px] font-medium opacity-40">{city.country}</div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* ── Protocol primitives ──────────────────────────────────────── */}
        <section id="protocol" className="mb-32">
          <div className="rounded-[48px] border border-[#f0f0f0] bg-white p-12 sm:p-20 shadow-sm">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              <Layers className="h-4 w-4" />
              Built on the Tribe Protocol
            </div>
            <h2 className="mb-8 max-w-[800px] text-[40px] font-bold leading-[1.1] tracking-[-1.5px] sm:text-[56px]">
              tribeapp.wtf is one client. <br />
              The protocol is the&nbsp;point.
            </h2>
            <p className="max-w-[640px] text-xl font-medium leading-[1.6] text-[#666]">
              Tribe is an open social protocol on Solana. Identity lives in
              wallet-recoverable Tribe IDs, content rides as signed envelopes,
              direct messages are end-to-end encrypted, and anyone can run a
              hub. tribeapp.wtf is a hyperlocal frontend on top — fork it,
              build a different one, or skip the UI entirely and talk to the SDK.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {protocolPrimitives.map((p, idx) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-[28px] bg-[#f9f9f9] p-7"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black shadow-sm">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight">{p.title}</h3>
                  <p className="text-[14px] font-medium leading-[1.5] text-[#666]">{p.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What to build ────────────────────────────────────────────── */}
        <section id="build" className="mb-48">
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
            <h2 className="text-[36px] font-bold tracking-[-1.5px] text-black sm:text-[48px]">
              What can you build?
            </h2>
            <p className="text-xl font-medium text-[#666]">
              Tribe provides the primitives for identity, social, and value. You provide the experience. Here are a few things you could build right now.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildExamples.map((example, idx) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-[32px] border border-[#f0f0f0] bg-white p-8 transition-all hover:border-black/5 hover:shadow-2xl hover:shadow-black/[0.02]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                  <example.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold tracking-tight">{example.title}</h3>
                <p className="text-[16px] font-medium leading-[1.5] text-[#666]">{example.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SDK quick-start ──────────────────────────────────────────── */}
        <section className="mb-48">
          <div className="rounded-[48px] bg-[#f5f5f5] p-12 sm:p-16">
            <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  <Code2 className="h-3.5 w-3.5" />
                  tribe-sdk · @tribe-protocol/sdk
                </div>
                <h2 className="text-[32px] font-bold tracking-[-1px] sm:text-[40px]">
                  Start building in minutes.
                </h2>
              </div>
              <p className="text-lg font-medium text-[#666]">
                One TypeScript client for everything — identity, social, DMs, channels, polls, events, tasks, crowdfunds, tips.
              </p>
            </div>

            <div className="overflow-hidden rounded-[24px] bg-black p-6 sm:p-8">
              <pre className="overflow-x-auto text-[13px] leading-[1.8] text-white/80">
                <code>{`import { TribeClient } from '@tribe-protocol/sdk';

const client = TribeClient.forDevnet(wallet);

// Register a TID on Solana
await client.identity.tid.register();

// Add a per-device signing key
await client.identity.appKeys.addKey(tid, appPubkey, scope);

// Publish a tweet
await client.tweets.publish(tid, "gm from the mesh", signingKey);

// Send an encrypted DM (nacl.box — hub never sees plaintext)
await client.dms.send(myTid, recipientTid, "hey");

// Follow someone (instant via ER, settles to L1 in 10s)
await client.social.follow(myTid, targetTid);

// Create a local event
await client.events.create(tid, { title: "Rooftop meetup", startsAt });`}</code>
              </pre>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://github.com/chaalpritam/tribe-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-[13px] font-bold text-white transition-all hover:scale-[1.02]"
              >
                <Github className="h-4 w-4" />
                tribe-sdk on GitHub
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Open source / repos ──────────────────────────────────────── */}
        <section className="mb-48">
          <div className="rounded-[48px] bg-black p-12 sm:p-20 text-white">
            <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-end">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider">
                  <Github className="h-4 w-4" />
                  Open source · MIT
                </div>
                <h2 className="text-[40px] font-bold leading-[1.1] tracking-[-1.5px] sm:text-[56px]">
                  Every piece on GitHub.
                </h2>
              </div>
              <p className="text-lg font-medium opacity-70">
                The protocol, the SDK, the hub, the rollup, the frontends, and
                the iOS app all live in public repos. Read the source, run a
                hub, fork the app, contribute a feature.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {repos.map((repo, idx) => (
                <motion.a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex flex-col gap-3 rounded-[24px] bg-white/5 p-6 transition-all hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Github className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                      <code className="text-[14px] font-bold tracking-tight">{repo.name}</code>
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                  </div>
                  <p className="text-[13px] font-medium leading-[1.5] opacity-60 group-hover:opacity-90">
                    {repo.description}
                  </p>
                </motion.a>
              ))}
            </div>

            <div className="mt-10 text-center">
              <a
                href="https://github.com/chaalpritam/tribeeco"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-bold text-black transition-all hover:scale-[1.02] active:scale-95"
              >
                <Github className="h-4 w-4" />
                Browse the mono-repo
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="flex flex-col items-center justify-between gap-10 border-t border-[#f0f0f0] pt-16 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">tribe</span>
            <span className="text-xs font-bold opacity-30 uppercase tracking-widest">&copy; 2026 · MIT</span>
          </div>

          <div className="flex gap-8 text-sm font-bold text-[#666]">
            <Link href="#concepts" className="hover:text-black">How it works</Link>
            <Link href="#architecture" className="hover:text-black">Architecture</Link>
            <Link href="#build" className="hover:text-black">Build</Link>
            <a
              href="https://github.com/chaalpritam/tribeeco"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-black"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
