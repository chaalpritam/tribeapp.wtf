"use client";

import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import nacl from "tweetnacl";
import { addAppKey, registerDmKey } from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generate a fresh ed25519 device key, register it on-chain against
 * the current TID, swap the local persisted identity to use it, and
 * re-publish the DM key with the new signing key.
 *
 * v1 leaves the old app key valid (multiple app keys per TID are OK).
 * Explicit revocation of the previous key is a separate UX, gated on
 * confirming with another device.
 */
export function useTribeRotateAppKey() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { identity, setIdentity, setStatus, setError } = useTribeIdentityStore();
  const [pending, setPending] = useState(false);

  const rotate = useCallback(async () => {
    if (!identity) throw new Error("No tribe identity");
    if (!wallet) throw new Error("Connect a Solana wallet first");

    setPending(true);
    setStatus("registering");
    setError(null);

    try {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });

      const newKeypair = nacl.sign.keyPair();
      const newSecret = toBase64(newKeypair.secretKey);
      const newPubkey = toBase64(newKeypair.publicKey);

      await addAppKey(
        provider,
        identity.tid,
        new PublicKey(newKeypair.publicKey),
        0,
        0
      );

      const updated = {
        ...identity,
        appKeySecret: newSecret,
        appKeyPubkey: newPubkey,
      };
      setIdentity(updated);

      // Re-publish the DM key registration with the new app key so
      // peer encryption keeps working.
      try {
        await registerDmKey(
          identity.tid,
          new Uint8Array(Buffer.from(newSecret, "base64"))
        );
      } catch {
        // best effort
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rotate failed";
      setError(message);
      throw err;
    } finally {
      setPending(false);
    }
  }, [connection, wallet, identity, setIdentity, setStatus, setError]);

  return {
    rotate,
    pending,
    walletConnected: wallet !== undefined,
    ready: identity !== null && wallet !== undefined,
  };
}
