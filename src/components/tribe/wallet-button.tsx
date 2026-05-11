"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useTribeUser } from "@/hooks/use-tribe-user";
import { cn, formatHandle } from "@/lib/utils";

interface WalletButtonProps {
  className?: string;
  compact?: boolean;
}

export function WalletButton({ className, compact }: WalletButtonProps) {
  const { isAuthenticated, profile, logout } = useAuth();
  const tribeIdentity = useTribeIdentityStore((s) => s.identity);
  const resetTribe = useTribeIdentityStore((s) => s.reset);
  const router = useRouter();

  // Fetch the hub profile so we always show the real registered username
  const tid = profile?.tid ?? tribeIdentity?.tid ?? null;
  const { user: hubUser } = useTribeUser(tid);

  const signedIn = isAuthenticated || tribeIdentity !== null;

  if (signedIn) {
    // Priority: hub username → identity store username → TID fallback
    const resolvedUsername =
      hubUser?.username?.trim() ||
      hubUser?.profile?.displayName?.trim() ||
      profile?.username ||
      tribeIdentity?.username ||
      (tid != null ? `#${tid}` : null);

    const label = resolvedUsername
      ? formatHandle(resolvedUsername)
      : "signed in";

    return (
      <button
        onClick={() => {
          if (isAuthenticated) logout();
          if (tribeIdentity) resetTribe();
        }}
        className={cn(
          "flex items-center gap-3 rounded-[20px] bg-muted/60 px-5 py-3 text-sm transition-all hover:bg-muted active:scale-95",
          className
        )}
      >
        <div className="relative">
          <div className="h-5 w-5 rounded-full bg-primary" />
          <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
        </div>
        {!compact && (
          <span className="font-bold text-black tracking-tight">{label}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/onboarding/connect")}
      className={cn(
        "flex items-center gap-3 rounded-[20px] bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-sm shadow-primary/20",
        className
      )}
    >
      {!compact && <span>Sign In</span>}
    </button>
  );
}
