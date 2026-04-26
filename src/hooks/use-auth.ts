"use client";

import { useCallback } from "react";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { clearDmKeypair } from "@/lib/tribe";

export interface AuthProfile {
  id: string;
  tid: number;
  username: string;
  displayName?: string;
  image?: string;
}

/**
 * Auth surface for the app. Backed by the Tribe identity store —
 * "authenticated" means the caller has a TID + app key registered.
 */
export function useAuth() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const error = useTribeIdentityStore((s) => s.error);
  const reset = useTribeIdentityStore((s) => s.reset);

  const profile: AuthProfile | null = identity
    ? {
        id: `tid-${identity.tid}`,
        tid: identity.tid,
        username: identity.username ?? `tid:${identity.tid}`,
        displayName: identity.username ?? undefined,
      }
    : null;

  const logout = useCallback(async () => {
    clearDmKeypair();
    reset();
  }, [reset]);

  return {
    status: identity ? ("authenticated" as const) : ("disconnected" as const),
    profile,
    isAuthenticated: profile !== null,
    error,
    tid: identity?.tid ?? null,
    logout,
  };
}
