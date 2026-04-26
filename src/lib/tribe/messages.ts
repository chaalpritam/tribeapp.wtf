import nacl from "tweetnacl";
import { hubFetch } from "./failover";
import { NETWORK_DEVNET } from "./constants";

async function blake3Hash(data: Uint8Array): Promise<Uint8Array> {
  try {
    const blake3 = await import("blake3/browser");
    const result = blake3.hash(data);
    if (result instanceof Uint8Array) return result;
    return new Uint8Array(result as unknown as ArrayLike<number>);
  } catch {
    // Fallback: SHA-256 if the blake3 WASM bundle fails to load.
    const hashBuf = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new Uint8Array(data) as unknown as BufferSource
    );
    return new Uint8Array(hashBuf);
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export type MessageType =
  | 1 // TWEET_ADD
  | 2 // TWEET_REMOVE
  | 3 // REACTION_ADD
  | 4 // REACTION_REMOVE
  | 5 // LINK_ADD
  | 6 // LINK_REMOVE
  | 7 // USER_DATA_ADD
  | 9 // CHANNEL_ADD
  | 10 // CHANNEL_JOIN
  | 11 // CHANNEL_LEAVE
  | 14 // BOOKMARK_ADD
  | 15 // BOOKMARK_REMOVE
  | 16 // POLL_ADD
  | 17 // POLL_VOTE
  | 18 // EVENT_ADD
  | 19 // EVENT_RSVP
  | 20 // TASK_ADD
  | 21 // TASK_CLAIM
  | 22 // TASK_COMPLETE
  | 23 // CROWDFUND_ADD
  | 24; // CROWDFUND_PLEDGE

interface BuildOptions {
  type: MessageType;
  tid: number;
  body: Record<string, unknown>;
  signingKeySecret: Uint8Array;
}

async function buildSignedMessage({
  type,
  tid,
  body,
  signingKeySecret,
}: BuildOptions) {
  const data = {
    type,
    tid,
    timestamp: Math.floor(Date.now() / 1000),
    network: NETWORK_DEVNET,
    body,
  };

  const dataBytes = new TextEncoder().encode(JSON.stringify(data));
  const hashBytes = await blake3Hash(dataBytes);

  const keyPair = nacl.sign.keyPair.fromSecretKey(signingKeySecret);
  const signature = nacl.sign.detached(hashBytes, signingKeySecret);

  return {
    protocolVersion: 1,
    data,
    hash: toBase64(hashBytes),
    signature: toBase64(signature),
    signer: toBase64(keyPair.publicKey),
  };
}

export async function signAndPublishTweet(
  tid: number,
  text: string,
  signingKeySecret: Uint8Array,
  opts: { parentHash?: string; channelId?: string; embeds?: string[] } = {}
): Promise<{ hash: string }> {
  const body: Record<string, unknown> = {
    text,
    mentions: [] as number[],
    embeds: opts.embeds ?? [],
  };
  if (opts.parentHash) body.parent_hash = opts.parentHash;
  if (opts.channelId) body.channel_id = opts.channelId;

  const message = await buildSignedMessage({
    type: 1,
    tid,
    body,
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Tweet failed: ${res.status} ${errBody}`);
  }

  return res.json();
}

export async function signAndPublishChannelOp(
  type: 9 | 10 | 11,
  tid: number,
  body: { channel_id: string; name?: string; description?: string },
  signingKeySecret: Uint8Array
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type,
    tid,
    body,
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Channel op failed: ${res.status} ${errBody}`);
  }

  return res.json();
}

export async function signAndPublishCrowdfund(
  tid: number,
  crowdfundId: string,
  title: string,
  goalAmount: number,
  signingKeySecret: Uint8Array,
  opts: {
    description?: string;
    currency?: string;
    deadlineAtUnix?: number;
    imageUrl?: string;
    channelId?: string;
  } = {}
): Promise<{ hash: string }> {
  const body: Record<string, unknown> = {
    crowdfund_id: crowdfundId,
    title,
    goal_amount: goalAmount,
  };
  if (opts.description) body.description = opts.description;
  if (opts.currency) body.currency = opts.currency;
  if (opts.deadlineAtUnix) body.deadline_at = opts.deadlineAtUnix;
  if (opts.imageUrl) body.image_url = opts.imageUrl;
  if (opts.channelId) body.channel_id = opts.channelId;

  const message = await buildSignedMessage({
    type: 23,
    tid,
    body,
    signingKeySecret,
  });
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Crowdfund create failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishPledge(
  tid: number,
  crowdfundId: string,
  amount: number,
  signingKeySecret: Uint8Array,
  currency = "USD"
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type: 24,
    tid,
    body: { crowdfund_id: crowdfundId, amount, currency },
    signingKeySecret,
  });
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Pledge failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishTask(
  tid: number,
  taskId: string,
  title: string,
  signingKeySecret: Uint8Array,
  opts: {
    description?: string;
    rewardText?: string;
    channelId?: string;
  } = {}
): Promise<{ hash: string }> {
  const body: Record<string, unknown> = { task_id: taskId, title };
  if (opts.description) body.description = opts.description;
  if (opts.rewardText) body.reward_text = opts.rewardText;
  if (opts.channelId) body.channel_id = opts.channelId;

  const message = await buildSignedMessage({
    type: 20,
    tid,
    body,
    signingKeySecret,
  });
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Task create failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishTaskTransition(
  tid: number,
  taskId: string,
  type: 21 | 22,
  signingKeySecret: Uint8Array
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type,
    tid,
    body: { task_id: taskId },
    signingKeySecret,
  });
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Task transition failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishEvent(
  tid: number,
  eventId: string,
  title: string,
  startsAtUnix: number,
  signingKeySecret: Uint8Array,
  opts: {
    description?: string;
    endsAtUnix?: number;
    locationText?: string;
    latitude?: number;
    longitude?: number;
    channelId?: string;
    imageUrl?: string;
  } = {}
): Promise<{ hash: string }> {
  const body: Record<string, unknown> = {
    event_id: eventId,
    title,
    starts_at: startsAtUnix,
  };
  if (opts.description) body.description = opts.description;
  if (opts.endsAtUnix) body.ends_at = opts.endsAtUnix;
  if (opts.locationText) body.location_text = opts.locationText;
  if (opts.latitude !== undefined) body.latitude = opts.latitude;
  if (opts.longitude !== undefined) body.longitude = opts.longitude;
  if (opts.channelId) body.channel_id = opts.channelId;
  if (opts.imageUrl) body.image_url = opts.imageUrl;

  const message = await buildSignedMessage({
    type: 18,
    tid,
    body,
    signingKeySecret,
  });
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Event create failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishRsvp(
  tid: number,
  eventId: string,
  status: "yes" | "no" | "maybe",
  signingKeySecret: Uint8Array
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type: 19,
    tid,
    body: { event_id: eventId, status },
    signingKeySecret,
  });
  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`RSVP failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishPoll(
  tid: number,
  pollId: string,
  question: string,
  options: string[],
  signingKeySecret: Uint8Array,
  opts: { expiresAtUnix?: number; channelId?: string } = {}
): Promise<{ hash: string }> {
  const body: Record<string, unknown> = {
    poll_id: pollId,
    question,
    options,
  };
  if (opts.expiresAtUnix) body.expires_at = opts.expiresAtUnix;
  if (opts.channelId) body.channel_id = opts.channelId;

  const message = await buildSignedMessage({
    type: 16,
    tid,
    body,
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Poll create failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishPollVote(
  tid: number,
  pollId: string,
  optionIndex: number,
  signingKeySecret: Uint8Array
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type: 17,
    tid,
    body: { poll_id: pollId, option_index: optionIndex },
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Poll vote failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

export async function signAndPublishBookmark(
  tid: number,
  targetHash: string,
  signingKeySecret: Uint8Array,
  remove = false
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type: remove ? 15 : 14,
    tid,
    body: { target_hash: targetHash },
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Bookmark op failed: ${res.status} ${errBody}`);
  }

  return res.json();
}

export async function signAndPublishUserData(
  tid: number,
  field: "bio" | "displayName" | "pfpUrl" | "url" | "location",
  value: string,
  signingKeySecret: Uint8Array
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type: 7, // USER_DATA_ADD
    tid,
    body: { field, value },
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`User data publish failed: ${res.status} ${errBody}`);
  }

  return res.json();
}

export async function signAndPublishReaction(
  tid: number,
  targetHash: string,
  reactionType: "like" | "recast",
  signingKeySecret: Uint8Array,
  remove = false
): Promise<{ hash: string }> {
  const message = await buildSignedMessage({
    type: remove ? 4 : 3,
    tid,
    body: {
      target_hash: targetHash,
      reaction: reactionType === "like" ? 1 : 2,
    },
    signingKeySecret,
  });

  const res = await hubFetch("/v1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Reaction failed: ${res.status} ${errBody}`);
  }

  return res.json();
}
