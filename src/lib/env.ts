export const env = {
  NEYNAR_API_KEY: process.env.NEYNAR_API_KEY ?? "",
  NEXT_PUBLIC_NEYNAR_CLIENT_ID:
    process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID ?? "",
  NEXT_PUBLIC_XMTP_ENV:
    (process.env.NEXT_PUBLIC_XMTP_ENV as "dev" | "production" | "local") ??
    "dev",
} as const;
