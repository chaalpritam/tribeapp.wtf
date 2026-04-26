"use client";

import {
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function WalletPage() {
  const { isAuthenticated, profile, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div>
        <div className="sticky top-0 z-40 border-b bg-background/80 px-4 py-3 backdrop-blur-lg">
          <h1 className="text-lg font-bold">Wallet</h1>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Wallet className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-bold">Sign In Required</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Sign in with Farcaster to view your wallet and interact with the
            community.
          </p>
          <a
            href="/onboarding/connect"
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            Sign in with Farcaster
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-40 border-b bg-background/80 px-4 py-3 backdrop-blur-lg">
        <h1 className="text-lg font-bold">Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 p-6 text-white shadow-tribe-large">
          <p className="mb-1 text-sm text-white/70">Balance</p>
          <p className="mb-4 text-3xl font-bold">&mdash;</p>
          {profile && (
            <p className="text-sm text-white/70">
              @{profile.username}
            </p>
          )}
        </div>
      </div>

      {/* Profile */}
      {profile && (
        <div className="px-4 pb-4">
          <h2 className="mb-3 text-base font-semibold">Profile</h2>
          <div className="rounded-xl border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Username</span>
              <span className="text-sm font-medium">@{profile.username}</span>
            </div>
            {profile.bio && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bio</span>
                <span className="text-sm font-medium truncate ml-4">
                  {profile.bio}
                </span>
              </div>
            )}
            {profile.fid && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">FID</span>
                <span className="text-sm font-bold text-purple-600">
                  #{profile.fid}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <div className="rounded-xl border p-3">
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-sm font-medium">Network</span>
          </div>
          <p className="mt-1 text-lg font-bold">Connected</p>
        </div>
        <div className="rounded-xl border p-3">
          <div className="flex items-center gap-2 text-indigo-500">
            <span className="text-sm font-medium">Status</span>
          </div>
          <p className="mt-1 text-lg font-bold">Active</p>
        </div>
      </div>

      {/* Disconnect */}
      <div className="px-4 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
