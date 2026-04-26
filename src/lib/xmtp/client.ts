import { Client, type Signer } from "@xmtp/browser-sdk";
import { createEphemeralSigner } from "./signer";
import { XMTP_ENV } from "./constants";

let clientInstance: Client | null = null;
let clientPromise: Promise<Client> | null = null;

export function isXmtpSupported(): boolean {
  if (typeof window === "undefined") return false;

  const hasSAB = typeof SharedArrayBuffer !== "undefined";
  const isIsolated = window.crossOriginIsolated;

  console.log("XMTP Support Check:", {
    SharedArrayBuffer: hasSAB,
    crossOriginIsolated: isIsolated,
    userAgent: navigator.userAgent
  });

  // SharedArrayBuffer is required for the WASM-based browser SDK
  return hasSAB;
}

export async function getXmtpClient(customSigner?: Signer): Promise<Client> {
  if (clientInstance) return clientInstance;

  // Guard against concurrent initialization
  if (clientPromise) return clientPromise;

  if (!isXmtpSupported()) {
    throw new Error("Your browser does not support the required cryptographic primitives (SharedArrayBuffer) for XMTP.");
  }

  clientPromise = (async () => {
    try {
      const signer = customSigner || createEphemeralSigner();
      console.log("Initializing XMTP client with env:", XMTP_ENV);

      // Get or create local DB encryption key to allow fast reconnects via OPFS persistence
      let dbEncryptionKey: Uint8Array;
      const storedKey = localStorage.getItem("tribe-xmtp-db-key");
      if (storedKey) {
        dbEncryptionKey = new Uint8Array(JSON.parse(storedKey));
      } else {
        dbEncryptionKey = window.crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem("tribe-xmtp-db-key", JSON.stringify(Array.from(dbEncryptionKey)));
      }

      const client = await Promise.race([
        Client.create(signer, { env: XMTP_ENV, dbEncryptionKey }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("XMTP client initialization timed out (60s). This usually happens if WASM files fail to load or network is slow.")), 60_000)
        ),
      ]);
      console.log("XMTP client initialized successfully. InboxId:", client.inboxId);
      clientInstance = client;
      return client;
    } catch (error) {
      console.error("Failed to initialize XMTP client:", error);
      clientPromise = null;
      throw error;
    }
  })();

  return clientPromise;
}

export function getExistingClient(): Client | null {
  return clientInstance;
}

export function disconnectXmtpClient(): void {
  clientInstance = null;
  clientPromise = null;
}
