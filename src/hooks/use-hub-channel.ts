"use client";

import { useEffect, useState } from "react";
import { getChannel, type ChannelInfo } from "@/lib/tribe";

/**
 * Single-channel read. Returns the hub-shape ChannelInfo for the
 * given slug, or null while loading / when the slug is unknown.
 *
 * The detail page wraps the result in `channelInfoToTribe` so the
 * existing UI components keep their props stable.
 */
export function useHubChannel(id: string | null | undefined) {
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setChannel(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getChannel(id)
      .then((info) => {
        if (cancelled) return;
        setChannel(info);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { channel, loading, error };
}
