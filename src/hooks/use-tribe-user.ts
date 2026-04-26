"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUser, type TribeUserSummary } from "@/lib/tribe";

export interface TribeUserWithProfile extends TribeUserSummary {
  profile?: {
    bio?: string;
    displayName?: string;
    pfpUrl?: string;
    url?: string;
    location?: string;
    city?: string;
  };
  custody_address?: string;
  followers_count?: number;
  following_count?: number;
}

/**
 * Fetch a single TID's full user record (custody address, registered
 * username, latest USER_DATA profile fields, follower/following
 * counts) from the hub.
 */
export function useTribeUser(tid: number | null | undefined) {
  const [user, setUser] = useState<TribeUserWithProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (tid === null || tid === undefined) {
      setUser(null);
      return;
    }
    setLoading(true);
    try {
      const result = (await fetchUser(String(tid))) as TribeUserWithProfile;
      setUser(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, loading, error, refresh };
}
