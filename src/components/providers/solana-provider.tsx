"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { SOLANA_RPC_URL } from "@/lib/tribe/constants";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
