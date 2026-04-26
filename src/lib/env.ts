export const env = {
  NEYNAR_API_KEY: process.env.NEYNAR_API_KEY ?? "",
  NEXT_PUBLIC_NEYNAR_CLIENT_ID:
    process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID ?? "",
  NEXT_PUBLIC_XMTP_ENV:
    (process.env.NEXT_PUBLIC_XMTP_ENV as "dev" | "production" | "local") ??
    "dev",
  NEXT_PUBLIC_SOLANA_RPC_URL:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  NEXT_PUBLIC_HUB_URL:
    process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:4000",
  NEXT_PUBLIC_ER_SERVER_URL:
    process.env.NEXT_PUBLIC_ER_SERVER_URL ?? "http://localhost:3003",
  NEXT_PUBLIC_HUB_URLS: process.env.NEXT_PUBLIC_HUB_URLS ?? "",
  NEXT_PUBLIC_ER_SERVER_URLS: process.env.NEXT_PUBLIC_ER_SERVER_URLS ?? "",
} as const;
