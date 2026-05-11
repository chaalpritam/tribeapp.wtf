"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useMounted } from "@/hooks/use-mounted";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const { isAuthenticated } = useAuth();
  const identity = useTribeIdentityStore((s) => s.identity);
  const signedIn = mounted && (isAuthenticated || identity !== null);

  useEffect(() => {
    if (!mounted) return;
    if (!signedIn) {
      router.replace("/onboarding/connect");
    }
  }, [mounted, signedIn, router]);

  if (!mounted || !signedIn) return null;
  return <>{children}</>;
}
