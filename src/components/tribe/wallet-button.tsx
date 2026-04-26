"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { cn } from "@/lib/utils";

interface WalletButtonProps {
  className?: string;
  compact?: boolean;
}

export function WalletButton({ className, compact }: WalletButtonProps) {
  const { isAuthenticated, profile, logout } = useAuth();
  const tribeIdentity = useTribeIdentityStore((s) => s.identity);
  const resetTribe = useTribeIdentityStore((s) => s.reset);
  const router = useRouter();

  const signedIn = isAuthenticated || tribeIdentity !== null;

  if (signedIn) {
    const label = profile?.username
      ? `@${profile.username}`
      : tribeIdentity
        ? `tid:${tribeIdentity.tid}`
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
