"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/use-auth-store";

export function useAuth() {
  const {
    status,
    profile,
    error,
    setProfile,
    setError,
    setFarcasterAuth,
    reset,
  } = useAuthStore();

  const updateProfile = useCallback(
    async (updates: { username?: string; bio?: string; image?: string }) => {
      if (!profile?.id) {
        setError("No profile to update");
        return;
      }

      try {
        setProfile({
          ...profile,
          ...updates,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update profile"
        );
        throw err;
      }
    },
    [profile, setProfile, setError]
  );

  const loginWithNeynar = useCallback(
    (data: {
      fid: number;
      signerUuid: string;
      username: string;
      displayName: string;
      pfpUrl?: string;
      bio?: string;
    }) => {
      setFarcasterAuth(data);
    },
    [setFarcasterAuth]
  );

  const logout = useCallback(async () => {
    reset();
  }, [reset]);

  return {
    status,
    profile,
    error,
    fid: profile?.fid ?? null,
    signerUuid: profile?.signerUuid ?? null,
    isAuthenticated: status === "authenticated",
    updateProfile,
    loginWithNeynar,
    logout,
  };
}
