"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TribeIdentity {
  tid: number;
  custodyWallet: string;
  username?: string | null;
  // Base64-encoded ed25519 secret key for the per-app signing key.
  appKeySecret: string;
  appKeyPubkey: string;
}

interface TribeIdentityState {
  identity: TribeIdentity | null;
  status: "idle" | "registering" | "ready" | "error";
  error: string | null;

  setIdentity: (identity: TribeIdentity | null) => void;
  setStatus: (status: TribeIdentityState["status"]) => void;
  setError: (error: string | null) => void;
  setUsername: (username: string) => void;
  reset: () => void;
}

export const useTribeIdentityStore = create<TribeIdentityState>()(
  persist(
    (set) => ({
      identity: null,
      status: "idle",
      error: null,

      setIdentity: (identity) =>
        set({
          identity,
          status: identity ? "ready" : "idle",
          error: null,
        }),
      setStatus: (status) => set({ status }),
      setError: (error) =>
        set({ error, status: error ? "error" : "idle" }),
      setUsername: (username) =>
        set((state) =>
          state.identity
            ? { identity: { ...state.identity, username } }
            : state
        ),
      reset: () => set({ identity: null, status: "idle", error: null }),
    }),
    {
      name: "tribeapp-wtf-tribe-identity",
      partialize: (state) => ({ identity: state.identity }),
    }
  )
);
