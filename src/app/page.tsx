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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
      "Post casts, create events, run polls, help with tasks, fund causes, and earn karma to build your reputation.",
    icon: Zap,
  },
];

const features = [
  {
    icon: Heart,
    title: "Social Feed",
    description:
      "Share photo casts, like and comment on posts, bookmark your favorites, and build a following in your neighborhood.",
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
            href="#what"
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

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-10 border-t border-[#f0f0f0] pt-16 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">tribe</span>
            <span className="text-xs font-bold opacity-30 uppercase tracking-widest">&copy; 2025</span>
          </div>

          <div className="flex gap-8 text-sm font-bold text-[#666]">
            <Link href="#" className="hover:text-black">Privacy</Link>
            <Link href="#" className="hover:text-black">Terms</Link>
            <Link href="#" className="hover:text-black">Twitter</Link>
            <Link href="#" className="hover:text-black">Github</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
