import nacl from "tweetnacl";
import { hubFetch } from "./failover";
import { NETWORK_DEVNET } from "./constants";

const DM_KEY_REGISTER = 12;
const DM_SEND = 13;

export interface DmKeyRecord {
  tid: string;
  x25519_pubkey: string;
  registered_at: string;
}

export interface DmConversation {
  id: string;
  peer_tid: string;
  last_message_at: string;
}

export interface EncryptedDm {
  hash: string;
  sender_tid: string;
  recipient_tid: string;
  ciphertext: string;
  nonce: string;
  sender_x25519: string;
  timestamp: string;
}

export interface DecryptedDm extends Omit<EncryptedDm, "ciphertext"> {
  text: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function blake3Hash(data: Uint8Array): Promise<Uint8Array> {
  try {
    const blake3 = await import("blake3/browser");
    const result = blake3.hash(data);
    if (result instanceof Uint8Array) return result;
    return new Uint8Array(result as unknown as ArrayLike<number>);
  } catch {
    const hashBuf = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new Uint8Array(data) as unknown as BufferSource
    );
    return new Uint8Array(hashBuf);
  }
}

interface SignedEnvelope {
  protocolVersion: 1;
  data: {
    type: number;
    tid: string;
    timestamp: number;
    network: number;
    body: Record<string, string>;
  };
  hash: string;
  signature: string;
  signer: string;
}

async function signEnvelope(
  type: number,
  tid: number,
  body: Record<string, string>,
  signingKeySecret: Uint8Array
): Promise<SignedEnvelope> {
  const data = {
    type,
    tid: tid.toString(),
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

const DM_KEYPAIR_STORAGE = "tribeapp_wtf_dm_keypair";

/**
 * Get or create the caller's persisted x25519 keypair. Stored in
 * localStorage so the same identity can decrypt incoming DMs across
 * page loads.
 */
export function getOrCreateDmKeypair(): nacl.BoxKeyPair {
  if (typeof window === "undefined") {
    return nacl.box.keyPair();
  }
  const stored = window.localStorage.getItem(DM_KEYPAIR_STORAGE);
  if (stored) {
    const parsed = JSON.parse(stored) as {
      publicKey: string;
      secretKey: string;
    };
    return {
      publicKey: fromBase64(parsed.publicKey),
      secretKey: fromBase64(parsed.secretKey),
    };
  }
  const keypair = nacl.box.keyPair();
  window.localStorage.setItem(
    DM_KEYPAIR_STORAGE,
    JSON.stringify({
      publicKey: toBase64(keypair.publicKey),
      secretKey: toBase64(keypair.secretKey),
    })
  );
  return keypair;
}

export function clearDmKeypair(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DM_KEYPAIR_STORAGE);
  }
}

export function dmPublicKey(): string {
  return toBase64(getOrCreateDmKeypair().publicKey);
}

export function encryptDm(
  plaintext: string,
  recipientX25519Pubkey: string
): { ciphertext: string; nonce: string; senderX25519: string } {
  const keypair = getOrCreateDmKeypair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = new TextEncoder().encode(plaintext);
  const recipientKey = fromBase64(recipientX25519Pubkey);
  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    recipientKey,
    keypair.secretKey
  );
  if (!ciphertext) throw new Error("DM encryption failed");
  return {
    ciphertext: toBase64(ciphertext),
    nonce: toBase64(nonce),
    senderX25519: toBase64(keypair.publicKey),
  };
}

export function decryptDm(dm: EncryptedDm): string | null {
  const keypair = getOrCreateDmKeypair();
  const ciphertext = fromBase64(dm.ciphertext);
  const nonce = fromBase64(dm.nonce);
  const senderKey = fromBase64(dm.sender_x25519);
  const opened = nacl.box.open(
    ciphertext,
    nonce,
    senderKey,
    keypair.secretKey
  );
  if (!opened) return null;
  return new TextDecoder().decode(opened);
}

/** Register or replace this TID's x25519 pubkey on the hub. */
export async function registerDmKey(
  tid: number,
  signingKeySecret: Uint8Array
): Promise<void> {
  const pubkey = dmPublicKey();
  const envelope = await signEnvelope(
    DM_KEY_REGISTER,
    tid,
    { x25519_pubkey: pubkey },
    signingKeySecret
  );
  const res = await hubFetch("/v1/dm/register-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`registerDmKey failed: ${res.status} ${errBody}`);
  }
}

/** Look up another TID's x25519 pubkey so we can encrypt to them. */
export async function getDmKey(tid: number): Promise<string | null> {
  const res = await hubFetch(`/v1/dm/key/${tid}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getDmKey failed: ${res.statusText}`);
  const json = (await res.json()) as DmKeyRecord;
  return json.x25519_pubkey;
}

/** Encrypt + send a DM to recipientTid. Returns the new message hash. */
export async function sendDm(
  senderTid: number,
  recipientTid: number,
  plaintext: string,
  signingKeySecret: Uint8Array
): Promise<{ hash: string; conversationId: string }> {
  const peerKey = await getDmKey(recipientTid);
  if (!peerKey) {
    throw new Error(
      `Recipient ${recipientTid} has not registered a DM key yet`
    );
  }
  const encrypted = encryptDm(plaintext, peerKey);
  const envelope = await signEnvelope(
    DM_SEND,
    senderTid,
    {
      recipient_tid: recipientTid.toString(),
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      sender_x25519: encrypted.senderX25519,
    },
    signingKeySecret
  );
  const res = await hubFetch("/v1/dm/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`sendDm failed: ${res.status} ${errBody}`);
  }
  const json = (await res.json()) as { hash: string; conversation_id: string };
  return { hash: json.hash, conversationId: json.conversation_id };
}

export async function listDmConversations(
  tid: number
): Promise<DmConversation[]> {
  const res = await hubFetch(`/v1/dm/conversations/${tid}`);
  if (!res.ok) throw new Error(`listDmConversations failed: ${res.statusText}`);
  const json = (await res.json()) as { conversations: DmConversation[] };
  return json.conversations;
}

export async function fetchDmMessages(
  conversationId: string,
  tid: number,
  options: { limit?: number; before?: Date } = {}
): Promise<EncryptedDm[]> {
  const params = new URLSearchParams({ tid: tid.toString() });
  if (options.limit) params.set("limit", String(options.limit));
  if (options.before) params.set("before", options.before.toISOString());
  const res = await hubFetch(
    `/v1/dm/messages/${encodeURIComponent(conversationId)}?${params}`
  );
  if (!res.ok) throw new Error(`fetchDmMessages failed: ${res.statusText}`);
  const json = (await res.json()) as { messages: EncryptedDm[] };
  return json.messages;
}

export async function fetchDecryptedMessages(
  conversationId: string,
  tid: number,
  options: { limit?: number; before?: Date } = {}
): Promise<DecryptedDm[]> {
  const messages = await fetchDmMessages(conversationId, tid, options);
  return messages.map((dm) => {
    const text = decryptDm(dm) ?? "";
    const { ciphertext: _drop, ...rest } = dm;
    void _drop;
    return { ...rest, text };
  });
}

export function dmConversationId(a: number, b: number): string {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return `${lo}:${hi}`;
}
