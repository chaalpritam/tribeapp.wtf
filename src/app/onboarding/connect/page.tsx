"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NeynarSignIn } from "@/components/auth/neynar-sign-in";
import { TribeSignIn } from "@/components/auth/tribe-sign-in";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

export default function ConnectPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const tribeIdentity = useTribeIdentityStore((s) => s.identity);
  const signedIn = isAuthenticated || tribeIdentity !== null;
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasHydrated && signedIn) {
      router.push("/onboarding/city");
    }
  }, [signedIn, router, hasHydrated]);

  const handleSIWNSuccess = () => {
    router.push("/onboarding/city");
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-muted animate-pulse shadow-lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
          <svg
            viewBox="0 0 24 24"
            className="h-14 w-14 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 className="mb-3 text-3xl font-black tracking-tighter">
          {signedIn ? "Welcome Back!" : "Choose your sign-in"}
        </h1>
        <p className="mb-10 text-[15px] font-medium text-muted-foreground leading-relaxed">
          {signedIn
            ? "You're already authenticated. Continue to explore your neighborhood and connect with your tribes."
            : "Bring your Farcaster identity, or claim a Tribe ID on Solana. Your identity travels with you across the decentralized social web."}
        </p>

        {signedIn ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/onboarding/city")}
            className="w-full rounded-[32px] bg-primary py-5 text-lg font-black text-white shadow-2xl shadow-primary/20 hover:opacity-90 transition-all"
          >
            Continue with Tribe
          </motion.button>
        ) : (
          <div className="space-y-5">
            <TribeSignIn onSuccess={handleSIWNSuccess} />
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <NeynarSignIn
              onSuccess={handleSIWNSuccess}
              className="flex justify-center"
            />
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#999]">
          <Shield className="h-3.5 w-3.5" />
          <span>Tribe protocol on Solana · Farcaster via Neynar</span>
        </div>

        <Link
          href="/home"
          className="mt-4 inline-block py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Browse as guest
        </Link>
      </motion.div>
    </div>
  );
}
