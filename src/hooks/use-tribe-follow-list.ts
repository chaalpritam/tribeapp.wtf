"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFollowers, fetchFollowing, type TribeUserSummary } from "@/lib/tribe";

export type FollowListKind = "followers" | "following";

export function useTribeFollowList(
  tid: number | null | undefined,
  kind: FollowListKind,
  enabled = true
) {
  const [users, setUsers] = useState<TribeUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (tid === null || tid === undefined || !enabled) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const result =
        kind === "followers"
          ? await fetchFollowers(String(tid))
          : await fetchFollowing(String(tid));
      setUsers(result.users ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [tid, kind, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { users, loading, error, refresh };
}
