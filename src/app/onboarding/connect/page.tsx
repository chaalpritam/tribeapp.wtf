"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TribeSignIn } from "@/components/auth/tribe-sign-in";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useMounted } from "@/hooks/use-mounted";

export default function ConnectPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const tribeIdentity = useTribeIdentityStore((s) => s.identity);
  const mounted = useMounted();
  const signedIn = mounted && (isAuthenticated || tribeIdentity !== null);

  useEffect(() => {
    if (signedIn) router.replace("/onboarding/city");
  }, [signedIn, router]);

  const handleSignInSuccess = () => {
    router.replace("/onboarding/city");
  };

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
          {signedIn ? "Welcome Back!" : "Sign in with Tribe"}
        </h1>
        <p className="mb-10 text-[15px] font-medium text-muted-foreground leading-relaxed">
          {signedIn
            ? "You're already authenticated. Continue to explore your neighborhood and connect with your tribes."
            : "Connect your Solana wallet to claim a Tribe ID. Your identity travels with you across the decentralized social web."}
        </p>

        {signedIn ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.replace("/onboarding/city")}
            className="w-full rounded-[32px] bg-primary py-5 text-lg font-black text-white shadow-2xl shadow-primary/20 hover:opacity-90 transition-all"
          >
            Continue with Tribe
          </motion.button>
        ) : (
          <TribeSignIn onSuccess={handleSignInSuccess} />
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#999]">
          <Shield className="h-3.5 w-3.5" />
          <span>Tribe protocol on Solana</span>
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
