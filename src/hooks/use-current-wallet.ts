"use client";

import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

export function useCurrentWallet() {
  const identity = useTribeIdentityStore((s) => s.identity);
  return {
    isConnected: identity !== null,
    mainUsername: identity?.username ?? null,
    walletAddress: identity?.custodyWallet ?? null,
    loading: false,
  };
}
