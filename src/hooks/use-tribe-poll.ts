"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { type PublicKey } from "@solana/web3.js";
import {
  createPollOnchain,
  signAndPublishPoll,
  signAndPublishPollVote,
  votePollOnchain,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Decode a base64-encoded BLAKE3 envelope hash into the 32-byte
 *  buffer the on-chain `metadata_hash` field expects. Falls back to
 *  a zero buffer when the input isn't a valid 32-byte hash, letting
 *  the on-chain call still go through with a no-link sentinel. */
function decodeEnvelopeHash(b64: string): Uint8Array {
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (bytes.length === 32) return bytes;
  } catch {
    // fall through
  }
  return new Uint8Array(32);
}

export interface CreatePollResult {
  envelopeHash: string;
  /** PDA address of the on-chain Poll when wallet is connected. */
  pollPda?: string;
  /** Per-creator monotonic id of the on-chain Poll. */
  pollId?: string;
  /** Solana tx signature for the on-chain create_poll call. */
  txSignature?: string;
}

export function useTribePoll() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      pollId: string,
      question: string,
      options: string[],
      opts: { expiresAtUnix?: number; channelId?: string } = {}
    ): Promise<CreatePollResult> => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        const envelope = await signAndPublishPoll(
          identity.tid,
          pollId,
          question,
          options,
          secret,
          opts
        );

        // On-chain registration when a wallet is connected. Best
        // effort: a chain failure doesn't undo the envelope.
        if (wallet) {
          try {
            const provider = new AnchorProvider(connection, wallet, {
              commitment: "confirmed",
            });
            const result = await createPollOnchain(provider, {
              creatorTid: identity.tid,
              optionCount: options.length,
              expiresAtUnix: opts.expiresAtUnix,
              metadataHash: decodeEnvelopeHash(envelope.hash),
            });
            return {
              envelopeHash: envelope.hash,
              pollPda: result.pollPda.toBase58(),
              pollId: result.pollId.toString(),
              txSignature: result.txSig,
            };
          } catch (chainErr) {
            console.warn(
              "On-chain poll create failed (envelope persisted):",
              chainErr
            );
          }
        }

        return { envelopeHash: envelope.hash };
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

  const vote = useCallback(
    async (pollId: string, optionIndex: number) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishPollVote(
          identity.tid,
          pollId,
          optionIndex,
          secret
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [identity]
  );

  /** Cast a vote on an on-chain Poll PDA. Pair with the existing
   *  envelope-based `vote` when you only have a string poll_id. */
  const voteOnchain = useCallback(
    async (pollPda: PublicKey, optionIndex: number) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await votePollOnchain(provider, {
          pollPda,
          voterTid: identity.tid,
          optionIndex,
        });
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
    create,
    vote,
    voteOnchain,
    pending,
    error,
    ready: identity !== null,
    walletReady: wallet !== undefined,
  };
}
