"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Hash, Loader2, Search, User, MapPin,
  Users,
  ArrowRight,
} from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { AppHeader } from "@/components/layout/app-header";
import { useTribeSearch } from "@/hooks/use-tribe-search";
import { useHubChannels } from "@/hooks/use-hub-channels";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { useOnchainPolls } from "@/hooks/use-onchain-polls";
import { useOnchainTasks } from "@/hooks/use-onchain-tasks";
import { useOnchainCrowdfunds } from "@/hooks/use-onchain-crowdfunds";
import { formatNumber, formatHandle } from "@/lib/utils";
import { dummyEvents, dummyPolls, dummyTasks, dummyCrowdfunds } from "@/lib/dummy-data";
import type { Poll, Task, Crowdfund, ExploreItem } from "@/types";

const CHANNEL_KIND_INTEREST = 3;

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

  const { events: onchainEvents, loading: eventsLoading }    = useOnchainEvents({ cityId: "" });
  const { polls: onchainPolls,   loading: pollsLoading }      = useOnchainPolls({ cityId: "" });
  const { tasks: onchainTasks,   loading: tasksLoading }      = useOnchainTasks({ cityId: "" });
  const { crowdfunds: onchainFunds, loading: fundsLoading }   = useOnchainCrowdfunds({ cityId: "" });

  // Fall back to dummy data when the hub has returned nothing yet
  const events     = !eventsLoading && onchainEvents.length === 0 ? dummyEvents     : onchainEvents;
  const polls      = !pollsLoading  && onchainPolls.length  === 0 ? dummyPolls      : onchainPolls;
  const tasks      = !tasksLoading  && onchainTasks.length  === 0 ? dummyTasks      : onchainTasks;
  const crowdfunds = !fundsLoading  && onchainFunds.length  === 0 ? dummyCrowdfunds : onchainFunds;

  // Filtered lists
  const visibleChannels = !search ? interestChannels : interestChannels.filter((c) => (c.name ?? c.id).toLowerCase().includes(q));
  const visibleEvents   = !search ? (events as ExploreItem[])   : (events as ExploreItem[]).filter((e) => e.title.toLowerCase().includes(q));
  const visiblePolls    = !search ? (polls as Poll[])            : (polls as Poll[]).filter((p) => p.question.toLowerCase().includes(q));
  const visibleTasks    = !search ? (tasks as Task[])            : (tasks as Task[]).filter((t) => t.title.toLowerCase().includes(q));
  const visibleFunds    = !search ? (crowdfunds as Crowdfund[])  : (crowdfunds as Crowdfund[]).filter((f) => f.title.toLowerCase().includes(q));
  const visiblePeople   = isSearching ? hubUsers : [];

  const anythingLoading = channelsLoading;

  return (
    <div className="bg-[#f8f8f8] min-h-screen">
      <AppHeader title="Explore" />

      {/* Sticky search */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0] px-3 sm:px-6 py-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search everything…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3 pl-12 pr-4 text-[14px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
          />
          {(searchLoading || anythingLoading) && (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="px-3 sm:px-6 pt-6 pb-28 max-w-2xl mx-auto space-y-10">

        {/* ── People (search only) ── */}
        {visiblePeople.length > 0 && (
          <Section title="People" icon={User} accent="bg-violet-500">
            <div className="flex flex-col gap-2">
              {visiblePeople.map((u) => {
                const label = u.display_name?.trim() || (u.username ? u.username : `#${u.tid}`);
                return (
                  <Link key={u.tid} href={`/profile?tid=${u.tid}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <Avatar src={null} name={label} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold truncate">{label}</p>
                      <p className="text-[11px] font-bold text-muted-foreground">{formatHandle(u.username || `#${u.tid}`)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#ccc] shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Channels ── */}
        {(visibleChannels.length > 0 || channelsLoading) && (
          <Section title="Channels" icon={Hash} accent="bg-indigo-500">
            {channelsLoading && interestChannels.length === 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map((i) => <div key={i} className="h-28 rounded-[24px] bg-[#ececec] animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visibleChannels.map((c) => (
                  <Link key={c.id} href={`/tribes/${c.id}`}
                    className="flex flex-col justify-between p-4 rounded-[24px] bg-white border border-[#f0f0f0] hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.97] min-h-[110px]"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black tracking-tight leading-snug line-clamp-2">{c.name?.trim() || `#${c.id}`}</p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1">
                        {formatNumber(c.member_count ?? 0)} members
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Interleaved content feed ── */}
        {(() => {
          type ExploreCard =
            | { kind: "event";  id: string; data: ExploreItem }
            | { kind: "poll";   id: string; data: Poll }
            | { kind: "task";   id: string; data: Task }
            | { kind: "fund";   id: string; data: Crowdfund };

          const maxLen = Math.max(
            visibleEvents.length, visiblePolls.length,
            visibleTasks.length, visibleFunds.length,
          );
          const interleaved: ExploreCard[] = [];
          for (let i = 0; i < maxLen; i++) {
            if (i < visibleEvents.length) interleaved.push({ kind: "event", id: visibleEvents[i].id, data: visibleEvents[i] });
            if (i < visiblePolls.length)  interleaved.push({ kind: "poll",  id: visiblePolls[i].id,  data: visiblePolls[i] as Poll });
            if (i < visibleTasks.length)  interleaved.push({ kind: "task",  id: visibleTasks[i].id,  data: visibleTasks[i] as Task });
            if (i < visibleFunds.length)  interleaved.push({ kind: "fund",  id: visibleFunds[i].id,  data: visibleFunds[i] as Crowdfund });
          }

          if (eventsLoading || pollsLoading || tasksLoading || fundsLoading) {
            return <SkeletonList />;
          }

          return interleaved.length > 0 ? (
            <div className="flex flex-col gap-3">
              {interleaved.map((item) => {
                if (item.kind === "event") return <EventExploreCard key={item.id} event={item.data} />;
                if (item.kind === "poll")  return <PollExploreCard  key={item.id} poll={item.data} />;
                if (item.kind === "task")  return <TaskExploreCard  key={item.id} task={item.data} />;
                if (item.kind === "fund")  return <FundExploreCard  key={item.id} fund={item.data} />;
              })}
            </div>
          ) : null;
        })()}

        {/* Empty */}
        {!anythingLoading && !eventsLoading && !pollsLoading && !tasksLoading && !fundsLoading &&
          visibleChannels.length === 0 &&
          visibleEvents.length === 0 &&
          visiblePolls.length === 0 && visibleTasks.length === 0 &&
          visibleFunds.length === 0 && visiblePeople.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-20 w-20 rounded-[32px] bg-muted/30 flex items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-xl font-bold tracking-tight text-black">
              {search ? "No results found" : "Nothing here yet"}
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "Try different keywords" : "Content will appear as the network grows"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared section wrapper ─── */
function Section({ title, icon: Icon, accent, children }: {
  title: string; icon: React.ElementType; accent: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-7 w-7 rounded-xl ${accent} text-white flex items-center justify-center shrink-0`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[16px] font-black tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ── Event explore card ─── */
function EventExploreCard({ event }: { event: ExploreItem }) {
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-[24px] p-4 hover:shadow-md transition-all">
      <ChannelBadge channel={event.cityId} color="teal" />
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 text-2xl">
          📅
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black tracking-tight leading-snug">{event.title}</p>
          {event.description && (
            <p className="text-[13px] text-[#666] mt-1 line-clamp-2">{event.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {event.location && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                <MapPin className="h-3 w-3" />{event.location}
              </span>
            )}
            {event.participants > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                <Users className="h-3 w-3" />{event.participants}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Poll explore card ─── */
function PollExploreCard({ poll }: { poll: Poll }) {
  const totalVotes = Object.values(poll.votes ?? {}).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-[24px] p-4 hover:shadow-md transition-all">
      <ChannelBadge channel={poll.user.cityId} color="rose" />
      <p className="text-[15px] font-black tracking-tight leading-snug mb-3">{poll.question}</p>
      <div className="flex flex-col gap-1.5">
        {poll.options.slice(0, 3).map((opt) => {
          const votes = poll.votes?.[opt.id] ?? 0;
          const pct   = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return (
            <div key={opt.id} className="relative h-8 rounded-xl overflow-hidden bg-[#f5f5f5]">
              <div className="absolute inset-y-0 left-0 bg-rose-100" style={{ width: `${pct}%` }} />
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className="text-[12px] font-bold truncate">{opt.text}</span>
                <span className="text-[11px] font-black text-muted-foreground ml-2 shrink-0">{pct}%</span>
              </div>
            </div>
          );
        })}
        {poll.options.length > 3 && (
          <p className="text-[11px] font-bold text-muted-foreground px-1">+{poll.options.length - 3} more options</p>
        )}
      </div>
      <p className="text-[11px] font-bold text-muted-foreground mt-2">{totalVotes} votes</p>
    </div>
  );
}

/* ── Task explore card ─── */
function TaskExploreCard({ task }: { task: Task }) {
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-[24px] p-4 hover:shadow-md transition-all">
      <ChannelBadge channel={task.location} color="amber" />
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 text-2xl">
          {task.isUrgent ? "🚨" : "✅"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-black tracking-tight leading-snug">{task.title}</p>
            {task.isUrgent && (
              <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                Urgent
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-[13px] text-[#666] mt-1 line-clamp-2">{task.description}</p>
          )}
          {task.reward && (
            <span className="inline-block mt-2 text-[11px] font-black bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
              {task.reward}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Fund explore card ─── */
function FundExploreCard({ fund }: { fund: Crowdfund }) {
  const pct = fund.goal > 0 ? Math.min(Math.round((fund.raised / fund.goal) * 100), 100) : 0;
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-[24px] p-4 hover:shadow-md transition-all">
      <ChannelBadge channel={fund.location} color="purple" />
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 text-2xl">
          💜
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black tracking-tight leading-snug">{fund.title}</p>
          {fund.description && (
            <p className="text-[13px] text-[#666] mt-1 line-clamp-2">{fund.description}</p>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[12px] font-black text-purple-600">{pct}% funded</span>
        <span className="text-[12px] font-bold text-muted-foreground">
          {fund.raised} / {fund.goal} SOL
        </span>
      </div>
    </div>
  );
}

/* ── Channel badge (shown on each card) ─── */
function ChannelBadge({ channel, color }: { channel?: string; color: string }) {
  if (!channel || channel === "general" || channel === "") return null;
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${colorMap[color] ?? "bg-[#f5f5f5] text-[#666]"}`}>
      <Hash className="h-2.5 w-2.5" />
      {channel}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => <div key={i} className="h-24 rounded-[24px] bg-[#ececec] animate-pulse" />)}
    </div>
  );
}

/** Plain <img> avatar — avoids next/image optimisation overhead for small
 *  thumbnails and handles broken URLs gracefully with an initials fallback. */
function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string; size?: number }) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0 text-[#999] font-black text-xs"
      >
        {initial}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? "avatar"}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
