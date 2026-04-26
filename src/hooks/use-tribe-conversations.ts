"use client";

import { useCallback, useEffect, useState } from "react";
import { listDmConversations, type DmConversation } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

export function useTribeConversations() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!identity) {
      setConversations([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listDmConversations(identity.tid);
      setConversations(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [identity]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, loading, error, refresh };
}
