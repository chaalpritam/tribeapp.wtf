import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import type { Signer } from "@xmtp/browser-sdk";
import { IdentifierKind } from "@xmtp/browser-sdk";
import { STORAGE_KEYS } from "./constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Creates or retrieves an ephemeral private key stored in localStorage.
 * Useful for "one-click" onboarding but doesn't persist across browsers.
 */
export function getOrCreateEphemeralWallet() {
  if (!isBrowser()) {
    throw new Error("Ephemeral wallet requires a browser environment");
  }

  let privateKey = localStorage.getItem(STORAGE_KEYS.EPHEMERAL_KEY);
  if (!privateKey) {
    privateKey = generatePrivateKey();
    localStorage.setItem(STORAGE_KEYS.EPHEMERAL_KEY, privateKey);
  }

  return privateKeyToAccount(privateKey as `0x${string}`);
}

/**
 * Creates an XMTP Signer using the local ephemeral wallet.
 */
export function createEphemeralSigner(): Signer {
  const account = getOrCreateEphemeralWallet();

  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({ message });
      return toBytes(signature);
    },
  };
}

/**
 * Creates an XMTP Signer using an injected browser wallet (e.g. MetaMask).
 * This is the preferred method for Farcaster users as it can be linked to their custody address.
 */
export async function createBrowserWalletSigner(): Promise<Signer> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No ethereum wallet found. Please install a wallet provider like MetaMask or OKX.");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts[0]) {
    throw new Error("No wallet accounts found. Please connect your wallet.");
  }

  const address = accounts[0].toLowerCase();

  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: address,
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = (await window.ethereum!.request({
        method: "personal_sign",
        params: [message, address],
      })) as `0x${string}`;
      return toBytes(signature);
    },
  };
}

// Deprecated or legacy aliases - transition to the above functions
export const createFarcasterSigner = createEphemeralSigner;
export const createWalletSigner = createBrowserWalletSigner;

export function hasEphemeralWallet(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(STORAGE_KEYS.EPHEMERAL_KEY) !== null;
}

export function getEphemeralAddress(): string | null {
  if (!isBrowser() || !hasEphemeralWallet()) return null;
  const account = getOrCreateEphemeralWallet();
  return account.address.toLowerCase();
}

export function clearEphemeralWallet(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.EPHEMERAL_KEY);
}

