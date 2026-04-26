"use client";

import { useAuthStore } from "@/store/use-auth-store";

export function useCurrentWallet() {
  const { status, profile } = useAuthStore();

  return {
    isConnected: status === "authenticated",
    mainUsername: profile?.username ?? null,
    loading: false,
  };
}
