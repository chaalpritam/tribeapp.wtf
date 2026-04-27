"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  registerChannelOnchain,
  signAndPublishChannelOp,
  CHANNEL_KIND_CITY,
  CHANNEL_KIND_INTEREST,
} from "@/lib/tribe";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Decode the base64 envelope hash returned by the hub into the
 *  32-byte buffer the on-chain `metadata_hash` expects. Falls back
 *  to a zero buffer when input is malformed so the on-chain call
 *  still anchors with a no-link sentinel. */
function decodeEnvelopeHash(b64: string): Uint8Array {
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (bytes.length === 32) return bytes;
  } catch {
    // fall through
  }
  return new Uint8Array(32);
}

export type ChannelKind =
  | typeof CHANNEL_KIND_CITY
  | typeof CHANNEL_KIND_INTEREST;

export interface CreateChannelResult {
  envelopeHash: string;
  /** Channel PDA when wallet is connected and on-chain register succeeded. */
  channelPda?: string;
  /** Solana tx signature for the on-chain register_channel call. */
  txSignature?: string;
}

export function useTribeChannels() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      channelId: string,
      name: string,
      opts: {
        description?: string;
        kind?: ChannelKind;
        latitude?: number;
        longitude?: number;
      } = {}
    ): Promise<CreateChannelResult> => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        // Envelope first so we have a content hash to anchor on chain.
        const envelope = await signAndPublishChannelOp(
          9,
          identity.tid,
          {
            channel_id: channelId,
            name,
            description: opts.description,
          },
          secret
        );

        // On-chain claim of the slug when a wallet is connected. Best
        // effort: a chain failure doesn't undo the envelope; the
        // off-chain feed already lists the channel.
        if (wallet) {
          try {
            const provider = new AnchorProvider(connection, wallet, {
              commitment: "confirmed",
            });
            const result = await registerChannelOnchain(provider, {
              id: channelId,
              kind: opts.kind ?? CHANNEL_KIND_INTEREST,
              ownerTid: identity.tid,
              latitude: opts.latitude,
              longitude: opts.longitude,
              metadataHash: decodeEnvelopeHash(envelope.hash),
            });
            return {
              envelopeHash: envelope.hash,
              channelPda: result.channelPda.toBase58(),
              txSignature: result.txSig,
            };
          } catch (chainErr) {
            console.warn(
              "On-chain channel register failed (envelope persisted):",
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

  const join = useCallback(
    async (channelId: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishChannelOp(
          10,
          identity.tid,
          { channel_id: channelId },
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

  const leave = useCallback(
    async (channelId: string) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishChannelOp(
          11,
          identity.tid,
          { channel_id: channelId },
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

  return {
    create,
    join,
    leave,
    pending,
    error,
    ready: identity !== null,
    walletReady: wallet !== undefined,
  };
}
