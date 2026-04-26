"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";

export interface TribeKarma {
  tid: string;
  total: number;
  level: number;
  breakdown: {
    tweets: number;
    reactions_received: number;
    followers: number;
    tips_received: number;
    tasks_completed: number;
  };
  weights: Record<string, number>;
}

export function useTribeKarma(tid: number | null | undefined) {
  const [karma, setKarma] = useState<TribeKarma | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (tid === null || tid === undefined) {
      setKarma(null);
      return;
    }
    setLoading(true);
    try {
      const res = await hubFetch(`/v1/users/${tid}/karma`);
      if (!res.ok) throw new Error(`Karma fetch failed: ${res.statusText}`);
      const json = (await res.json()) as TribeKarma;
      setKarma(json);
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

  return { karma, loading, error, refresh };
}
