"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Hash, Loader2, Search, User, MapPin,
  Calendar, BarChart3, CheckCircle, Banknote, Users,
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
import { formatNumber, cn } from "@/lib/utils";
import { cities as curatedCities } from "@/lib/cities";
import type { Poll, Task, Crowdfund, ExploreItem } from "@/types";

const CHANNEL_KIND_CITY     = 2;
const CHANNEL_KIND_INTEREST = 3;

type ExploreTab = "all" | "channels" | "cities" | "people" | "events" | "polls" | "tasks" | "funds";

const tabs: { id: ExploreTab; label: string; icon: React.ElementType }[] = [
  { id: "all",      label: "All",      icon: Search },
  { id: "channels", label: "Channels", icon: Hash },
  { id: "cities",   label: "Cities",   icon: MapPin },
  { id: "people",   label: "People",   icon: User },
  { id: "events",   label: "Events",   icon: Calendar },
  { id: "polls",    label: "Polls",    icon: BarChart3 },
  { id: "tasks",    label: "Tasks",    icon: CheckCircle },
  { id: "funds",    label: "Funds",    icon: Banknote },
];

const DEFAULT_CITY_IMAGE =
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop";

export default function ExplorePage() {
  const { currentCity } = useTribeStore();
  const [search, setSearch]   = useState("");
  const [activeTab, setActiveTab] = useState<ExploreTab>("all");

  // Hub search (debounced, 2-char min)
  const { users: hubUsers, channels: hubSearchChannels, loading: searchLoading } =
    useTribeSearch(search);
  const isSearching = search.trim().length >= 2;

  // All channels from hub
  const { channels: allHubChannels, loading: channelsLoading } = useHubChannels({});

  const interestChannels = useMemo(
    () => allHubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_INTEREST),
    [allHubChannels]
  );
  const cityChannels = useMemo(
    () => allHubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_CITY),
    [allHubChannels]
  );

  // All onchain content (cityId="" = all cities)
  const { events,     loading: eventsLoading     } = useOnchainEvents({ cityId: "" });
  const { polls,      loading: pollsLoading       } = useOnchainPolls({ cityId: "" });
  const { tasks,      loading: tasksLoading       } = useOnchainTasks({ cityId: "" });
  const { crowdfunds, loading: fundsLoading       } = useOnchainCrowdfunds({ cityId: "" });

  // Filter helpers
  const q = search.toLowerCase();
  const filterChannels = (list: typeof interestChannels) =>
    !search ? list : list.filter((c) => (c.name ?? c.id).toLowerCase().includes(q));
  const filterCities = (list: typeof cityChannels) =>
    !search ? list : list.filter((c) => (c.name ?? c.id).toLowerCase().includes(q));
  const filterEvents = (list: ExploreItem[]) =>
    !search ? list : list.filter((e) => e.title.toLowerCase().includes(q));
  const filterPolls = (list: Poll[]) =>
    !search ? list : list.filter((p) => p.question.toLowerCase().includes(q));
  const filterTasks = (list: Task[]) =>
    !search ? list : list.filter((t) => t.title.toLowerCase().includes(q));
  const filterFunds = (list: Crowdfund[]) =>
    !search ? list : list.filter((f) => f.title.toLowerCase().includes(q));

  const visibleChannels = filterChannels(interestChannels);
  const visibleCities   = filterCities(cityChannels);
  const visibleEvents   = filterEvents(events as ExploreItem[]);
  const visiblePolls    = filterPolls(polls as Poll[]);
  const visibleTasks    = filterTasks(tasks as Task[]);
  const visibleFunds    = filterFunds(crowdfunds as Crowdfund[]);

  // People: use hub search results when searching, empty otherwise
  const visiblePeople = isSearching ? hubUsers : [];

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Explore" />

      {/* Search bar */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="px-3 sm:px-6 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search channels, people, events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3 pl-12 pr-4 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
            />
            {searchLoading && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto no-scrollbar px-3 sm:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all",
                  active
                    ? "border-black text-black"
                    : "border-transparent text-muted-foreground hover:text-black"
                )}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 sm:px-6 pt-5 pb-24 max-w-2xl mx-auto space-y-8">

        {/* ── ALL ── */}
        {activeTab === "all" && (
          <>
            {/* People (only when searching) */}
            {isSearching && hubUsers.length > 0 && (
              <Section title="People" count={hubUsers.length}>
                {hubUsers.slice(0, 5).map((u) => (
                  <PersonCard key={u.tid} tid={u.tid} displayName={u.display_name} username={u.username} />
                ))}
              </Section>
            )}

            {/* Channels */}
            {visibleChannels.length > 0 && (
              <Section title="Channels" count={visibleChannels.length} onMore={() => setActiveTab("channels")}>
                {visibleChannels.slice(0, 4).map((c) => (
                  <ChannelRow key={c.id} id={c.id} name={c.name} members={c.member_count} />
                ))}
              </Section>
            )}

            {/* Cities */}
            {visibleCities.length > 0 && (
              <Section title="Cities" count={visibleCities.length} onMore={() => setActiveTab("cities")}>
                {visibleCities.slice(0, 4).map((c) => (
                  <CityRow key={c.id} id={c.id} name={c.name} members={c.member_count} currentCityId={currentCity?.id} />
                ))}
              </Section>
            )}

            {/* Events */}
            {visibleEvents.length > 0 && (
              <Section title="Events" count={visibleEvents.length} onMore={() => setActiveTab("events")}>
                {visibleEvents.slice(0, 2).map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </Section>
            )}

            {/* Polls */}
            {visiblePolls.length > 0 && (
              <Section title="Polls" count={visiblePolls.length} onMore={() => setActiveTab("polls")}>
                {visiblePolls.slice(0, 2).map((p) => (
                  <PollCard key={p.id} poll={p} />
                ))}
              </Section>
            )}

            {/* Tasks */}
            {visibleTasks.length > 0 && (
              <Section title="Tasks" count={visibleTasks.length} onMore={() => setActiveTab("tasks")}>
                {visibleTasks.slice(0, 2).map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </Section>
            )}

            {/* Funds */}
            {visibleFunds.length > 0 && (
              <Section title="Funds" count={visibleFunds.length} onMore={() => setActiveTab("funds")}>
                {visibleFunds.slice(0, 2).map((f) => (
                  <CrowdfundCard key={f.id} crowdfund={f} />
                ))}
              </Section>
            )}

            {/* Loading state */}
            {(channelsLoading || eventsLoading) && visibleChannels.length === 0 && visibleEvents.length === 0 && (
              <LoadingState />
            )}

            {/* Empty */}
            {!channelsLoading && !eventsLoading &&
              visibleChannels.length === 0 && visibleCities.length === 0 &&
              visibleEvents.length === 0 && visiblePolls.length === 0 &&
              visibleTasks.length === 0 && visibleFunds.length === 0 &&
              (!isSearching || hubUsers.length === 0) && (
              <EmptyState search={search} />
            )}
          </>
        )}

        {/* ── CHANNELS ── */}
        {activeTab === "channels" && (
          <>
            {channelsLoading && interestChannels.length === 0 ? <LoadingState /> : (
              visibleChannels.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {visibleChannels.map((c) => (
                    <ChannelRow key={c.id} id={c.id} name={c.name} members={c.member_count} />
                  ))}
                </div>
              ) : <EmptyState search={search} label="No channels found" />
            )}
          </>
        )}

        {/* ── CITIES ── */}
        {activeTab === "cities" && (
          <>
            {channelsLoading && cityChannels.length === 0 ? <LoadingState /> : (
              visibleCities.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {visibleCities.map((c) => (
                    <CityRow key={c.id} id={c.id} name={c.name} members={c.member_count} currentCityId={currentCity?.id} />
                  ))}
                </div>
              ) : <EmptyState search={search} label="No city channels found" />
            )}
          </>
        )}

        {/* ── PEOPLE ── */}
        {activeTab === "people" && (
          <>
            {!isSearching ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-[24px] bg-muted/30 flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-base font-bold text-black">Search for people</p>
                <p className="text-sm font-medium">Type a name or username above to find people.</p>
              </div>
            ) : searchLoading ? <LoadingState /> : (
              visiblePeople.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {visiblePeople.map((u) => (
                    <PersonCard key={u.tid} tid={u.tid} displayName={u.display_name} username={u.username} />
                  ))}
                </div>
              ) : <EmptyState search={search} label="No people found" />
            )}
          </>
        )}

        {/* ── EVENTS ── */}
        {activeTab === "events" && (
          <>
            {eventsLoading && events.length === 0 ? <LoadingState /> : (
              visibleEvents.length > 0 ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  {visibleEvents.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
              ) : <EmptyState search={search} label="No events yet" sub="Create one from the + button." />
            )}
          </>
        )}

        {/* ── POLLS ── */}
        {activeTab === "polls" && (
          <>
            {pollsLoading && polls.length === 0 ? <LoadingState /> : (
              visiblePolls.length > 0 ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  {visiblePolls.map((p) => <PollCard key={p.id} poll={p} />)}
                </div>
              ) : <EmptyState search={search} label="No polls yet" sub="Ask your community something." />
            )}
          </>
        )}

        {/* ── TASKS ── */}
        {activeTab === "tasks" && (
          <>
            {tasksLoading && tasks.length === 0 ? <LoadingState /> : (
              visibleTasks.length > 0 ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  {visibleTasks.map((t) => <TaskCard key={t.id} task={t} />)}
                </div>
              ) : <EmptyState search={search} label="No tasks yet" sub="Post a task to get help from neighbors." />
            )}
          </>
        )}

        {/* ── FUNDS ── */}
        {activeTab === "funds" && (
          <>
            {fundsLoading && crowdfunds.length === 0 ? <LoadingState /> : (
              visibleFunds.length > 0 ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  {visibleFunds.map((f) => <CrowdfundCard key={f.id} crowdfund={f} />)}
                </div>
              ) : <EmptyState search={search} label="No campaigns yet" sub="Start a crowdfund to raise community capital." />
            )}
          </>
        )}

      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function Section({
  title, count, onMore, children,
}: {
  title: string;
  count: number;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#999]">{title}</h2>
        {onMore && count > 0 && (
          <button
            onClick={onMore}
            className="text-[11px] font-bold text-primary hover:opacity-70 transition-opacity uppercase tracking-widest"
          >
            See all {count}
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ChannelRow({ id, name, members }: { id: string; name?: string | null; members?: number | null }) {
  return (
    <Link
      href={`/tribes/${id}`}
      className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
        <Hash className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold tracking-tight truncate">{name?.trim() || `#${id}`}</p>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          {formatNumber(members ?? 0)} members
        </p>
      </div>
    </Link>
  );
}

function CityRow({
  id, name, members, currentCityId,
}: {
  id: string;
  name?: string | null;
  members?: number | null;
  currentCityId?: string;
}) {
  const curated = curatedCities.find((c) => c.id === id);
  const imgSrc  = curated?.imageUrl || DEFAULT_CITY_IMAGE;
  const isCurrent = id === currentCityId;

  return (
    <Link
      href={`/tribes/${id}`}
      className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative h-10 w-10 rounded-2xl overflow-hidden shrink-0">
        <Image src={imgSrc} alt={name || id} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-bold tracking-tight truncate">{name?.trim() || id}</p>
          {isCurrent && (
            <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase">
              Current
            </span>
          )}
        </div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <MapPin className="h-2.5 w-2.5 inline mr-0.5" />
          {curated?.country ?? "Protocol"}
          {(members ?? 0) > 0 && ` · ${formatNumber(members ?? 0)} members`}
        </p>
      </div>
    </Link>
  );
}

function PersonCard({
  tid, displayName, username,
}: {
  tid: number;
  displayName?: string | null;
  username?: string | null;
}) {
  const label = displayName?.trim() || (username ? `@${username}` : `#${tid}`);
  const sub   = username ? `@${username}` : `#${tid}`;
  return (
    <Link
      href={`/profile?tid=${tid}`}
      className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="h-10 w-10 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
        <Users className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold tracking-tight truncate">{label}</p>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{sub}</p>
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ search, label, sub }: { search?: string; label?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <div className="h-16 w-16 rounded-[24px] bg-muted/30 flex items-center justify-center">
        <Search className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-base font-bold text-black">
        {label ?? (search ? "No results found" : "Nothing here yet")}
      </p>
      {sub && <p className="text-sm font-medium">{sub}</p>}
    </div>
  );
}
