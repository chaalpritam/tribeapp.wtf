import type { City, Tribe, Tweet, User } from "@/types";
import type { TribeTweet, TribeUserSummary } from "./api";
import type { ChannelInfo } from "./channels";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

/**
 * Build the local `User` shape used by the UI from a signed-in
 * TribeIdentity, the active city, and (optionally) the hub-resolved
 * profile metadata. Bio / display name / avatar fall back to identity
 * fields and finally to the shared fallback avatar so a guest who
 * just registered still gets a renderable card.
 */
export function tribeIdentityToUser(args: {
  identity: { tid: number; username?: string | null; custodyWallet: string };
  city: Pick<City, "id">;
  profile?: TribeUserSummary | null;
}): User {
  const { identity, city, profile } = args;
  const username =
    profile?.username ?? identity.username ?? `tid${identity.tid}`;
  const displayName =
    profile?.displayName ?? identity.username ?? `TID ${identity.tid}`;

  return {
    id: `tid-${identity.tid}`,
    username,
    displayName,
    avatarUrl: profile?.pfpUrl ?? FALLBACK_AVATAR,
    cityId: city.id,
    isVerified: false,
    bio: profile?.bio ?? undefined,
  };
}

/**
 * The hub stores city channels under their slug (channel kind = 2).
 * tribeapp.wtf's seed data already uses the city id as a slug, so the
 * mapping is identity. Kept as a helper so the convention lives in
 * one file if it ever changes.
 */
export function cityChannelId(cityId: string): string {
  return cityId;
}

/**
 * Convert a hub-shape ChannelInfo into the local Tribe shape used by
 * the Tribes / Channels list pages. The protocol's channel concept is
 * narrower than the seed's Tribe (no category, moderators, rules,
 * subchannels), so the seed-only fields default. The seed Tribe's
 * `members` doubles as both members and tweet activity from the hub.
 */
export function channelInfoToTribe(
  info: ChannelInfo,
  defaults: { cityId: string; isJoined?: boolean } = { cityId: "" }
): Tribe {
  // Lightweight color/icon defaults so the existing card components
  // render something visually distinct per kind without forcing the
  // hub to carry a palette.
  const isCity = info.kind === 2;
  return {
    id: info.id,
    cityId: defaults.cityId,
    name: info.name?.trim() || `#${info.id}`,
    description: info.description ?? "",
    category: "general",
    icon: isCity ? "map-pin" : "users",
    color: isCity ? "10B981" : "6366F1",
    members: info.member_count ?? 0,
    isPrivate: false,
    moderators: info.created_by ? [info.created_by] : [],
    rules: [],
    subchannels: [],
    isJoined: defaults.isJoined ?? false,
  };
}

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
 * TweetCard expects. The hub returns username / display_name / pfp_url
 * flat on each row (joined in by feed.ts); we also accept the legacy
 * nested `user` shape for forward-compat with clients that build their
 * own payloads. Missing fields (comments, like/save state) are
 * zero-defaulted because the hub doesn't track them yet.
 */
export function tribeTweetToTweet(
  hubTweet: TribeTweet,
  defaults: { cityId: string }
): Tweet {
  const rawUsername =
    hubTweet.user?.username ?? hubTweet.username ?? null;
  const rawDisplayName =
    hubTweet.user?.displayName ?? hubTweet.display_name ?? null;
  const rawPfp =
    hubTweet.user?.pfpUrl ?? hubTweet.pfp_url ?? null;

  const username = rawUsername ?? `tid:${hubTweet.tid}`;
  const displayName =
    rawDisplayName?.trim() ||
    (rawUsername ? `${rawUsername}.tribe` : `TID #${hubTweet.tid}`);

  return {
    id: hubTweet.hash,
    user: {
      id: `tid-${hubTweet.tid}`,
      username,
      displayName,
      avatarUrl: rawPfp ?? FALLBACK_AVATAR,
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
