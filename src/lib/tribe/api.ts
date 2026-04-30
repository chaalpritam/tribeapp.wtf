import { hubFetch, getHubBaseUrl } from "./failover";

export interface TribeUserSummary {
  tid: string;
  username?: string | null;
  displayName?: string | null;
  bio?: string | null;
  pfpUrl?: string | null;
  followers?: number;
  following?: number;
}

export interface TribeTweet {
  hash: string;
  tid: string;
  text: string;
  timestamp: number;
  parent_hash?: string | null;
  channel_id?: string | null;
  embeds?: string[];
  reactions?: { likes: number; recasts: number };
  /** The hub returns these inline on each row (flat, not nested). The
   *  display_name / pfp_url fields come from a JOIN against user_data
   *  with the latest USER_DATA_ADD value per field. */
  username?: string | null;
  display_name?: string | null;
  pfp_url?: string | null;
  /** Legacy nested shape, kept for clients that build their own
   *  TribeTweet payloads. The hub itself never sets this. */
  user?: TribeUserSummary;
}

export interface TribeFeedResponse {
  tweets: TribeTweet[];
  cursor?: string | null;
}

export async function fetchTweets(tid: string): Promise<TribeFeedResponse> {
  const res = await hubFetch(`/v1/feed/${tid}`);
  if (!res.ok) throw new Error(`Failed to fetch tweets: ${res.statusText}`);
  return res.json();
}

export async function fetchTweet(hash: string): Promise<TribeTweet> {
  const res = await hubFetch(`/v1/messages/${encodeURIComponent(hash)}`);
  if (!res.ok) throw new Error(`Failed to fetch tweet: ${res.statusText}`);
  return res.json();
}

export async function submitMessage(message: object) {
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Failed to submit message: ${res.statusText}`);
  return res.json();
}

export async function fetchUser(tid: string): Promise<TribeUserSummary> {
  const res = await hubFetch(`/v1/user/${tid}`);
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.statusText}`);
  return res.json();
}

export async function fetchGlobalFeed(): Promise<TribeFeedResponse> {
  const res = await hubFetch("/v1/feed?limit=50");
  if (!res.ok) throw new Error(`Failed to fetch global feed: ${res.statusText}`);
  return res.json();
}

export async function fetchChannelFeed(
  channelId: string
): Promise<TribeFeedResponse> {
  const res = await hubFetch(
    `/v1/feed/channel/${encodeURIComponent(channelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch channel: ${res.statusText}`);
  return res.json();
}

export async function fetchReplies(hash: string): Promise<TribeFeedResponse> {
  const res = await hubFetch(`/v1/replies?hash=${encodeURIComponent(hash)}`);
  if (!res.ok) throw new Error(`Failed to fetch replies: ${res.statusText}`);
  return res.json();
}

export async function fetchFollowers(
  tid: string
): Promise<{ users: TribeUserSummary[] }> {
  const res = await hubFetch(`/v1/followers/${tid}`);
  if (!res.ok) throw new Error(`Failed to fetch followers: ${res.statusText}`);
  return res.json();
}

export async function fetchFollowing(
  tid: string
): Promise<{ users: TribeUserSummary[] }> {
  const res = await hubFetch(`/v1/following/${tid}`);
  if (!res.ok) throw new Error(`Failed to fetch following: ${res.statusText}`);
  return res.json();
}

export interface UserSearchHit {
  tid: string;
  custody_address: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  pfp_url: string | null;
}

export interface ChannelSearchHit {
  id: string;
  name: string | null;
  description: string | null;
  member_count: number;
  last_tweet_at: string | null;
}

export async function searchTweets(q: string, limit = 20) {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await hubFetch(`/v1/search?${params}`);
  if (!res.ok) throw new Error(`Tweet search failed: ${res.statusText}`);
  return res.json();
}

export async function searchUsers(
  q: string,
  limit = 20
): Promise<UserSearchHit[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await hubFetch(`/v1/search/users?${params}`);
  if (!res.ok) throw new Error(`User search failed: ${res.statusText}`);
  const json = (await res.json()) as { users: UserSearchHit[] };
  return json.users;
}

export async function searchChannels(
  q: string,
  limit = 20
): Promise<ChannelSearchHit[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await hubFetch(`/v1/search/channels?${params}`);
  if (!res.ok) throw new Error(`Channel search failed: ${res.statusText}`);
  const json = (await res.json()) as { channels: ChannelSearchHit[] };
  return json.channels;
}

export function getMediaUrl(hash: string): string {
  return `${getHubBaseUrl()}/v1/media/${hash}`;
}

/**
 * Canonical reference form for hub-hosted media. Stored verbatim in
 * embeds and profile fields so a hub-IP change (DHCP renewal, moving
 * the stack to a new machine, swapping `tribe link` targets) doesn't
 * strand every image at the old address. Render side calls
 * `resolveMediaUrl` against the *current* NEXT_PUBLIC_HUB_URL.
 */
export function mediaRef(hash: string): string {
  return `media:${hash}`;
}

/**
 * Render-time helper: turn whatever was stored in an embed / pfpUrl
 * into a real URL for an `<Image>` src. Handles three input shapes:
 *
 *   1. `media:<hash>` — canonical form (written by tribe-app and
 *      newer publishers).
 *   2. `http(s)://…/v1/media/<hash>` — legacy absolute URL stored by
 *      pre-`mediaRef` versions of the app. We re-extract the hash
 *      and re-resolve so a stale IP burnt in at compose time gets
 *      replaced with the current hub.
 *   3. Any other URL — passed through as-is (external links,
 *      unsplash placeholders, etc.).
 */
export function resolveMediaUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  if (value.startsWith("media:")) {
    return getMediaUrl(value.slice("media:".length));
  }
  const match = value.match(/\/v1\/media\/([0-9a-fA-F]{64})/);
  if (match) return getMediaUrl(match[1]);
  return value;
}

export interface UploadResult {
  hash: string;
  url: string;
  contentType: string;
  size: number;
  /** Absolute URL on the hub the file was uploaded to. */
  absoluteUrl: string;
}

export async function uploadMedia(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await hubFetch("/v1/upload", { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed: ${res.status} ${txt}`);
  }
  const json = (await res.json()) as Omit<UploadResult, "absoluteUrl">;
  return { ...json, absoluteUrl: `${getHubBaseUrl()}${json.url}` };
}
