"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import {
  claimCrowdfundFundsOnchain,
  createCrowdfundOnchain,
  pledgeCrowdfundOnchain,
  refundCrowdfundOnchain,
  signAndPublishCrowdfund,
  signAndPublishPledge,
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

export interface CreateCrowdfundResult {
  envelopeHash: string;
  /** PDA address of the on-chain Crowdfund when wallet is connected. */
  crowdfundPda?: string;
  /** Per-creator monotonic id of the on-chain Crowdfund. */
  crowdfundId?: string;
  /** Solana tx signature for the on-chain create_crowdfund call. */
  txSignature?: string;
}

export function useTribeCrowdfund() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      crowdfundId: string,
      title: string,
      goalAmount: number,
      opts: Parameters<typeof signAndPublishCrowdfund>[5] = {}
    ): Promise<CreateCrowdfundResult> => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        const envelope = await signAndPublishCrowdfund(
          identity.tid,
          crowdfundId,
          title,
          goalAmount,
          secret,
          opts
        );

        // On-chain registration when a wallet is connected. Treats
        // `goalAmount` as SOL (whole units) and converts to lamports
        // for the on-chain integer-only escrow accounting.
        if (wallet) {
          try {
            // crowdfund-registry rejects past deadlines; supply a
            // sane default of +30 days when the envelope didn't
            // specify one.
            const nowSec = Math.floor(Date.now() / 1000);
            const deadlineAtUnix =
              opts.deadlineAtUnix && opts.deadlineAtUnix > nowSec
                ? opts.deadlineAtUnix
                : nowSec + 30 * 24 * 60 * 60;
            const goalAmountLamports = BigInt(
              Math.floor(goalAmount * LAMPORTS_PER_SOL)
            );

            const provider = new AnchorProvider(connection, wallet, {
              commitment: "confirmed",
            });
            const result = await createCrowdfundOnchain(provider, {
              creatorTid: identity.tid,
              goalAmountLamports,
              deadlineAtUnix,
              metadataHash: decodeEnvelopeHash(envelope.hash),
            });
            return {
              envelopeHash: envelope.hash,
              crowdfundPda: result.crowdfundPda.toBase58(),
              crowdfundId: result.crowdfundId.toString(),
              txSignature: result.txSig,
            };
          } catch (chainErr) {
            console.warn(
              "On-chain crowdfund create failed (envelope persisted):",
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

  const pledge = useCallback(
    async (crowdfundId: string, amount: number, currency = "USD") => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishPledge(
          identity.tid,
          crowdfundId,
          amount,
          secret,
          currency
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

  /** Pledge real SOL to an on-chain Crowdfund PDA. Pair with the
   *  envelope-based `pledge` for off-chain-only signal pledges. */
  const pledgeOnchain = useCallback(
    async (crowdfundPda: PublicKey, amountSol: number) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        const amountLamports = BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL));
        return await pledgeCrowdfundOnchain(provider, {
          crowdfundPda,
          backerTid: identity.tid,
          amountLamports,
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

  /** Creator-only sweep when the campaign succeeded. */
  const claimFunds = useCallback(
    async (crowdfundPda: PublicKey) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await claimCrowdfundFundsOnchain(provider, crowdfundPda);
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

  /** Backer-only refund when the campaign failed. Closes the Pledge
   *  PDA; rent + pledged lamports return to the backer. */
  const refund = useCallback(
    async (crowdfundPda: PublicKey) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await refundCrowdfundOnchain(provider, crowdfundPda);
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
    pledge,
    pledgeOnchain,
    claimFunds,
    refund,
    pending,
    error,
    ready: identity !== null,
    walletReady: wallet !== undefined,
  };
}
