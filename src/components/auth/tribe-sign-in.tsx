"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2 } from "lucide-react";
import { useTribeRegister } from "@/hooks/use-tribe-register";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { cn } from "@/lib/utils";

interface TribeSignInProps {
  onSuccess?: () => void;
  className?: string;
}

export function TribeSignIn({ onSuccess, className }: TribeSignInProps) {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { register } = useTribeRegister();
  const { status, error, identity } = useTribeIdentityStore();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    if (identity) {
      onSuccess?.();
      return;
    }
    try {
      setBusy(true);
      await register();
      onSuccess?.();
    } catch {
      // error already in store
    } finally {
      setBusy(false);
    }
  };

  const label = identity
    ? `Continue as TID ${identity.tid}`
    : connected
      ? status === "registering" || busy
        ? "Registering on Solana..."
        : "Sign in with Tribe"
      : "Connect Solana wallet";

  return (
    <div className={cn("flex flex-col items-stretch gap-3", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "registering" || busy}
        className="flex items-center justify-center gap-2 rounded-[24px] bg-foreground px-6 py-4 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
      >
        {(status === "registering" || busy) && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        <span>{label}</span>
      </button>

      {connected && publicKey && (
        <div className="text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          Wallet {publicKey.toBase58().slice(0, 4)}…
          {publicKey.toBase58().slice(-4)}{" "}
          <button
            type="button"
            onClick={() => disconnect()}
            className="underline hover:text-foreground"
          >
            disconnect
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-center text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
