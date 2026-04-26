"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  MessageSquare,
  Plus,
  Loader2,
  AlertTriangle,
  Users,
  User,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useConversations } from "@/hooks/use-conversations";
import { useSocialContacts } from "@/hooks/use-social-contacts";

export default function ChatPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { status, error, connect } = useXmtpStore();
  const { conversations, loadConversations, createDm } = useConversations();
  const { xmtpFollowing, xmtpFollowers, isLoading: isSocialLoading } = useSocialContacts();
  const [search, setSearch] = useState("");
  const [loadingContactId, setLoadingContactId] = useState<number | null>(null);

  const handleStartSocialDm = async (address: string, fid: number) => {
    // Check if we already have a conversation with this peer
    const existing = conversations.find(c => c.peerAddress?.toLowerCase() === address.toLowerCase());
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    setLoadingContactId(fid);
    try {
      const convoId = await createDm(address);
      router.push(`/chat/${convoId}`);
    } catch (err) {
      console.error("Failed to start DM from social list:", err);
    } finally {
      setLoadingContactId(null);
    }
  };

  useEffect(() => {
    if (status === "idle" && profile) {
      connect("farcaster", profile);
    } else if (status === "connected") {
      loadConversations();
    }
  }, [status, profile, connect, loadConversations]);

  const filtered = search
    ? conversations.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    : conversations;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Chat" />

      {/* Search Header */}
      <div className="sticky top-[57px] sm:top-[73px] z-30 bg-white/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#f0f0f0] bg-[#f9f9f9] py-3.5 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/5"
            />
          </div>
          <Link
            href="/chat/new"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Connection States */}
        {status === "connecting" && (
          <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="h-16 w-16 rounded-[24px] bg-indigo-50 flex items-center justify-center shadow-inner">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-black">
                Initializing Secure Chat
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                End-to-end encryption active
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="rounded-[32px] bg-red-50 p-8 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <div className="max-w-xs">
              <p className="text-xl font-black tracking-tight text-black">
                Connection failed
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-2 mb-6">
                {error ?? "Could not connect to the secure messaging network."}
              </p>
              <button
                onClick={() => connect("farcaster", profile)}
                className="px-8 py-3 bg-black text-white rounded-2xl font-bold text-sm transition-transform active:scale-95"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {status === "unsupported" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-[32px] bg-amber-50 p-8 mb-6">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="max-w-xs">
              <p className="text-xl font-black tracking-tight text-black">
                Browser not supported
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-2 leading-relaxed">
                Your browser lacks the cryptographic features required for end-to-end encryption.
              </p>
              <p className="mt-4 text-xs font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl">
                Please use Chrome, Firefox, or Edge.
              </p>
            </div>
          </div>
        )}

        {/* Unified Connected View */}
        {status === "connected" && (
          <div className="flex flex-col gap-10">
            {/* Horizontal Contact Lists */}
            {!search && (
              <div className="space-y-10">
                {/* Following Section */}
                {xmtpFollowing.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#999]">
                        Suggested (People You Follow)
                      </h3>
                      {isSocialLoading && <Loader2 className="h-3 w-3 animate-spin text-[#999]" />}
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                      {xmtpFollowing.map((contact) => (
                        <button
                          key={contact.fid}
                          onClick={() => handleStartSocialDm(contact.address, contact.fid)}
                          disabled={loadingContactId === contact.fid}
                          className="flex flex-col items-center gap-2.5 group shrink-0"
                        >
                          <div className="relative">
                            <div className="h-[76px] w-[76px] rounded-[30px] p-1 bg-gradient-to-tr from-indigo-500 via-indigo-400 to-purple-500 shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
                              <div className="h-full w-full rounded-[26px] bg-white p-0.5">
                                <img
                                  src={contact.pfpUrl}
                                  alt=""
                                  className="h-full w-full rounded-[24px] object-cover bg-muted ring-1 ring-black/5"
                                />
                              </div>
                            </div>
                            <div className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-green-500 border-[5px] border-[#fcfcfc] flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                            {loadingContactId === contact.fid && (
                              <div className="absolute inset-0 rounded-[30px] bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <Loader2 className="h-7 w-7 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] font-bold text-black max-w-[84px] truncate tracking-tight">
                            {contact.displayName.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Followers Section */}
                {xmtpFollowers.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#999]">
                        People Following You
                      </h3>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                      {xmtpFollowers.map((contact) => (
                        <button
                          key={contact.fid}
                          onClick={() => handleStartSocialDm(contact.address, contact.fid)}
                          disabled={loadingContactId === contact.fid}
                          className="flex flex-col items-center gap-2.5 group shrink-0"
                        >
                          <div className="relative">
                            <div className="h-[76px] w-[76px] rounded-[30px] p-1 bg-gradient-to-tr from-teal-500 via-emerald-400 to-indigo-500 shadow-xl shadow-teal-500/10 group-hover:scale-105 transition-all duration-300">
                              <div className="h-full w-full rounded-[26px] bg-white p-0.5">
                                <img
                                  src={contact.pfpUrl}
                                  alt=""
                                  className="h-full w-full rounded-[24px] object-cover bg-muted ring-1 ring-black/5"
                                />
                              </div>
                            </div>
                            <div className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-green-500 border-[5px] border-[#fcfcfc] flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                            {loadingContactId === contact.fid && (
                              <div className="absolute inset-0 rounded-[30px] bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <Loader2 className="h-7 w-7 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] font-bold text-black max-w-[84px] truncate tracking-tight">
                            {contact.displayName.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {!search && conversations.length > 0 && (
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#999] px-1">
                  Recent Conversations
                </h3>
              )}

              <div className="flex flex-col gap-3">
                {filtered.map((convo) => (
                  <Link
                    key={convo.id}
                    href={`/chat/${convo.id}`}
                    className={`group flex items-center gap-4 p-4 sm:p-5 rounded-[28px] bg-white border border-[#f0f0f0] transition-all hover:shadow-xl hover:shadow-black/[0.04] hover:border-indigo-500/10 active:scale-[0.99] ${convo.unreadCount > 0
                      ? "border-indigo-500/20 shadow-lg shadow-indigo-500/5 bg-indigo-50/5"
                      : "shadow-sm"
                      }`}
                  >
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-[22px] shadow-inner shrink-0 overflow-hidden ring-1 ring-black/5"
                      style={{
                        backgroundColor: convo.isGroup ? "#f5f3ff" : "#f0fdfa",
                      }}
                    >
                      {convo.imageUrl ? (
                        <img
                          src={convo.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : convo.isGroup ? (
                        <Users className="h-6 w-6 text-indigo-500" />
                      ) : (
                        <User className="h-6 w-6 text-teal-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[16px] font-black tracking-tight text-black truncate">
                          {convo.name}
                        </span>
                        {convo.lastMessageTime && (
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-[#f9f9f9] px-2 py-1 rounded-lg">
                            {convo.lastMessageTime}
                          </span>
                        )}
                      </div>
                      {convo.lastMessage && (
                        <p className={`truncate text-[14px] font-medium leading-relaxed ${convo.unreadCount > 0 ? "text-black font-bold" : "text-[#777]"}`}>
                          {convo.lastMessage}
                        </p>
                      )}
                    </div>

                    {convo.unreadCount > 0 && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white ring-4 ring-indigo-500/10">
                        {convo.unreadCount}
                      </div>
                    )}

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <MoreHorizontal className="h-5 w-5 text-[#bbb]" />
                    </div>
                  </Link>
                ))}

                {filtered.length === 0 && conversations.length > 0 && (
                  <div className="flex h-[30vh] flex-col items-center justify-center text-center p-8 bg-white rounded-[40px] border border-dashed border-[#eee]">
                    <Search className="h-8 w-8 text-[#ccc] mb-3" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.1em]">
                      No chats match &quot;{search}&quot;
                    </p>
                  </div>
                )}

                {conversations.length === 0 && (
                  <div className="flex h-[40vh] flex-col items-center justify-center space-y-6 text-center bg-white rounded-[40px] border border-[#f0f0f0] p-10">
                    <div className="rounded-[32px] bg-muted/20 p-8 ring-8 ring-muted/10">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div className="max-w-[240px]">
                      <p className="text-xl font-black tracking-tight text-black">
                        Start something
                      </p>
                      <p className="text-[13px] font-bold text-muted-foreground mt-2 leading-relaxed">
                        Message one of your suggested contacts above or start a new secure chat.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
