"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Hash, Loader2, Search, User, MapPin,
  Calendar, BarChart3, CheckCircle, Banknote, Users,
  MessageSquare, Heart, Repeat2, ArrowRight,
} from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { AppHeader } from "@/components/layout/app-header";
import { useTribeSearch } from "@/hooks/use-tribe-search";
import { useTribeFeed } from "@/hooks/use-tribe-feed";
import { useHubChannels } from "@/hooks/use-hub-channels";
import { useOnchainEvents } from "@/hooks/use-onchain-events";
import { useOnchainPolls } from "@/hooks/use-onchain-polls";
import { useOnchainTasks } from "@/hooks/use-onchain-tasks";
import { useOnchainCrowdfunds } from "@/hooks/use-onchain-crowdfunds";
import { formatNumber } from "@/lib/utils";
import { tribeTweetToTweet } from "@/lib/tribe";
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
  const { tweets: globalTweets, loading: tweetsLoading } = useTribeFeed({ enabled: true });

  const interestChannels = useMemo(
    () => allHubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_INTEREST),
    [allHubChannels]
  );
  const cityChannels = useMemo(
    () => allHubChannels.filter((c) => Number(c.kind) === CHANNEL_KIND_CITY),
    [allHubChannels]
  );

  const adaptedTweets = useMemo(
    () => globalTweets.map((t) => tribeTweetToTweet(t, { cityId: currentCity?.id ?? "" })),
    [globalTweets, currentCity?.id]
  );

  const { events,     loading: eventsLoading }  = useOnchainEvents({ cityId: "" });
  const { polls,      loading: pollsLoading }    = useOnchainPolls({ cityId: "" });
  const { tasks,      loading: tasksLoading }    = useOnchainTasks({ cityId: "" });
  const { crowdfunds, loading: fundsLoading }    = useOnchainCrowdfunds({ cityId: "" });

  // Filtered lists
  const visibleCities   = !search ? cityChannels     : cityChannels.filter((c)   => (c.name ?? c.id).toLowerCase().includes(q));
  const visibleChannels = !search ? interestChannels : interestChannels.filter((c) => (c.name ?? c.id).toLowerCase().includes(q));
  const visibleTweets   = !search ? adaptedTweets    : adaptedTweets.filter((t)  => t.caption.toLowerCase().includes(q) || (t.user.username + t.user.displayName).toLowerCase().includes(q));
  const visibleEvents   = !search ? (events as ExploreItem[])   : (events as ExploreItem[]).filter((e) => e.title.toLowerCase().includes(q));
  const visiblePolls    = !search ? (polls as Poll[])            : (polls as Poll[]).filter((p) => p.question.toLowerCase().includes(q));
  const visibleTasks    = !search ? (tasks as Task[])            : (tasks as Task[]).filter((t) => t.title.toLowerCase().includes(q));
  const visibleFunds    = !search ? (crowdfunds as Crowdfund[])  : (crowdfunds as Crowdfund[]).filter((f) => f.title.toLowerCase().includes(q));
  const visiblePeople   = isSearching ? hubUsers : [];

  const anythingLoading = channelsLoading || tweetsLoading;

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
                    <div className="h-11 w-11 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 text-base font-black">
                      {label.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold truncate">{label}</p>
                      <p className="text-[11px] font-bold text-muted-foreground">@{u.username || `#${u.tid}`}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#ccc] shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Cities ── */}
        {(visibleCities.length > 0 || channelsLoading) && (
          <Section title="Cities" icon={MapPin} accent="bg-emerald-500">
            {channelsLoading && cityChannels.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {[1,2,3].map((i) => <div key={i} className="w-40 h-52 rounded-[28px] bg-[#ececec] animate-pulse shrink-0" />)}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {visibleCities.map((c) => {
                  const curated = curatedCities.find((x) => x.id === c.id);
                  const img = curated?.imageUrl || DEFAULT_CITY_IMAGE;
                  const isCurrent = c.id === currentCity?.id;
                  return (
                    <Link key={c.id} href={`/tribes/${c.id}`}
                      className="relative w-40 h-52 rounded-[28px] overflow-hidden shrink-0 group shadow-sm hover:shadow-xl transition-all active:scale-95"
                    >
                      <Image src={img} alt={c.name || c.id} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white text-[14px] font-black leading-tight">{c.name?.trim() || c.id}</p>
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">
                          {curated?.country ?? "Protocol"}
                        </p>
                        {(c.member_count ?? 0) > 0 && (
                          <p className="text-white/70 text-[10px] font-bold mt-1">
                            {formatNumber(c.member_count ?? 0)} members
                          </p>
                        )}
                      </div>
                      {isCurrent && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow">
                          Current
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

        {/* ── Tweets ── */}
        {(visibleTweets.length > 0 || tweetsLoading) && (
          <Section title="Latest Posts" icon={MessageSquare} accent="bg-sky-500">
            {tweetsLoading && adaptedTweets.length === 0 ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map((i) => <div key={i} className="h-28 rounded-[24px] bg-[#ececec] animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleTweets.map((tweet) => (
                  <div key={tweet.id} className="bg-white border border-[#f0f0f0] rounded-[24px] p-4 hover:shadow-md transition-all">
                    {/* Channel badge */}
                    {tweet.channel?.id && tweet.channel.id !== "general" && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="h-5 w-5 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center">
                          <Hash className="h-3 w-3" />
                        </div>
                        <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">
                          {tweet.channel.name || tweet.channel.id}
                        </span>
                      </div>
                    )}
                    {/* Author */}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      {tweet.user.avatarUrl ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                          <Image src={tweet.user.avatarUrl} alt={tweet.user.displayName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-[#999]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold leading-none truncate">
                          {tweet.user.displayName !== tweet.user.username
                            ? tweet.user.displayName
                            : `@${tweet.user.username}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{tweet.timestamp}</p>
                      </div>
                    </div>
                    {/* Content */}
                    <p className="text-[14px] font-medium text-[#222] leading-relaxed line-clamp-3">
                      {tweet.caption}
                    </p>
                    {/* Image embed */}
                    {tweet.imageUrl && (
                      <div className="relative mt-3 rounded-2xl overflow-hidden aspect-video">
                        <Image src={tweet.imageUrl} alt="embed" fill className="object-cover" />
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f5f5f5]">
                      <span className="flex items-center gap-1 text-[12px] font-bold text-muted-foreground">
                        <Heart className="h-3.5 w-3.5" /> {formatNumber(tweet.likes)}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] font-bold text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> {formatNumber((tweet.replyCount ?? 0) + tweet.comments.length)}
                      </span>
                      {(tweet.recasts ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-[12px] font-bold text-muted-foreground">
                          <Repeat2 className="h-3.5 w-3.5" /> {formatNumber(tweet.recasts ?? 0)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Events ── */}
        {(visibleEvents.length > 0 || eventsLoading) && (
          <Section title="Events" icon={Calendar} accent="bg-teal-500">
            {eventsLoading && events.length === 0 ? <SkeletonList /> : (
              <div className="flex flex-col gap-3">
                {visibleEvents.map((e) => (
                  <EventExploreCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Polls ── */}
        {(visiblePolls.length > 0 || pollsLoading) && (
          <Section title="Polls" icon={BarChart3} accent="bg-rose-500">
            {pollsLoading && polls.length === 0 ? <SkeletonList /> : (
              <div className="flex flex-col gap-3">
                {visiblePolls.map((p) => (
                  <PollExploreCard key={p.id} poll={p as Poll} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Tasks ── */}
        {(visibleTasks.length > 0 || tasksLoading) && (
          <Section title="Tasks" icon={CheckCircle} accent="bg-amber-500">
            {tasksLoading && tasks.length === 0 ? <SkeletonList /> : (
              <div className="flex flex-col gap-3">
                {visibleTasks.map((t) => (
                  <TaskExploreCard key={t.id} task={t as Task} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Funds ── */}
        {(visibleFunds.length > 0 || fundsLoading) && (
          <Section title="Funds" icon={Banknote} accent="bg-purple-500">
            {fundsLoading && crowdfunds.length === 0 ? <SkeletonList /> : (
              <div className="flex flex-col gap-3">
                {visibleFunds.map((f) => (
                  <FundExploreCard key={f.id} fund={f as Crowdfund} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Empty */}
        {!anythingLoading && !eventsLoading &&
          visibleCities.length === 0 && visibleChannels.length === 0 &&
          visibleTweets.length === 0 && visibleEvents.length === 0 &&
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
