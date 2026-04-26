import type { Tweet } from "@/types";
import type { TribeTweet } from "./api";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

function relativeTimestamp(unixSeconds: number): string {
  const ms = unixSeconds * 1000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

function pickImageEmbed(embeds?: string[]): string | undefined {
  if (!embeds) return undefined;
  return embeds.find((e) => /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(e));
}

/**
 * Convert a hub-shape TribeTweet into the local Tweet shape that
 * TweetCard expects. Missing fields (city, comments, like/save state)
 * are zero-defaulted because the hub doesn't track them yet.
 */
export function tribeTweetToTweet(
  hubTweet: TribeTweet,
  defaults: { cityId: string }
): Tweet {
  const username =
    hubTweet.user?.username ?? `tid:${hubTweet.tid}`;
  const displayName =
    hubTweet.user?.displayName ?? username;

  return {
    id: hubTweet.hash,
    user: {
      id: `tid-${hubTweet.tid}`,
      username,
      displayName,
      avatarUrl: hubTweet.user?.pfpUrl ?? FALLBACK_AVATAR,
      cityId: defaults.cityId,
      isVerified: false,
    },
    caption: hubTweet.text,
    likes: hubTweet.reactions?.likes ?? 0,
    comments: [],
    timestamp: relativeTimestamp(hubTweet.timestamp),
    isLiked: false,
    isSaved: false,
    tipCount: 0,
    totalTips: 0,
    cityId: defaults.cityId,
    imageUrl: pickImageEmbed(hubTweet.embeds),
    embeds: hubTweet.embeds?.map((url) => ({ url })),
    channel: hubTweet.channel_id
      ? { id: hubTweet.channel_id, name: hubTweet.channel_id }
      : undefined,
  };
}
