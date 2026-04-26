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

export function getMediaUrl(hash: string): string {
  return `${getHubBaseUrl()}/v1/media/${hash}`;
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
