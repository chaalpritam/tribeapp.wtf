import nacl from "tweetnacl";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

/**
 * `.tribe` / `.tribe.enc` account backup. Wire format is identical to
 * tribe-app and tribe-ios, so a file produced by any of the three
 * apps opens in the other two. tribe-app's wire-format constants
 * (PBKDF2 + AES-GCM parameters, byte layout) live in
 * `tribe-app/src/lib/backup.ts` — keep this file in sync if they
 * ever change.
 *
 * tribeapp.wtf's identity lives in Zustand under
 * `tribeapp-wtf-tribe-identity`, not raw localStorage keys, so the
 * read/write code here bridges the standardized backup envelope to
 * the Zustand store.
 */

const SUPPORTED_BACKUP_VERSION = 1;
export const BACKUP_TIMESTAMP_KEY = "tribeapp_wtf_last_backup_at";
const DM_KEYPAIR_STORAGE = "tribeapp_wtf_dm_keypair";

export interface BackupData {
  version: 1;
  timestamp: number;
  data: {
    tid: string | null;
    tidWallet: string | null;
    appKeySecret: string | null;
    browserWallet: string | null;
    dmKeypair: string | null;
  };
}

/**
 * Encrypted blobs are base64 (no leading `{`). Plain backups are
 * JSON. Trying the JSON.parse path is more reliable than relying on
 * `.enc` — a user can rename that.
 */
export function isEncryptedBackup(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return false;
  return /^[A-Za-z0-9+/=\s]+$/.test(trimmed);
}

export function markBackupComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKUP_TIMESTAMP_KEY, String(Date.now()));
}

export function getLastBackupAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Snapshot the current identity + DM key into the standardized
 * envelope. Reads the Zustand store directly so callers don't have
 * to thread the identity through.
 *
 * `browserWallet` is always emitted as null on this client — only
 * tribe-app supports an in-page Solana wallet. The field is retained
 * in the wire format for compatibility with files produced there.
 */
export function createBackupPayload(): BackupData {
  const identity = useTribeIdentityStore.getState().identity;
  const dmKeypair =
    typeof window !== "undefined"
      ? localStorage.getItem(DM_KEYPAIR_STORAGE)
      : null;
  return {
    version: 1,
    timestamp: Date.now(),
    data: {
      tid: identity?.tid != null ? String(identity.tid) : null,
      tidWallet: identity?.custodyWallet ?? null,
      appKeySecret: identity?.appKeySecret ?? null,
      browserWallet: null,
      dmKeypair,
    },
  };
}

export function downloadBackupFile(payload: BackupData, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.tribe`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadEncryptedBackup(encrypted: string, filename: string) {
  const blob = new Blob([encrypted], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.tribe.enc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// PBKDF2(SHA-256, 100k iters) → AES-256-GCM. Same parameters as
// tribe-app, tribe-ios, so encrypted files round-trip.
export async function encryptBackup(
  payload: BackupData,
  password: string,
): Promise<string> {
  const payloadStr = JSON.stringify(payload);
  const pwData = new TextEncoder().encode(password) as BufferSource;
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pwData,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(payloadStr) as BufferSource,
  );
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

export async function decryptBackup(
  encryptedB64: string,
  password: string,
): Promise<BackupData> {
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);
  const pwData = new TextEncoder().encode(password) as BufferSource;
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pwData,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    throw new Error("Wrong password, or the file is corrupted.");
  }
}

/**
 * Apply a parsed backup envelope to tribeapp.wtf's state.
 *
 * - tid + appKeySecret + tidWallet → Zustand identity store
 * - dmKeypair → localStorage so the DM module picks it up on next read
 * - browserWallet → localStorage so the Browser Wallet adapter can load
 *   the keypair without going through BIP39 setup again
 *
 * Caller should disconnect any active wallet before calling this so
 * wallet-adapter-react doesn't overwrite the freshly-restored TID.
 */
export function applyBackup(backup: BackupData): void {
  if (backup?.version !== SUPPORTED_BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version ${backup?.version}. This app supports v${SUPPORTED_BACKUP_VERSION}.`,
    );
  }
  if (!backup.data || typeof backup.data !== "object") {
    throw new Error("Backup is missing the data section.");
  }
  const { data } = backup;
  if (!data.tid || !data.appKeySecret) {
    throw new Error(
      "Backup is missing tid or app-key — restoring it would leave the account unrecoverable.",
    );
  }
  const tidNumber = Number(data.tid);
  if (!Number.isFinite(tidNumber)) {
    throw new Error(`Backup tid "${data.tid}" isn't a valid number.`);
  }
  // Compute pubkey from secret. tribe-app / iOS write 64-byte
  // secretKey (seed || pubkey); the last 32 bytes are the pubkey.
  const secretBytes = Uint8Array.from(atob(data.appKeySecret), (c) =>
    c.charCodeAt(0),
  );
  if (secretBytes.length !== 64 && secretBytes.length !== 32) {
    throw new Error(
      `App key in backup must be 32 or 64 bytes; got ${secretBytes.length}.`,
    );
  }
  // tribeapp.wtf expects the 64-byte secretKey in its Zustand store
  // (matches what useTribeRegister writes), so we'd need to derive
  // pubkey from a 32-byte seed if that's all we got.
  let appKeySecretB64 = data.appKeySecret;
  let appKeyPubkeyB64: string;
  if (secretBytes.length === 64) {
    appKeyPubkeyB64 = btoa(
      String.fromCharCode(...secretBytes.subarray(32, 64)),
    );
  } else {
    // 32-byte seed → derive pubkey, expand to 64-byte secretKey so
    // the rest of tribeapp.wtf doesn't have to special-case.
    const keypair = nacl.sign.keyPair.fromSeed(secretBytes);
    appKeyPubkeyB64 = btoa(String.fromCharCode(...keypair.publicKey));
    appKeySecretB64 = btoa(String.fromCharCode(...keypair.secretKey));
  }
  if (typeof window !== "undefined") {
    if (data.dmKeypair) {
      localStorage.setItem(DM_KEYPAIR_STORAGE, data.dmKeypair);
    }
    if (data.browserWallet) {
      localStorage.setItem(WALLET_STORAGE_KEY, data.browserWallet);
      // Tell wallet-adapter-react to auto-select Browser Wallet on
      // the next page load — otherwise it'd connect to whatever was
      // previously selected (or pop the modal).
      localStorage.setItem(WALLET_NAME_KEY, '"Browser Wallet"');
    }
  }
  useTribeIdentityStore.getState().setIdentity({
    tid: tidNumber,
    custodyWallet: data.tidWallet ?? "",
    username: null,
    appKeySecret: appKeySecretB64,
    appKeyPubkey: appKeyPubkeyB64,
  });
  markBackupComplete();
}
