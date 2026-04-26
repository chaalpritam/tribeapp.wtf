"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Mic,
  Building2,
  Network,
  User,
  ArrowLeft,
  MessageCircle,
  BadgeCheck,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";

const tabs = [
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "speakers", label: "Speakers", icon: Mic },
  { id: "venues", label: "Venues", icon: Building2 },
  { id: "networking", label: "Network", icon: Network },
  { id: "profile", label: "Profile", icon: User },
];

const mockEvents = [
  { id: "ce1", title: "Opening Keynote: The Future of Ethereum", time: "9:00 AM - 10:00 AM", track: "Main Stage", speaker: "Vitalik Buterin", isKeynote: true },
  { id: "ce2", title: "Zero Knowledge Proofs Workshop", time: "10:30 AM - 12:00 PM", track: "ZK Track", speaker: "Anna Rose" },
  { id: "ce3", title: "DeFi: The Next Chapter", time: "1:00 PM - 2:00 PM", track: "DeFi Track", speaker: "Hayden Adams" },
  { id: "ce4", title: "Building on Layer 2", time: "2:30 PM - 3:30 PM", track: "Scaling Track", speaker: "Karl Floersch" },
  { id: "ce5", title: "Community Building in Web3", time: "4:00 PM - 5:00 PM", track: "Community Track", speaker: "Community Panel" },
];

const mockSpeakers = [
  { id: "s1", name: "Vitalik Buterin", title: "Co-founder", company: "Ethereum", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" },
  { id: "s2", name: "Anna Rose", title: "Host", company: "Zero Knowledge Podcast", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: "s3", name: "Hayden Adams", title: "Founder", company: "Uniswap", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" },
  { id: "s4", name: "Karl Floersch", title: "CEO", company: "Optimism", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
];

const mockAttendees = [
  { id: "a1", name: "Sarah Chen", role: "DeFi Developer", company: "Aave", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", isOnline: true, mutual: 3 },
  { id: "a2", name: "James Park", role: "Protocol Engineer", company: "Chainlink", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", isOnline: true, mutual: 7 },
  { id: "a3", name: "Elena Rossi", role: "Smart Contract Auditor", company: "OpenZeppelin", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop", isOnline: false, mutual: 2 },
  { id: "a4", name: "Dev Patel", role: "Full Stack Developer", company: "Polygon", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop", isOnline: true, mutual: 5 },
  { id: "a5", name: "Mika Tanaka", role: "Product Manager", company: "Polygon", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop", isOnline: false, mutual: 1 },
  { id: "a6", name: "Alice Wang", role: "ZK Researcher", company: "Starknet", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", isOnline: true, mutual: 4 },
];

const venues = [
  { name: "Istanbul Congress Center", desc: "Main venue for keynotes and workshops", location: "Harbiye, Sisli, Istanbul", capacity: "3,000" },
  { name: "The Halikarnas Hall", desc: "Breakout sessions and panel discussions", location: "Beyoglu, Istanbul", capacity: "500" },
  { name: "Bosphorus Terrace", desc: "Networking events and evening socials", location: "Besiktas, Istanbul", capacity: "200" },
];

export default function ConferencePage() {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div>
      {/* Hero */}
      <div className="relative h-48 bg-gradient-to-br from-violet-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex h-full flex-col justify-end p-4 text-white">
          <Link href="/home" className="absolute left-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Devconnect</h1>
          <p className="text-sm text-white/80">A week of independent Ethereum events</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Nov 12-19, 2024
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Istanbul, Turkey
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              12,500 attendees
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-violet-500 text-violet-600"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "schedule" && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Day 1 - Monday, Nov 12</h2>
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className={`rounded-xl border p-4 ${
                  event.isKeynote ? "border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5" : ""
                }`}
              >
                {event.isKeynote && (
                  <span className="mb-2 inline-block rounded-full bg-violet-500 px-2 py-0.5 text-xs text-white">
                    Keynote
                  </span>
                )}
                <h3 className="text-sm font-semibold">{event.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {event.time} &middot; {event.track}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{event.speaker}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "speakers" && (
          <div className="grid grid-cols-2 gap-3">
            {mockSpeakers.map((speaker) => (
              <div key={speaker.id} className="flex flex-col items-center rounded-xl border p-4 text-center">
                <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full">
                  <Image src={speaker.avatar} alt="" fill className="object-cover" sizes="64px" />
                </div>
                <p className="text-sm font-semibold">{speaker.name}</p>
                <p className="text-xs text-muted-foreground">{speaker.title}</p>
                <p className="text-xs text-muted-foreground">{speaker.company}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "venues" && (
          <div className="space-y-3">
            {venues.map((venue) => (
              <div key={venue.name} className="rounded-xl border p-4">
                <h3 className="font-semibold">{venue.name}</h3>
                <p className="text-sm text-muted-foreground">{venue.desc}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {venue.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {venue.capacity} capacity
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "networking" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Attendees Near You</h2>
              <span className="text-xs text-muted-foreground">{mockAttendees.filter((a) => a.isOnline).length} online</span>
            </div>
            <div className="space-y-3">
              {mockAttendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="relative">
                    <div className="relative h-11 w-11 overflow-hidden rounded-full">
                      <Image src={attendee.avatar} alt="" fill className="object-cover" sizes="44px" />
                    </div>
                    {attendee.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{attendee.name}</p>
                      <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{attendee.role} at {attendee.company}</p>
                    <p className="text-[10px] text-muted-foreground">{attendee.mutual} mutual connections</p>
                  </div>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors dark:bg-violet-500/10 dark:hover:bg-violet-500/20">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl border p-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl font-bold text-white">
                YU
              </div>
              <h2 className="text-lg font-bold">Your Username</h2>
              <p className="text-sm text-muted-foreground">Blockchain Developer</p>
              <p className="mt-1 text-xs text-muted-foreground">Building the future of decentralized communities</p>

              <div className="mt-4 flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-black">12</p>
                  <p className="text-[10px] text-muted-foreground">Connections</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black">5</p>
                  <p className="text-[10px] text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black">3</p>
                  <p className="text-[10px] text-muted-foreground">Bookmarked</p>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Your Interests</h3>
              <div className="flex flex-wrap gap-2">
                {["DeFi", "ZK Proofs", "Layer 2", "DAOs", "NFTs", "Ethereum"].map((tag) => (
                  <span key={tag} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Social Links</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  <Twitter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">@yourhandle</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">linkedin.com/in/yourprofile</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">yourwebsite.com</span>
                </div>
              </div>
            </div>

            <button className="w-full rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white hover:bg-violet-600 transition-colors">
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
