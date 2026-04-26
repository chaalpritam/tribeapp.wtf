"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useTribeRealtime } from "./use-tribe-realtime";

export type HubNotificationType =
  | "follow"
  | "reaction"
  | "reply"
  | "tip"
  | "mention";

export interface HubNotification {
  type: HubNotificationType;
  actor_tid: string;
  target_hash: string | null;
  preview: string | null;
  created_at: string;
}

export function useTribeNotifications() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const [notifications, setNotifications] = useState<HubNotification[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!identity) {
      setNotifications([]);
      setCount(0);
      return;
    }
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        hubFetch(`/v1/notifications/${identity.tid}?limit=50`),
        hubFetch(`/v1/notifications/${identity.tid}/count`),
      ]);
      if (listRes.ok) {
        const json = (await listRes.json()) as {
          notifications: HubNotification[];
        };
        setNotifications(json.notifications);
      }
      if (countRes.ok) {
        const json = (await countRes.json()) as { count: number };
        setCount(json.count);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [identity]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Refresh on any new tweet — covers reactions / replies / mentions
  // / new follows. Granular events would be cheaper but this is fine.
  useTribeRealtime("new_message", () => {
    void refresh();
  });

  return { notifications, count, loading, error, refresh };
}
