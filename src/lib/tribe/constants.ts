import { PublicKey } from "@solana/web3.js";
import { env } from "@/lib/env";

export const SOLANA_RPC_URL = env.NEXT_PUBLIC_SOLANA_RPC_URL;
export const HUB_URL = env.NEXT_PUBLIC_HUB_URL;
export const ER_SERVER_URL = env.NEXT_PUBLIC_ER_SERVER_URL;

// Multi-node: comma-separated URLs for failover. Falls back to single URL above.
export const HUB_URLS: string[] = env.NEXT_PUBLIC_HUB_URLS
  ? env.NEXT_PUBLIC_HUB_URLS.split(",").map((u) => u.trim()).filter(Boolean)
  : [HUB_URL];

export const ER_SERVER_URLS: string[] = env.NEXT_PUBLIC_ER_SERVER_URLS
  ? env.NEXT_PUBLIC_ER_SERVER_URLS.split(",").map((u) => u.trim()).filter(Boolean)
  : [ER_SERVER_URL];

export const PROGRAM_IDS = {
  tidRegistry: new PublicKey("4BSmJmRGQWKgioP9DG2bUuRS9U3V6soRauU7Nv6yGvHD"),
  appKeyRegistry: new PublicKey("5LtbFUeAoXWRovGpyWnRJhiCS62XsTYKVErT9kPpv4hN"),
  usernameRegistry: new PublicKey("65oKjSjcGYR61ASzDYczbodz6H8TARtJyQGvb5V9y9W1"),
  socialGraph: new PublicKey("8kKnWvbmTjWq5uPePk79RRbQMAXCszNFzHdRwUS4N74w"),
  tipRegistry: new PublicKey("TipReg1111111111111111111111111111111111111"),
  karmaRegistry: new PublicKey("KarmaReg11111111111111111111111111111111111"),
};

// Network discriminator used by message envelopes.
export const NETWORK_DEVNET = 2;

export const TRIBE_STORAGE_KEYS = {
  appKeySecret: "tribeapp_wtf_app_key_secret",
  tid: "tribeapp_wtf_tid",
  tidWallet: "tribeapp_wtf_tid_wallet",
};
