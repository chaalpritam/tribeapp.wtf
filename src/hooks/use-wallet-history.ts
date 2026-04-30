"use client";

import { useCallback, useEffect, useState } from "react";
import { hubFetch } from "@/lib/tribe";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface RawOnchainTip {
  pda: string;
  sender: string;
  recipient: string;
  sender_tid: string | number;
  recipient_tid: string | number;
  amount: string | number;
  tip_id: string | number;
  target_hash: string | null;
  has_target: boolean;
  tx_signature: string;
  created_at: string;
}

export interface WalletTip {
  pda: string;
  senderTid: string;
  recipientTid: string;
  amountLamports: bigint;
  amountSol: number;
  targetHash: string | null;
  txSignature: string;
  createdAt: string;
}

export interface WalletHistory {
  sent: WalletTip[];
  received: WalletTip[];
  totalSentLamports: bigint;
  totalReceivedLamports: bigint;
  netLamports: bigint;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function parseTip(row: RawOnchainTip): WalletTip {
  const amount = BigInt(row.amount?.toString() ?? "0");
  return {
    pda: row.pda,
    senderTid: String(row.sender_tid),
    recipientTid: String(row.recipient_tid),
    amountLamports: amount,
    amountSol: Number(amount) / LAMPORTS_PER_SOL,
    targetHash: row.target_hash,
    txSignature: row.tx_signature,
    createdAt: row.created_at,
  };
}

/**
 * Pulls the user's on-chain tip history from the hub — both sides of
 * the ledger, plus running totals so the wallet page can render
 * sent / received / net at a glance. The hub's tip rows are indexed
 * by sender_tid and recipient_tid, so two parallel reads cover
 * everything.
 */
export function useWalletHistory(tid: number | null): WalletHistory {
  const [sent, setSent] = useState<WalletTip[]>([]);
  const [received, setReceived] = useState<WalletTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (tid == null) {
      setSent([]);
      setReceived([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sentRes, recvRes] = await Promise.all([
        hubFetch(`/v1/tips/onchain/sent/${tid}?limit=50`),
        hubFetch(`/v1/tips/onchain/received/${tid}?limit=50`),
      ]);
      const sentJson = sentRes.ok
        ? ((await sentRes.json()) as { tips?: RawOnchainTip[] })
        : { tips: [] };
      const recvJson = recvRes.ok
        ? ((await recvRes.json()) as { tips?: RawOnchainTip[] })
        : { tips: [] };
      setSent((sentJson.tips ?? []).map(parseTip));
      setReceived((recvJson.tips ?? []).map(parseTip));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalSentLamports = sent.reduce(
    (acc, t) => acc + t.amountLamports,
    BigInt(0)
  );
  const totalReceivedLamports = received.reduce(
    (acc, t) => acc + t.amountLamports,
    BigInt(0)
  );

  return {
    sent,
    received,
    totalSentLamports,
    totalReceivedLamports,
    netLamports: totalReceivedLamports - totalSentLamports,
    loading,
    error,
    refresh,
  };
}
