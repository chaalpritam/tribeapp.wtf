"use client";

import { useState, useCallback, useRef } from "react";
import type { Cast } from "@/types";

interface NeynarCast {
  hash: string;
  text: string;
  timestamp: string;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  };
  embeds?: { url?: string }[];
  viewer_context?: {
    liked: boolean;
    recasted: boolean;
  };
}

function neynarCastToAppCast(nc: NeynarCast): Cast {
  const imageEmbed = nc.embeds?.find(
    (e) => e.url && /\.(jpg|jpeg|png|gif|webp)/i.test(e.url)
  );

  return {
    id: nc.hash,
    castHash: nc.hash,
    user: {
      id: `fid-${nc.author.fid}`,
      username: nc.author.username,
      displayName: nc.author.display_name,
      avatarUrl: nc.author.pfp_url || "/default-avatar.png",
      cityId: "global",
      isVerified: true,
      farcasterFid: nc.author.fid,
    },
    caption: nc.text,
    imageUrl: imageEmbed?.url,
    likes: nc.reactions.likes_count,
    recasts: nc.reactions.recasts_count,
    comments: [],
    timestamp: new Date(nc.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    isLiked: nc.viewer_context?.liked ?? false,
    isSaved: false,
    tipCount: 0,
    totalTips: 0,
    cityId: "global",
    embeds: nc.embeds
      ?.filter((e): e is { url: string } => !!e.url)
      .map((e) => ({ url: e.url })),
  };
}

export function useCastSearch() {
  const [results, setResults] = useState<Cast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const lastQueryRef = useRef("");

  const search = useCallback(async (query: string, reset = true) => {
    if (!query.trim()) {
      setResults([]);
      setHasMore(false);
      return;
    }

    if (reset) {
      cursorRef.current = undefined;
      lastQueryRef.current = query;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: query, limit: "25" });
      if (cursorRef.current) params.set("cursor", cursorRef.current);

      const res = await fetch(`/api/neynar/search?${params}`);
      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      const casts = (data.result?.casts ?? []).map(neynarCastToAppCast);

      setResults((prev) => (reset ? casts : [...prev, ...casts]));
      cursorRef.current = data.result?.next?.cursor ?? undefined;
      setHasMore(!!data.result?.next?.cursor);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message ?? "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && lastQueryRef.current) {
      search(lastQueryRef.current, false);
    }
  }, [isLoading, hasMore, search]);

  return { results, isLoading, error, search, loadMore, hasMore };
}
