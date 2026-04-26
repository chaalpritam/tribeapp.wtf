"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/use-conversations";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { getConversationForTribe } from "@/lib/xmtp/identity-map";

interface TribeGroupChatProps {
  tribeId: string;
  tribeName: string;
  memberInboxIds?: string[];
}

export function TribeGroupChat({
  tribeId,
  tribeName,
  memberInboxIds = [],
}: TribeGroupChatProps) {
  const router = useRouter();
  const { status } = useXmtpStore();
  const { createTribeGroup } = useConversations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingConversationId = getConversationForTribe(tribeId);

  const handleJoinOrCreate = async () => {
    if (existingConversationId) {
      router.push(`/chat/${existingConversationId}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conversationId = await createTribeGroup(
        tribeId,
        tribeName,
        memberInboxIds
      );
      router.push(`/chat/${conversationId}`);
    } catch {
      setError("Failed to create group chat");
    } finally {
      setLoading(false);
    }
  };

  if (status !== "connected") {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground"
      >
        <MessageSquare className="h-4 w-4" />
        Chat unavailable
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleJoinOrCreate}
        disabled={loading}
        className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Users className="h-4 w-4" />
        )}
        {existingConversationId ? "Open Group Chat" : "Start Group Chat"}
      </button>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
