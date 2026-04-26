"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, ImagePlus, Smile, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { useMessages } from "@/hooks/use-messages";
import { getIdentityByInboxId } from "@/lib/xmtp/identity-map";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const { status, conversations } = useXmtpStore();
  const { messages, loadMessages, sendMessage } = useMessages(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationName = conversation?.name ?? "Chat";

  useEffect(() => {
    if (status === "connected") {
      loadMessages();
    }
  }, [status, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(input);
      setInput("");
    } catch {
      // Message failed to send
    } finally {
      setSending(false);
    }
  };

  if (status !== "connected") {
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
            <h1 className="text-base font-bold">Chat</h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          {status === "connecting" ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-muted-foreground">Connecting...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-sm text-muted-foreground">
                Not connected to messaging
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">{conversationName}</h1>
          {conversation?.isGroup && (
            <p className="text-xs text-muted-foreground">Group chat</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex justify-center mb-4">
            <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">
              End-to-end encrypted
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const senderIdentity = !msg.isFromCurrentUser
            ? getIdentityByInboxId(msg.senderInboxId)
            : null;
          const senderName =
            senderIdentity?.displayName ??
            senderIdentity?.username ??
            msg.senderInboxId.slice(0, 8);

          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.isFromCurrentUser && "flex-row-reverse"
              )}
            >
              {!msg.isFromCurrentUser && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden shadow-sm">
                  {senderIdentity?.pfpUrl ? (
                    <img src={senderIdentity.pfpUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {senderName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%]",
                  msg.isFromCurrentUser && "items-end"
                )}
              >
                {!msg.isFromCurrentUser && conversation?.isGroup && (
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    {senderName}
                  </p>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm",
                    msg.isFromCurrentUser
                      ? "bg-indigo-500 text-white rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
                <p
                  className={cn(
                    "mt-0.5 text-xs text-muted-foreground",
                    msg.isFromCurrentUser && "text-right"
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t bg-background p-3">
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <ImagePlus className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="h-5 w-5" />
          </button>
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
            disabled={!input.trim() || sending}
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
