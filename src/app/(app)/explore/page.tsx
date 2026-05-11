"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Hash, Loader2, Search, User, MapPin,
  Calendar, BarChart3, CheckCircle, Banknote, Users, ArrowRight,
} from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { AppHeader } from "@/components/layout/app-header";
import { EventCard } from "@/components/features/home/event-card";
import { PollCard } from "@/components/features/home/poll-card";
import { TaskCard } from "@/components/features/home/task-card";
import { CrowdfundCard } from "@/components/features/home/crowdfund-card";
import { useTribeSearch } from "@/hooks/use-tribe-search";
import { useHubChannels } from "@/hooks/use-hub-channels";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { useOnchainPolls } from "@/hooks/use-onchain-polls";
import { useOnchainTasks } from "@/hooks/use-onchain-tasks";
import { useOnchainCrowdfunds } from "@/hooks/use-onchain-crowdfunds";
import { formatNumber } from "@/lib/utils";
import { cities as curatedCities } from "@/lib/cities";
import type { Poll, Task, Crowdfund, ExploreItem } from "@/types";

const CHANNEL_KIND_CITY     = 2;
const CHANNEL_KIND_INTEREST = 3;

const DEFAULT_CITY_IMAGE =
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop";

export default function ExplorePage() {
  const { currentCity } = useTribeStore();
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();

  const { users: hubUsers, loading: searchLoading } = useTribeSearch(search);
  const isSearching = search.trim().length >= 2;

  const { channels: allHubChannels, loading: channelsLoading } = useHubChannels({});

  const interestChannels = useMemo(
    () => allHubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_INTEREST),
    [allHubChannels]
  );
  const cityChannels = useMemo(
    () => allHubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_CITY),
    [allHubChannels]
  );

  const { events,     loading: eventsLoading }  = useOnchainEvents({ cityId: "" });
  const { polls,      loading: pollsLoading }    = useOnchainPolls({ cityId: "" });
  const { tasks,      loading: tasksLoading }    = useOnchainTasks({ cityId: "" });
  const { crowdfunds, loading: fundsLoading }    = useOnchainCrowdfunds({ cityId: "" });

  const visibleCities   = !search ? cityChannels   : cityChannels.filter((c)   => (c.name ?? c.id).toLowerCase().includes(q));
  const visibleChannels = !search ? interestChannels : interestChannels.filter((c) => (c.name ?? c.id).toLowerCase().includes(q));
  const visibleEvents   = !search ? (events as ExploreItem[])     : (events as ExploreItem[]).filter((e) => e.title.toLowerCase().includes(q));
  const visiblePolls    = !search ? (polls as Poll[])             : (polls as Poll[]).filter((p) => p.question.toLowerCase().includes(q));
  const visibleTasks    = !search ? (tasks as Task[])             : (tasks as Task[]).filter((t) => t.title.toLowerCase().includes(q));
  const visibleFunds    = !search ? (crowdfunds as Crowdfund[])   : (crowdfunds as Crowdfund[]).filter((f) => f.title.toLowerCase().includes(q));
  const visiblePeople   = isSearching ? hubUsers : [];

  const anythingLoading = channelsLoading || eventsLoading;
  const nothingAtAll =
    !anythingLoading &&
    visibleCities.length === 0 && visibleChannels.length === 0 &&
    visibleEvents.length === 0 && visiblePolls.length === 0 &&
    visibleTasks.length === 0 && visibleFunds.length === 0 &&
    visiblePeople.length === 0;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Explore" />

      {/* Sticky search */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0] px-3 sm:px-6 py-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search channels, cities, people, events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3 pl-12 pr-4 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
          />
          {(searchLoading || (anythingLoading && !search)) && (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="px-3 sm:px-6 pt-6 pb-28 max-w-2xl mx-auto space-y-10">

        {/* ── People (search only) ── */}
        {visiblePeople.length > 0 && (
          <Section title="People" icon={User}>
            <div className="flex flex-col gap-2">
              {visiblePeople.map((u) => {
                const label = u.display_name?.trim() || (u.username ? `@${u.username}` : `#${u.tid}`);
                const sub   = u.username ? `@${u.username}` : `#${u.tid}`;
                return (
                  <Link
                    key={u.tid}
                    href={`/profile?tid=${u.tid}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="h-11 w-11 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold truncate">{label}</p>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{sub}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Cities ── */}
        {(visibleCities.length > 0 || channelsLoading) && (
          <Section title="Cities" icon={MapPin}>
            {channelsLoading && cityChannels.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {[1,2,3].map((i) => (
                  <div key={i} className="w-36 h-44 rounded-[28px] bg-[#f0f0f0] animate-pulse shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {visibleCities.map((c) => {
                  const curated = curatedCities.find((x) => x.id === c.id);
                  const img = curated?.imageUrl || DEFAULT_CITY_IMAGE;
                  const isCurrent = c.id === currentCity?.id;
                  return (
                    <Link
                      key={c.id}
                      href={`/tribes/${c.id}`}
                      className="relative w-36 h-44 rounded-[28px] overflow-hidden shrink-0 group shadow-md hover:shadow-xl transition-all active:scale-95"
                    >
                      <Image src={img} alt={c.name || c.id} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-[13px] font-black tracking-tight leading-tight truncate">
                          {c.name?.trim() || c.id}
                        </p>
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          {curated?.country ?? "Protocol"}
                        </p>
                      </div>
                      {isCurrent && (
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
                          Here
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* ── Channels ── */}
        {(visibleChannels.length > 0 || channelsLoading) && (
          <Section title="Channels" icon={Hash}>
            {channelsLoading && interestChannels.length === 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-24 rounded-[24px] bg-[#f0f0f0] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visibleChannels.map((c) => (
                  <Link
                    key={c.id}
                    href={`/tribes/${c.id}`}
                    className="flex flex-col gap-2 p-4 rounded-[24px] bg-white border border-[#f0f0f0] hover:shadow-lg transition-all active:scale-[0.97]"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black tracking-tight truncate">{c.name?.trim() || `#${c.id}`}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        {formatNumber(c.member_count ?? 0)} members
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Events ── */}
        {(visibleEvents.length > 0 || eventsLoading) && (
          <Section title="Events" icon={Calendar}>
            {eventsLoading && events.length === 0 ? (
              <SkeletonList />
            ) : (
              <div className="flex flex-col gap-4">
                {visibleEvents.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </Section>
        )}

        {/* ── Polls ── */}
        {(visiblePolls.length > 0 || pollsLoading) && (
          <Section title="Polls" icon={BarChart3}>
            {pollsLoading && polls.length === 0 ? (
              <SkeletonList />
            ) : (
              <div className="flex flex-col gap-4">
                {visiblePolls.map((p) => <PollCard key={p.id} poll={p} />)}
              </div>
            )}
          </Section>
        )}

        {/* ── Tasks ── */}
        {(visibleTasks.length > 0 || tasksLoading) && (
          <Section title="Tasks" icon={CheckCircle}>
            {tasksLoading && tasks.length === 0 ? (
              <SkeletonList />
            ) : (
              <div className="flex flex-col gap-4">
                {visibleTasks.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}
          </Section>
        )}

        {/* ── Funds ── */}
        {(visibleFunds.length > 0 || fundsLoading) && (
          <Section title="Funds" icon={Banknote}>
            {fundsLoading && crowdfunds.length === 0 ? (
              <SkeletonList />
            ) : (
              <div className="flex flex-col gap-4">
                {visibleFunds.map((f) => <CrowdfundCard key={f.id} crowdfund={f} />)}
              </div>
            )}
          </Section>
        )}

        {/* Empty state */}
        {nothingAtAll && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-20 w-20 rounded-[32px] bg-muted/30 flex items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-black">
                {search ? "No results found" : "Nothing here yet"}
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {search ? "Try different keywords" : "Content will appear here as the network grows"}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-xl bg-black text-white flex items-center justify-center">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[15px] font-black tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-24 rounded-[24px] bg-[#f0f0f0] animate-pulse" />
      ))}
    </div>
  );
}
