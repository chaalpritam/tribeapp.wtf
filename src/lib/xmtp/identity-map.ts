import { STORAGE_KEYS } from "./constants";

interface IdentityEntry {
  fid: number;
  inboxId: string;
  address: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custodyAddress?: string;
  verifiedAddresses?: string[];
}

interface TribeGroupEntry {
  tribeId: string;
  conversationId: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function loadMap<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMap<T>(key: string, data: T[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// FID <-> XMTP identity mapping

export function registerIdentity(entry: IdentityEntry): void {
  const entries = loadMap<IdentityEntry>(STORAGE_KEYS.IDENTITY_MAP);
  const idx = entries.findIndex((e) => e.fid === entry.fid);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...entry };
  } else {
    entries.push(entry);
  }
  saveMap(STORAGE_KEYS.IDENTITY_MAP, entries);
}

export function getIdentityByFid(fid: number): IdentityEntry | undefined {
  return loadMap<IdentityEntry>(STORAGE_KEYS.IDENTITY_MAP).find(
    (e) => e.fid === fid
  );
}

export function getIdentityByAddress(
  address: string
): IdentityEntry | undefined {
  return loadMap<IdentityEntry>(STORAGE_KEYS.IDENTITY_MAP).find(
    (e) => e.address.toLowerCase() === address.toLowerCase()
  );
}

export function getIdentityByInboxId(
  inboxId: string
): IdentityEntry | undefined {
  return loadMap<IdentityEntry>(STORAGE_KEYS.IDENTITY_MAP).find(
    (e) => e.inboxId === inboxId
  );
}

export function getAllIdentities(): IdentityEntry[] {
  return loadMap<IdentityEntry>(STORAGE_KEYS.IDENTITY_MAP);
}

// Tribe <-> XMTP group mapping

export function registerTribeGroup(
  tribeId: string,
  conversationId: string
): void {
  const entries = loadMap<TribeGroupEntry>(STORAGE_KEYS.TRIBE_GROUP_MAP);
  const idx = entries.findIndex((e) => e.tribeId === tribeId);
  if (idx >= 0) {
    entries[idx].conversationId = conversationId;
  } else {
    entries.push({ tribeId, conversationId });
  }
  saveMap(STORAGE_KEYS.TRIBE_GROUP_MAP, entries);
}

export function getConversationForTribe(
  tribeId: string
): string | undefined {
  return loadMap<TribeGroupEntry>(STORAGE_KEYS.TRIBE_GROUP_MAP).find(
    (e) => e.tribeId === tribeId
  )?.conversationId;
}

export function getTribeForConversation(
  conversationId: string
): string | undefined {
  return loadMap<TribeGroupEntry>(STORAGE_KEYS.TRIBE_GROUP_MAP).find(
    (e) => e.conversationId === conversationId
  )?.tribeId;
}
