import { hubFetch } from "./failover";

export interface ChannelInfo {
  id: string;
  name: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  member_count: number;
  tweet_count: number;
  last_tweet_at: string | null;
}

export interface ChannelMember {
  tid: string;
  joined_at: string;
  username?: string | null;
}

export async function listChannels(
  limit = 50,
  offset = 0
): Promise<ChannelInfo[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await hubFetch(`/v1/channels?${params}`);
  if (!res.ok) throw new Error(`Failed to list channels: ${res.statusText}`);
  const json = (await res.json()) as { channels: ChannelInfo[] };
  return json.channels;
}

export async function getChannel(id: string): Promise<ChannelInfo | null> {
  const res = await hubFetch(`/v1/channels/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load channel: ${res.statusText}`);
  return (await res.json()) as ChannelInfo;
}

export async function getChannelMembers(
  id: string
): Promise<ChannelMember[]> {
  const res = await hubFetch(
    `/v1/channels/${encodeURIComponent(id)}/members`
  );
  if (!res.ok)
    throw new Error(`Failed to load channel members: ${res.statusText}`);
  const json = (await res.json()) as { members: ChannelMember[] };
  return json.members;
}

export async function getChannelsForTid(
  tid: number
): Promise<ChannelInfo[]> {
  const res = await hubFetch(`/v1/channels/member/${tid}`);
  if (!res.ok)
    throw new Error(`Failed to list channels for TID: ${res.statusText}`);
  const json = (await res.json()) as { channels: ChannelInfo[] };
  return json.channels;
}
