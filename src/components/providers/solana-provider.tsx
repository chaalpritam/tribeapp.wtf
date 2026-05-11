"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { BrowserWalletAdapter } from "@/lib/browser-wallet/adapter";
import { BrowserWalletSetup } from "@/components/auth/browser-wallet-setup";
import { SOLANA_RPC_URL } from "@/lib/tribe/constants";

import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);
  const wallets = useMemo(() => [new BrowserWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <BrowserWalletSetup />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
