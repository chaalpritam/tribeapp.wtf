"use client";

import { useState, useCallback, useRef } from "react";
import type { Cast } from "@/types";

interface NeynarEmbed {
  url?: string;
  metadata?: {
    content_type?: string;
    image?: { width_px?: number; height_px?: number };
  };
}

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
  embeds?: NeynarEmbed[];
  viewer_context?: {
    liked: boolean;
    recasted: boolean;
  };
  channel?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

function isImageEmbed(e: NeynarEmbed): boolean {
  if (!e.url) return false;
  if (e.metadata?.content_type?.startsWith("image/")) return true;
  if (e.metadata?.image) return true;
  if (/\.(jpg|jpeg|png|gif|webp)/i.test(e.url)) return true;
  return false;
}

function neynarCastToAppCast(nc: NeynarCast): Cast {
  const imageEmbed = nc.embeds?.find(isImageEmbed);

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
    imageWidth: imageEmbed?.metadata?.image?.width_px,
    imageHeight: imageEmbed?.metadata?.image?.height_px,
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
    channel: nc.channel
      ? {
        id: nc.channel.id,
        name: nc.channel.name,
        imageUrl: nc.channel.image_url,
      }
      : undefined,
  };
}

interface UseFarcasterFeedOptions {
  feedType?: string;
  filterType?: string;
  channelId?: string;
  fid?: number;
  viewerFid?: number;
  limit?: number;
}

export function useFarcasterFeed(opts: UseFarcasterFeedOptions = {}) {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchFeed = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      setError(null);

      if (reset) {
        cursorRef.current = undefined;
      }

      try {
        const params = new URLSearchParams();
        if (opts.feedType) params.set("feedType", opts.feedType);
        if (opts.filterType) params.set("filterType", opts.filterType);
        if (opts.channelId) params.set("channelId", opts.channelId);
        if (opts.fid != null) params.set("fid", String(opts.fid));
        if (opts.viewerFid != null) params.set("viewerFid", String(opts.viewerFid));
        if (opts.limit) params.set("limit", String(opts.limit));
        if (cursorRef.current) params.set("cursor", cursorRef.current);

        const res = await fetch(`/api/neynar/feed?${params}`);
        if (!res.ok) throw new Error("Failed to fetch feed");

        const data = await res.json();
        const newCasts = (data.casts ?? []).map(neynarCastToAppCast);

        setCasts((prev) => (reset ? newCasts : [...prev, ...newCasts]));
        cursorRef.current = data.next?.cursor ?? undefined;
        setHasMore(!!data.next?.cursor);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message ?? "Failed to fetch feed");
      } finally {
        setIsLoading(false);
      }
    },
    [opts.feedType, opts.filterType, opts.channelId, opts.fid, opts.viewerFid, opts.limit]
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFeed(false);
    }
  }, [isLoading, hasMore, fetchFeed]);

  return { casts, isLoading, error, fetchFeed, loadMore, hasMore };
}
