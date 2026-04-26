"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  image?: string;
  namespace?: string;
  created_at?: string;
  socialCounts?: {
    followers: number;
    following: number;
    posts: number;
  };
  fid?: number;
  signerUuid?: string;
  displayName?: string;
  pfpUrl?: string;
  custodyAddress?: string;
  verifiedAddresses?: string[];
}

export type AuthStatus = "disconnected" | "authenticated";

interface AuthState {
  status: AuthStatus;
  profile: UserProfile | null;
  error: string | null;

  setStatus: (status: AuthStatus) => void;
  setProfile: (profile: UserProfile | null) => void;
  setError: (error: string | null) => void;
  setFarcasterAuth: (data: {
    fid: number;
    signerUuid: string;
    username: string;
    displayName: string;
    pfpUrl?: string;
    bio?: string;
    custodyAddress?: string;
    verifiedAddresses?: string[];
  }) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: "disconnected",
      profile: null,
      error: null,

      setStatus: (status) => set({ status, error: null }),
      setProfile: (profile) =>
        set({
          profile,
          status: profile ? "authenticated" : "disconnected",
        }),
      setError: (error) => set({ error }),
      setFarcasterAuth: (data) =>
        set({
          status: "authenticated",
          error: null,
          profile: {
            id: `fid-${data.fid}`,
            username: data.username,
            displayName: data.displayName,
            bio: data.bio,
            image: data.pfpUrl,
            pfpUrl: data.pfpUrl,
            fid: data.fid,
            signerUuid: data.signerUuid,
            custodyAddress: data.custodyAddress,
            verifiedAddresses: data.verifiedAddresses,
          },
        }),
      reset: () =>
        set({
          status: "disconnected",
          profile: null,
          error: null,
        }),
    }),
    {
      name: "tribe-auth",
      partialize: (state) => ({
        profile: state.profile,
        status: state.profile ? "authenticated" : "disconnected",
      }),
    }
  )
);
