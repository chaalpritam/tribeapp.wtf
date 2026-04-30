"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { formatDistanceToNow } from "date-fns";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/hooks/use-auth";
import { useWalletHistory } from "@/hooks/use-wallet-history";
import { useTribeOnchainKarma } from "@/hooks/use-tribe-onchain-karma";

function formatSol(lamports: bigint, fractionDigits = 4): string {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(fractionDigits);
}

function shortAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function WalletPage() {
  const { isAuthenticated, profile, tid, logout } = useAuth();
  const { connection } = useConnection();
  const { publicKey, disconnect } = useWallet();
  const history = useWalletHistory(tid);
  const { karma: onchainKarma } = useTribeOnchainKarma(tid ?? null);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }
    let cancelled = false;
    setBalanceLoading(true);
    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (cancelled) return;
        setSolBalance(lamports / LAMPORTS_PER_SOL);
      })
      .catch(() => {
        if (cancelled) return;
        setSolBalance(null);
      })
      .finally(() => {
        if (cancelled) return;
        setBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#fcfcfc] min-h-screen">
        <AppHeader title="Wallet" />
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <WalletIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-bold">Sign in required</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground max-w-xs">
            Connect your Solana wallet to claim a Tribe identity, then track
            balance and on-chain tip activity here.
          </p>
          <a
            href="/onboarding/connect"
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            Sign in with Tribe
          </a>
        </div>
      </div>
    );
  }

  const txn = [
    ...history.sent.map((t) => ({ kind: "sent" as const, tip: t })),
    ...history.received.map((t) => ({ kind: "received" as const, tip: t })),
  ].sort(
    (a, b) =>
      new Date(b.tip.createdAt).getTime() - new Date(a.tip.createdAt).getTime()
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <AppHeader title="Wallet" />

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Balance */}
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-indigo-500 to-violet-500 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                SOL Balance
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-black tracking-tight leading-none">
                {balanceLoading
                  ? "—"
                  : solBalance != null
                    ? `${solBalance.toFixed(4)}`
                    : "—"}{" "}
                <span className="text-base font-bold">SOL</span>
              </p>
              {publicKey && (
                <p className="mt-3 text-[11px] font-mono font-bold text-white/70">
                  {shortAddress(publicKey.toBase58())}
                </p>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <WalletIcon className="h-6 w-6" />
            </div>
          </div>
          {profile && (
            <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-white/70">
              {profile.username
                ? `@${profile.username}`
                : `tid #${profile.tid}`}
            </p>
          )}
        </div>

        {/* Tip ledger */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] sm:rounded-[28px] bg-emerald-50 border border-emerald-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Received
              </span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-900">
              {formatSol(history.totalReceivedLamports)} SOL
            </p>
            <p className="text-[10px] font-bold text-emerald-600/70 mt-1">
              {history.received.length} tip
              {history.received.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-[24px] sm:rounded-[28px] bg-rose-50 border border-rose-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Sent
              </span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-rose-900">
              {formatSol(history.totalSentLamports)} SOL
            </p>
            <p className="text-[10px] font-bold text-rose-600/70 mt-1">
              {history.sent.length} tip
              {history.sent.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* On-chain karma echo */}
        {onchainKarma && (
          <div className="rounded-[24px] sm:rounded-[28px] bg-amber-50 border border-amber-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-amber-600">
              <Zap className="h-4 w-4 fill-current" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                On-chain karma
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">
                  Tasks completed
                </p>
                <p className="text-lg font-black text-amber-900 mt-1">
                  {onchainKarma.tasksCompletedCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">
                  Task earnings
                </p>
                <p className="text-lg font-black text-amber-900 mt-1">
                  {(
                    Number(onchainKarma.tasksCompletedRewardLamports) /
                    LAMPORTS_PER_SOL
                  ).toFixed(4)}{" "}
                  SOL
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#999]">
              Activity
            </h2>
            {history.loading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          {txn.length === 0 && !history.loading && (
            <div className="rounded-[24px] bg-white border border-[#f0f0f0] p-6 text-center">
              <p className="text-sm font-bold text-muted-foreground">
                No on-chain tips yet.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {txn.map(({ kind, tip }) => {
              const incoming = kind === "received";
              const counterpartyTid = incoming ? tip.senderTid : tip.recipientTid;
              return (
                <div
                  key={`${kind}-${tip.pda}`}
                  className="flex items-center gap-3 rounded-[20px] bg-white border border-[#f0f0f0] p-4"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      incoming
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {incoming ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold tracking-tight truncate">
                      {incoming ? "From" : "To"} tid:{counterpartyTid}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      {formatDistanceToNow(new Date(tip.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-[15px] font-black tracking-tight ${
                        incoming ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {incoming ? "+" : "−"}
                      {tip.amountSol.toFixed(4)}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      SOL
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disconnect */}
        <div className="pt-4">
          <button
            onClick={async () => {
              try {
                await disconnect();
              } catch {
                // wallet may already be disconnected; logout still proceeds
              }
              await logout();
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-[#f0f0f0] py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            Disconnect wallet & sign out
          </button>
        </div>
      </div>
    </div>
  );
}
