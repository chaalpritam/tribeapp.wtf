"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  Plus,
  Loader2,
  AlertTriangle,
  User,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useTribeDmKey } from "@/hooks/use-tribe-dm-key";
import { useTribeConversations } from "@/hooks/use-tribe-conversations";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const dmKey = useTribeDmKey();
  const {
    conversations,
    loading,
    error: convError,
    refresh,
  } = useTribeConversations();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      `tid ${c.peer_tid}`.toLowerCase().includes(q)
    );
  }, [search, conversations]);

  if (!identity) {
    return (
      <div className="bg-[#fcfcfc] min-h-screen">
        <AppHeader title="Chat" />
        <div className="flex h-[60vh] flex-col items-center justify-center text-center px-6">
          <div className="rounded-[32px] bg-amber-50 p-8 mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <p className="text-lg font-black tracking-tight">Sign in to chat</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground max-w-xs">
            DMs ride on your Tribe identity. Connect your Solana wallet from
            the onboarding flow to claim a TID.
          </p>
          <Link
            href="/onboarding/connect"
            className="mt-6 rounded-2xl bg-black text-white px-6 py-3 text-sm font-bold"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Chat" />

      <div className="sticky top-[57px] sm:top-[73px] z-30 bg-white/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by TID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3.5 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
            />
          </div>
          <Link
            href="/chat/new"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white transition-opacity hover:opacity-90"
            aria-label="New chat"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {dmKey.status === "syncing" && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Publishing your DM key to the hub…
          </div>
        )}

        {dmKey.status === "error" && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
            DM key sync failed: {dmKey.error?.message ?? "unknown error"}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading && conversations.length === 0 && (
            <div className="flex h-[30vh] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {convError && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
              {convError.message}{" "}
              <button onClick={refresh} className="underline ml-1">
                retry
              </button>
            </div>
          )}

          {filtered.map((convo) => {
            const lastSeen = new Date(convo.last_message_at);
            return (
              <Link
                key={convo.id}
                href={`/chat/${encodeURIComponent(convo.id)}`}
                className="group flex items-center gap-4 p-4 sm:p-5 rounded-[28px] bg-white border border-[#f0f0f0] transition-all hover:shadow-xl hover:shadow-black/[0.04] hover:border-indigo-500/10 active:scale-[0.99] shadow-sm"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-[22px] shadow-inner shrink-0 bg-teal-50 ring-1 ring-black/5">
                  <User className="h-6 w-6 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[16px] font-black tracking-tight text-black truncate">
                      tid:{convo.peer_tid}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-[#f9f9f9] px-2 py-1 rounded-lg">
                      {formatDistanceToNow(lastSeen, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="truncate text-[12px] font-medium text-[#999] uppercase tracking-widest">
                    encrypted thread · {convo.id}
                  </p>
                </div>
              </Link>
            );
          })}

          {!loading && conversations.length === 0 && (
            <div className="flex h-[40vh] flex-col items-center justify-center space-y-6 text-center bg-white rounded-[40px] border border-[#f0f0f0] p-10">
              <div className="rounded-[32px] bg-muted/20 p-8 ring-8 ring-muted/10">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="max-w-[260px]">
                <p className="text-xl font-black tracking-tight text-black">
                  No DMs yet
                </p>
                <p className="text-[13px] font-bold text-muted-foreground mt-2 leading-relaxed">
                  Tap the + above to start a thread with another Tribe ID.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
