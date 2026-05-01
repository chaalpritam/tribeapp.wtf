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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
      "Push + pull replication between independent hubs. Run your own; messages catch up on connect.",
  },
  {
    icon: Star,
    title: "On-chain reputation",
    description:
      "Karma rolls up tweets, reactions, follows, tips received, and completed tasks per TID.",
  },
  {
    icon: Code2,
    title: "Open SDK",
    description:
      "TypeScript client covering identity, social, DMs, channels, polls, events, tasks, crowdfunds, tips.",
  },
];

const architectureLayers = [
  {
    icon: Layers,
    name: "Solana programs",
    repo: "tribe-protocol",
    description:
      "Anchor programs for the TID registry, app keys, usernames, social graph, and hub registry.",
  },
  {
    icon: Code2,
    name: "TypeScript SDK",
    repo: "tribe-sdk",
    description:
      "Single client for identity, tweets, DMs, channels, polls, events, tasks, crowdfunds, tips, search, karma, notifications.",
  },
  {
    icon: Server,
    name: "Decentralized hub",
    repo: "tribe-hub",
    description:
      "Fastify + Postgres node that indexes Solana events, stores ciphertext DMs, runs gossip with peer hubs, serves the realtime WebSocket.",
  },
  {
    icon: Zap,
    name: "Ephemeral Rollup",
    repo: "tribe-er-server",
    description:
      "Sequencer for instant follows with batched L1 settlement every 10 seconds.",
  },
  {
    icon: Database,
    name: "Frontends",
    repo: "tribe-app · tribeapp.wtf",
    description:
      "Reference Next.js apps — tribe-app is the protocol-first client, tribeapp.wtf this hyperlocal experience.",
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
    description: "Solana programs (Anchor): TID, app keys, usernames, social graph.",
    url: "https://github.com/chaalpritam/tribe-protocol",
  },
  {
    name: "tribe-sdk",
    description: "TypeScript SDK for the whole protocol — published as @tribe-protocol/sdk.",
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

const cities = [
  { name: "Bangalore", emoji: "\u{1F1EE}\u{1F1F3}", members: "15K+", tribes: "42 tribes" },
  { name: "Mumbai", emoji: "\u{1F1EE}\u{1F1F3}", members: "23K+", tribes: "58 tribes" },
  { name: "Delhi", emoji: "\u{1F1EE}\u{1F1F3}", members: "19K+", tribes: "35 tribes" },
  { name: "San Francisco", emoji: "\u{1F1FA}\u{1F1F8}", members: "12K+", tribes: "31 tribes" },
  { name: "London", emoji: "\u{1F1EC}\u{1F1E7}", members: "22K+", tribes: "47 tribes" },
  { name: "New York", emoji: "\u{1F1FA}\u{1F1F8}", members: "29K+", tribes: "63 tribes" },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  // Determine where the user should go based on state
  const getDestination = () => {
    if (!isAuthenticated) return "/onboarding/connect";
    const savedCity = typeof window !== "undefined" ? localStorage.getItem("tribe-selected-city") : null;
    if (!savedCity) return "/onboarding/city";
    return "/home";
  };

  const destination = getDestination();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Floating Navigation (Convos Style) */}
      <nav className="fixed right-8 top-8 z-50 flex items-center">
        <div className="flex items-center gap-1 rounded-full bg-[#f5f5f5]/60 p-1.5 backdrop-blur-md nav-pill-shadow transition-all hover:bg-[#f5f5f5]/80">
          <Link
            href="/"
            className="px-6 py-2.5 text-[15px] font-medium text-black transition-colors hover:text-black/60"
          >
            What
          </Link>
          <Link
            href="#why"
            className="px-6 py-2.5 text-[15px] font-medium text-black transition-colors hover:text-black/60"
          >
            Why
          </Link>
          <Link
            href="#protocol"
            className="px-6 py-2.5 text-[15px] font-medium text-black transition-colors hover:text-black/60"
          >
            Protocol
          </Link>
          <Link
            href="#build"
            className="px-6 py-2.5 text-[15px] font-medium text-black transition-colors hover:text-black/60"
          >
            Build
          </Link>
          <Link
            href={destination}
            className="rounded-full bg-primary px-7 py-2.5 text-[15px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            {isAuthenticated ? "Open" : "Get"}
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-8 py-24 sm:py-32">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 flex justify-center"
        >
          <div className="flex items-center gap-2">
            <span className="text-[32px] font-black tracking-[-1.5px]">tribe</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <section id="what" className="mb-48 text-center">
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
            className="mx-auto mt-10 max-w-[600px] text-[20px] font-medium leading-[1.6] text-[#666] sm:text-[24px]"
          >
            Connect with your neighborhood. Discover local events, join tribes,
            and build trust where you live.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-16"
          >
            <Link
              href={destination}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-5 text-xl font-bold text-white transition-all hover:scale-[1.05] active:scale-95 shadow-xl shadow-primary/20"
            >
              {isAuthenticated ? "Open App" : "Start building"} <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </section>

        {/* How it works (Clean Visual Cards) */}
        <section id="why" className="mb-48">
          <div className="mb-16">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] text-black sm:text-[56px]">
              Better communities. <br />
              Less noise.
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

        {/* Features (Grid) */}
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

        {/* Community Value Section */}
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
                  Tip creators, fund projects, and earn
                  reputation. Every interaction is real and meaningful.
                </p>
                <div className="space-y-4">
                  {[
                    "Direct tipping with one click",
                    "Transparent community crowdfunding",
                    "Reputation and badges",
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

        {/* Karma / Reputation */}
        <section className="mb-48 text-center">
          <div className="mb-16">
            <h2 className="text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
              Earn karma. Build trust.
            </h2>
            <p className="mt-6 text-xl font-medium text-[#666]">
              Every contribution builds your neighborhood reputation.
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

        {/* Cities */}
        <section className="mb-48">
          <div className="flex flex-col items-center gap-12 rounded-[48px] bg-black p-12 text-white sm:p-20">
            <div className="text-center">
              <h2 className="mb-6 text-[40px] font-bold tracking-[-1.5px] sm:text-[56px]">
                Active in {cities.length} cities.
              </h2>
              <p className="mx-auto max-w-[500px] text-lg font-medium opacity-60">
                Join thousands of neighbors building stronger communities.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <div
                  key={city.name}
                  className="flex items-center gap-6 rounded-[24px] bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                    {city.emoji}
                  </div>
                  <div>
                    <div className="text-lg font-bold">{city.name}</div>
                    <div className="text-sm font-medium opacity-50">{city.members} members</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Protocol intro */}
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
              build a different one, or skip the UI entirely and talk to the
              SDK.
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
                  <h3 className="mb-2 text-lg font-bold tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-[14px] font-medium leading-[1.5] text-[#666]">
                    {p.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-32">
          <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-end">
            <h2 className="text-[36px] font-bold tracking-[-1.5px] sm:text-[48px]">
              How the layers fit.
            </h2>
            <p className="text-lg font-medium text-[#666]">
              Each piece is a separate repo with its own README. Swap any
              layer — the contracts between them are signed envelopes and
              public HTTP routes.
            </p>
          </div>

          <div className="space-y-3">
            {architectureLayers.map((layer, idx) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-[64px_1fr_auto] items-center gap-6 rounded-[28px] border border-[#f0f0f0] bg-white p-6 sm:p-8 transition-all hover:border-black/5 hover:shadow-2xl hover:shadow-black/[0.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f5f5] text-black">
                  <layer.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-baseline gap-3">
                    <h3 className="text-xl font-bold tracking-tight">
                      {layer.name}
                    </h3>
                    <code className="text-[12px] font-mono text-[#999]">
                      {layer.repo}
                    </code>
                  </div>
                  <p className="text-[15px] font-medium leading-[1.5] text-[#666]">
                    {layer.description}
                  </p>
                </div>
                <ArrowRight className="hidden sm:block h-5 w-5 text-[#ccc]" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* What to build */}
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
                <p className="text-[16px] font-medium leading-[1.5] text-[#666]">
                  {example.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Open source */}
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
                The protocol, the SDK, the hub, the rollup, and the frontends
                all live in public repos. Read the source, run a hub, fork
                the app, contribute a feature.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      <code className="text-[15px] font-bold tracking-tight">
                        {repo.name}
                      </code>
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                  </div>
                  <p className="text-[14px] font-medium leading-[1.5] opacity-70 group-hover:opacity-90">
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

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-10 border-t border-[#f0f0f0] pt-16 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">tribe</span>
            <span className="text-xs font-bold opacity-30 uppercase tracking-widest">&copy; 2025 · MIT</span>
          </div>

          <div className="flex gap-8 text-sm font-bold text-[#666]">
            <Link href="#protocol" className="hover:text-black">Protocol</Link>
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
