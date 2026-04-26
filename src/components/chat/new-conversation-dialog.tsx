"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, MessageSquare, Loader2, User as UserIcon, CheckCircle2 } from "lucide-react";
import { useConversations } from "@/hooks/use-conversations";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useSocialContacts, SocialContact } from "@/hooks/use-social-contacts";
import { resolveFidToXmtp, checkXmtpReachability } from "@/lib/xmtp/resolution";
import { resolveIdentifier } from "@/lib/xmtp/name-resolver";

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

export function NewConversationDialog() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { status, connect } = useXmtpStore();
  const { createDm } = useConversations();
  const { xmtpFollowing, isLoading: isSocialLoading } = useSocialContacts();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FarcasterUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isReachable, setIsReachable] = useState<boolean | null>(null);

  // Auto-connect XMTP if needed
  useEffect(() => {
    if (status === "idle" && profile) {
      connect("farcaster", profile);
    }
  }, [status, profile, connect]);

  // Search for Farcaster users
  useEffect(() => {
    if (search.length < 2 || search.startsWith("0x")) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/neynar/users/search?q=${search}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.users || []);
      } catch {
        setError("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectUser = async (user: FarcasterUser) => {
    setSelectedUser(user);
    setSearch(user.username);
    setResults([]);
    setLoading(true);
    setError(null);
    setIsReachable(null);

    try {
      const resolved = await resolveFidToXmtp(user.fid);
      if (!resolved) {
        setError("Could not find an Ethereum address for this user");
        return;
      }
      setResolvedAddress(resolved.address);

      const reachable = await checkXmtpReachability(resolved.address);
      setIsReachable(!!reachable);

      if (!reachable) {
        setError("This user hasn't enabled XMTP yet");
      }
    } catch {
      setError("Failed to verify user identity");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSocialContact = async (contact: SocialContact) => {
    setSelectedUser({
      fid: contact.fid,
      username: contact.username,
      display_name: contact.displayName,
      pfp_url: contact.pfpUrl,
    });
    setSearch(contact.username);
    setResolvedAddress(contact.address);
    setIsReachable(contact.isXmtpSupported);
    if (!contact.isXmtpSupported) {
      setError("This user hasn't enabled XMTP yet");
    } else {
      setError(null);
    }
  };

  const isValidAddress =
    (search.length === 42 && search.toLowerCase().startsWith("0x")) ||
    search.includes(".");

  const checkIdentifier = async (id: string) => {
    setLoading(true);
    setError(null);
    setIsReachable(null);

    try {
      const address = await resolveIdentifier(id);
      if (!address) {
        setError("Could not resolve this handle or address");
        setLoading(false);
        return;
      }
      setResolvedAddress(address);

      const reachable = await checkXmtpReachability(address);
      setIsReachable(!!reachable);
      if (!reachable) {
        setError(`${id.includes(".") ? "The owner of this handle" : "This address"} is not registered on XMTP`);
      }
    } catch {
      setError("Failed to verify identifier");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDm = async () => {
    const targetAddress = resolvedAddress || (isValidAddress ? search : null);
    if (!targetAddress || !isReachable) return;

    setLoading(true);
    setError(null);

    try {
      const conversationId = await createDm(targetAddress);
      router.push(`/chat/${conversationId}`);
    } catch {
      setError("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2.5 hover:bg-[#f5f5f5] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black tracking-tight">New Message</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-sans">
        {status === "connecting" && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Initializing secure channel...</p>
          </div>
        )}

        {(status === "connected" || status === "idle") && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Input */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-[#999] uppercase tracking-[0.2em] px-1">
                To:
              </label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#bbb] group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Farcaster @username, ENS or 0x address"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedUser(null);
                    setResolvedAddress(null);
                    setIsReachable(null);
                    setError(null);
                  }}
                  onBlur={() => {
                    if (isValidAddress) checkIdentifier(search);
                  }}
                  className="w-full rounded-[24px] border border-[#f0f0f0] bg-white py-5 pl-14 pr-4 text-[16px] font-bold outline-none transition-all focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/20 shadow-sm"
                />
                {loading && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {results.length > 0 && (
                <div className="overflow-hidden rounded-[28px] border border-[#f0f0f0] bg-white shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  {results.slice(0, 5).map((user) => (
                    <button
                      key={user.fid}
                      onClick={() => handleSelectUser(user)}
                      className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-indigo-50/30 border-b border-[#f0f0f0] last:border-0"
                    >
                      {user.pfp_url ? (
                        <img src={user.pfp_url} alt="" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-black/5" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <p className="truncate text-[15px] font-black text-black">{user.display_name}</p>
                        <p className="truncate text-xs font-bold text-muted-foreground uppercase tracking-widest">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Contacts */}
            {!search && (
              <div className="space-y-5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-black text-[#999] uppercase tracking-[0.2em]">
                    Suggested Connections
                  </h3>
                  {isSocialLoading && <Loader2 className="h-3 w-3 animate-spin text-[#999]" />}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {xmtpFollowing.slice(0, 6).map((contact) => (
                    <button
                      key={contact.fid}
                      onClick={() => handleSelectSocialContact(contact)}
                      className="flex items-center gap-4 p-4 rounded-[28px] bg-white border border-[#f0f0f0] transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 active:scale-[0.98] group"
                    >
                      <div className="relative">
                        <img
                          src={contact.pfpUrl}
                          alt=""
                          className="h-12 w-12 rounded-[18px] object-cover shadow-sm bg-muted ring-1 ring-black/5"
                        />
                        {contact.isXmtpSupported && (
                          <div className="absolute -right-1.5 -bottom-1.5 h-6 w-6 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-md">
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[15px] font-black text-black truncate tracking-tight">{contact.displayName}</p>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                          @{contact.username}
                        </p>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                        Secure
                      </div>
                    </button>
                  ))}

                  {!isSocialLoading && xmtpFollowing.length === 0 && (
                    <div className="py-12 text-center bg-white rounded-[40px] border border-dashed border-[#eee]">
                      <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                      <p className="text-xs font-bold text-[#bbb] uppercase tracking-widest">Your circle is quiet right now</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selection Preview */}
            {selectedUser && (
              <div className="rounded-[32px] border border-indigo-500/10 bg-gradient-to-br from-white to-indigo-50/10 p-7 shadow-2xl shadow-indigo-500/5 flex items-center gap-5 ring-1 ring-black/5 animate-in zoom-in-95 duration-300">
                <img src={selectedUser.pfp_url} alt="" className="h-20 w-20 rounded-[28px] object-cover shadow-2xl ring-4 ring-white" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black tracking-tight truncate">{selectedUser.display_name}</h2>
                    {isReachable && <CheckCircle2 className="h-6 w-6 text-green-500 fill-green-50" />}
                  </div>
                  <p className="text-[13px] font-bold text-[#777] uppercase tracking-widest mb-2">@{selectedUser.username}</p>
                  {resolvedAddress && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f9f9f9] border border-[#f0f0f0]">
                      <Globe className="h-3 w-3 text-[#bbb]" />
                      <p className="text-[10px] font-mono font-bold text-[#aaa] truncate max-w-[150px]">
                        {resolvedAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-[24px] border border-red-100 bg-red-50/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest leading-loose text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Start Chat Button */}
            <div className="pt-4">
              <button
                onClick={handleStartDm}
                disabled={!(resolvedAddress || isValidAddress) || !isReachable || loading}
                className="w-full rounded-[28px] bg-black py-6 text-[17px] font-black text-white transition-all active:scale-[0.98] hover:bg-[#1a1a1a] disabled:opacity-20 disabled:grayscale shadow-2xl shadow-black/20 group"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="uppercase tracking-[0.1em]">Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span>START SECURE CHAT</span>
                  </div>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ddd] text-center">
                AUTHENTICATED • ENCRYPTED • PERMISSIONLESS
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Globe({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
    </svg>
  )
}
