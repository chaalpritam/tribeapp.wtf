"use client";

import { useCallback } from "react";
import { Keypair } from "@solana/web3.js";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import nacl from "tweetnacl";
import {
  registerTid,
  addAppKey,
  initSocialProfile,
  registerUsername,
  getTidByCustody,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface RegisterOptions {
  username?: string;
}

export function useTribeRegister() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { setIdentity, setStatus, setError, identity } =
    useTribeIdentityStore();

  const register = useCallback(
    async ({ username }: RegisterOptions = {}) => {
      if (!wallet) throw new Error("Connect a Solana wallet first");

      setStatus("registering");
      setError(null);

      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });

        // 1. Register or recover the TID for this custody wallet.
        let tid: number;
        const existing = await getTidByCustody(connection, wallet.publicKey);
        if (existing !== null) {
          tid = existing;
        } else {
          const result = await registerTid(provider, wallet.publicKey);
          tid = result.tid;
        }

        // 2. Generate a fresh ed25519 app signing key for this device.
        const appKeypair = nacl.sign.keyPair();
        const appKeySecret = toBase64(appKeypair.secretKey);
        const appKeyPubkey = toBase64(appKeypair.publicKey);

        // 3. Register the app key on-chain (scope 0 = full app key).
        await addAppKey(
          provider,
          tid,
          // The Anchor add_app_key instruction takes a Solana PublicKey;
          // an ed25519 pubkey is the same 32-byte representation.
          new (await import("@solana/web3.js")).PublicKey(appKeypair.publicKey),
          0,
          0
        );

        // 4. Make sure the social profile PDA exists.
        await initSocialProfile(provider, tid);

        // 5. Optional username registration.
        if (username) {
          await registerUsername(provider, tid, username);
        }

        setIdentity({
          tid,
          custodyWallet: wallet.publicKey.toBase58(),
          username: username ?? null,
          appKeySecret,
          appKeyPubkey,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to register";
        setError(message);
        throw err;
      }
    },
    [connection, wallet, setIdentity, setStatus, setError]
  );

  return {
    register,
    identity,
    walletConnected: wallet !== undefined,
  };
}
