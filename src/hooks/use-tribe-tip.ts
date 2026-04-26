"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getCustodyByTid,
  sendTipOnchain,
  signAndPublishTip,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Decode the base64-encoded blake3 tweet hash that the hub returns
 * back into the 32-byte buffer the on-chain `target_hash` field
 * expects. Returns null if the input isn't a 32-byte hash.
 */
function decodeTargetHash(value: string | undefined): Uint8Array | undefined {
  if (!value) return undefined;
  try {
    const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    return bytes.length === 32 ? bytes : undefined;
  } catch {
    return undefined;
  }
}

export interface TipOptions {
  currency?: string;
  /** Base64 hash of the tweet/comment being tipped. */
  targetHash?: string;
  /** Pre-supplied tx_signature; skips the on-chain path entirely. */
  txSignature?: string;
  /** Force off-chain only even when a wallet is connected. */
  envelopeOnly?: boolean;
}

export interface TipResult {
  hash: string;
  txSignature?: string;
  tipRecordPda?: string;
}

export function useTribeTip() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const tip = useCallback(
    async (
      recipientTid: number,
      amount: number,
      opts: TipOptions = {}
    ): Promise<TipResult> => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        let txSignature = opts.txSignature;
        let tipRecordPda: string | undefined;

        // On-chain settlement when a wallet is connected and the
        // caller didn't ask for envelope-only. We translate the
        // human-friendly `amount` (whole SOL units) into lamports
        // for the program.
        if (wallet && !opts.envelopeOnly && !opts.txSignature) {
          const recipient = await getCustodyByTid(connection, recipientTid);
          if (recipient) {
            const provider = new AnchorProvider(connection, wallet, {
              commitment: "confirmed",
            });
            const amountLamports = BigInt(
              Math.floor(amount * LAMPORTS_PER_SOL)
            );
            const result = await sendTipOnchain(provider, {
              senderTid: identity.tid,
              recipient,
              recipientTid,
              amountLamports,
              targetHash: decodeTargetHash(opts.targetHash),
            });
            txSignature = result.txSig;
            tipRecordPda = result.tipRecord.toBase58();
          }
        }

        // Always publish the off-chain envelope so the social feed
        // shows the tip alongside its on-chain receipt anchor when
        // present. Best-effort relative to the on-chain settlement;
        // a failure here doesn't undo the lamport transfer.
        const secret = fromBase64(identity.appKeySecret);
        const envelope = await signAndPublishTip(
          identity.tid,
          recipientTid,
          amount,
          secret,
          {
            currency: opts.currency,
            targetHash: opts.targetHash,
            txSignature,
          }
        );
        return { hash: envelope.hash, txSignature, tipRecordPda };
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [identity, wallet, connection]
  );

  return {
    tip,
    pending,
    error,
    ready: identity !== null,
    /** True when a Solana wallet is connected — tips will settle on chain. */
    walletReady: wallet !== undefined,
  };
}
