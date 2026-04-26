"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import {
  cancelTaskOnchain,
  claimTaskOnchain,
  completeTaskOnchain,
  createTaskOnchain,
  signAndPublishTask,
  signAndPublishTaskTransition,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function decodeEnvelopeHash(b64: string): Uint8Array {
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (bytes.length === 32) return bytes;
  } catch {
    // fall through
  }
  return new Uint8Array(32);
}

export interface CreateTaskResult {
  envelopeHash: string;
  /** PDA address of the on-chain Task when wallet is connected. */
  taskPda?: string;
  /** Per-creator monotonic id of the on-chain Task. */
  taskId?: string;
  /** Solana tx signature for the on-chain create_task call. */
  txSignature?: string;
}

export function useTribeTask() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      taskId: string,
      title: string,
      opts: Parameters<typeof signAndPublishTask>[4] & {
        /** Optional reward to escrow on chain, in SOL. */
        rewardSol?: number;
      } = {}
    ): Promise<CreateTaskResult> => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const { rewardSol, ...envelopeOpts } = opts;
        const secret = fromBase64(identity.appKeySecret);
        const envelope = await signAndPublishTask(
          identity.tid,
          taskId,
          title,
          secret,
          envelopeOpts
        );

        // On-chain registration when a wallet is connected. Best
        // effort: chain failure doesn't undo the envelope.
        if (wallet) {
          try {
            const provider = new AnchorProvider(connection, wallet, {
              commitment: "confirmed",
            });
            const rewardLamports = BigInt(
              Math.floor((rewardSol ?? 0) * LAMPORTS_PER_SOL)
            );
            const result = await createTaskOnchain(provider, {
              creatorTid: identity.tid,
              rewardLamports,
              metadataHash: decodeEnvelopeHash(envelope.hash),
            });
            return {
              envelopeHash: envelope.hash,
              taskPda: result.taskPda.toBase58(),
              taskId: result.taskId.toString(),
              txSignature: result.txSig,
            };
          } catch (chainErr) {
            console.warn(
              "On-chain task create failed (envelope persisted):",
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

  /** Off-chain envelope claim (TASK_CLAIM = type 21). */
  const claim = useCallback(
    async (taskId: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishTaskTransition(
          identity.tid,
          taskId,
          21,
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

  /** Off-chain envelope complete (TASK_COMPLETE = type 22). */
  const complete = useCallback(
    async (taskId: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishTaskTransition(
          identity.tid,
          taskId,
          22,
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

  /** Claim an on-chain Task. Lock it to the signer; reverts if
   *  signer is the creator or task isn't Open. */
  const claimOnchain = useCallback(
    async (taskPda: PublicKey) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await claimTaskOnchain(provider, {
          taskPda,
          claimerTid: identity.tid,
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

  /** Creator-only. Marks complete and releases any escrowed reward
   *  to the claimer of record (must match task.claimer). */
  const completeOnchain = useCallback(
    async (taskPda: PublicKey, claimer: PublicKey) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await completeTaskOnchain(provider, { taskPda, claimer });
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

  /** Creator-only. Refunds any escrow and flips status to Cancelled.
   *  Only valid while still Open (program rejects cancel after claim). */
  const cancelOnchain = useCallback(
    async (taskPda: PublicKey) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await cancelTaskOnchain(provider, taskPda);
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
    claim,
    complete,
    claimOnchain,
    completeOnchain,
    cancelOnchain,
    pending,
    error,
    ready: identity !== null,
    walletReady: wallet !== undefined,
  };
}
