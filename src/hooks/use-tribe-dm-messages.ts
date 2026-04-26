"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchDecryptedMessages,
  sendDm,
  type DecryptedDm,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useTribeRealtime } from "./use-tribe-realtime";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

interface UseTribeDmMessagesOptions {
  conversationId: string | null;
  recipientTid: number | null;
}

export function useTribeDmMessages({
  conversationId,
  recipientTid,
}: UseTribeDmMessagesOptions) {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [messages, setMessages] = useState<DecryptedDm[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!identity || !conversationId) return;
    setLoading(true);
    try {
      const list = await fetchDecryptedMessages(conversationId, identity.tid);
      setMessages(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [identity, conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Push-based: refresh when the hub announces a new DM in this convo.
  useTribeRealtime("new_dm", (data) => {
    const evt = data as { conversationId?: string };
    if (!evt?.conversationId || evt.conversationId === conversationId) {
      void load();
    }
  });

  const send = useCallback(
    async (plaintext: string) => {
      if (!identity || !recipientTid) {
        throw new Error("Not signed in or no recipient");
      }
      setSending(true);
      try {
        const secret = fromBase64(identity.appKeySecret);
        const result = await sendDm(
          identity.tid,
          recipientTid,
          plaintext,
          secret
        );
        await load();
        return result;
      } finally {
        setSending(false);
      }
    },
    [identity, recipientTid, load]
  );

  return { messages, loading, sending, error, send, refresh: load };
}
