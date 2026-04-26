"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { type PublicKey } from "@solana/web3.js";
import {
  createEventOnchain,
  rsvpEventOnchain,
  signAndPublishEvent,
  signAndPublishRsvp,
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

export type EventStatus = "yes" | "no" | "maybe";

const STATUS_ENUM: Record<EventStatus, 1 | 2 | 3> = {
  yes: 1,
  no: 2,
  maybe: 3,
};

export interface CreateEventResult {
  envelopeHash: string;
  /** PDA address of the on-chain Event when wallet is connected. */
  eventPda?: string;
  /** Per-creator monotonic id of the on-chain Event. */
  eventId?: string;
  /** Solana tx signature for the on-chain create_event call. */
  txSignature?: string;
}

export function useTribeEvent() {
  const identity = useTribeIdentityStore((s) => s.identity);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      eventId: string,
      title: string,
      startsAtUnix: number,
      opts: Parameters<typeof signAndPublishEvent>[5] = {}
    ): Promise<CreateEventResult> => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        // Envelope first so we have a content hash to anchor on chain.
        const envelope = await signAndPublishEvent(
          identity.tid,
          eventId,
          title,
          startsAtUnix,
          secret,
          opts
        );

        // On-chain registration when a wallet is connected. Best
        // effort: a chain failure doesn't undo the envelope; the
        // social feed already has the event listed.
        if (wallet) {
          try {
            const provider = new AnchorProvider(connection, wallet, {
              commitment: "confirmed",
            });
            const result = await createEventOnchain(provider, {
              creatorTid: identity.tid,
              startsAtUnix,
              endsAtUnix: opts.endsAtUnix,
              latitude: opts.latitude,
              longitude: opts.longitude,
              metadataHash: decodeEnvelopeHash(envelope.hash),
            });
            return {
              envelopeHash: envelope.hash,
              eventPda: result.eventPda.toBase58(),
              eventId: result.eventId.toString(),
              txSignature: result.txSig,
            };
          } catch (chainErr) {
            console.warn(
              "On-chain event create failed (envelope persisted):",
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

  const rsvp = useCallback(
    async (eventId: string, status: EventStatus) => {
      if (!identity) throw new Error("No tribe identity");
      setPending(true);
      setError(null);
      try {
        const secret = fromBase64(identity.appKeySecret);
        return await signAndPublishRsvp(identity.tid, eventId, status, secret);
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

  /** RSVP directly to an on-chain Event PDA. Pair with the existing
   *  envelope-based `rsvp` when you only have a string event_id. */
  const rsvpOnchain = useCallback(
    async (
      eventPda: PublicKey,
      status: EventStatus,
      opts: { isUpdate?: boolean } = {}
    ) => {
      if (!identity) throw new Error("No tribe identity");
      if (!wallet) throw new Error("Wallet not connected");
      setPending(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        return await rsvpEventOnchain(provider, {
          eventPda,
          attendeeTid: identity.tid,
          status: STATUS_ENUM[status],
          isUpdate: opts.isUpdate,
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
    rsvp,
    rsvpOnchain,
    pending,
    error,
    ready: identity !== null,
    walletReady: wallet !== undefined,
  };
}
