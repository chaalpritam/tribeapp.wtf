"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { SOLANA_RPC_URL } from "@/lib/tribe/constants";
import { BrowserWalletAdapter } from "@/lib/browser-wallet/adapter";
import { BrowserWalletSetup } from "@/components/auth/browser-wallet-setup";

import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);
  // Browser Wallet sits alongside Phantom / Solflare. The adapter
  // signals back to BrowserWalletSetup (mounted below) when the user
  // picks it but no keypair exists yet, so the BIP39 create / import
  // flow pops without a separate "set up a wallet" button.
  const wallets = useMemo(
    () => [
      new BrowserWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

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
