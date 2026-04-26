import { env } from "@/lib/env";

export const XMTP_ENV = env.NEXT_PUBLIC_XMTP_ENV;

export const STORAGE_KEYS = {
  EPHEMERAL_KEY: "tribe-xmtp-ephemeral-key",
  IDENTITY_MAP: "tribe-xmtp-identity-map",
  TRIBE_GROUP_MAP: "tribe-xmtp-tribe-groups",
} as const;
