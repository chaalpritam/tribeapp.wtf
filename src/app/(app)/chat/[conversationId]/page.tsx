"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useTribeDmKey } from "@/hooks/use-tribe-dm-key";
import { useTribeDmMessages } from "@/hooks/use-tribe-dm-messages";

function peerTidFromConversationId(
  conversationId: string,
  selfTid: number
): number | null {
  const [a, b] = conversationId.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  if (a === selfTid) return b;
  if (b === selfTid) return a;
  return null;
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId: rawId } = use(params);
  const conversationId = decodeURIComponent(rawId);
  const router = useRouter();
  const identity = useTribeIdentityStore((s) => s.identity);
  useTribeDmKey();

  const peerTid = useMemo(
    () =>
      identity ? peerTidFromConversationId(conversationId, identity.tid) : null,
    [conversationId, identity]
  );

  const { messages, sending, error, send } = useTribeDmMessages({
    conversationId,
    recipientTid: peerTid,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !peerTid) return;
    try {
      await send(text);
      setInput("");
    } catch {
      // surfaced via `error`
    }
  };

  if (!identity) {
    return (
      <div className="flex h-screen items-center justify-center text-center px-6">
        <div>
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400 mb-3" />
          <p className="text-sm text-muted-foreground">
            Sign in to view this conversation
          </p>
        </div>
      </div>
    );
  }

  if (peerTid === null) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">Chat</h1>
        </div>
        <div className="flex flex-1 items-center justify-center text-center px-6">
          <div>
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-400 mb-3" />
            <p className="text-sm text-muted-foreground">
              You aren&apos;t a participant in this conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">tid:{peerTid}</h1>
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> end-to-end encrypted
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const mine = parseInt(msg.sender_tid, 10) === identity.tid;
          return (
            <div
              key={msg.hash}
              className={cn("flex gap-2", mine && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-indigo-500 text-white rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                {msg.text || (
                  <span className="italic opacity-70">
                    [unable to decrypt]
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
            {error.message}
          </div>
        )}
      </div>

      <div className="border-t bg-background p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-full border bg-muted/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !peerTid}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
