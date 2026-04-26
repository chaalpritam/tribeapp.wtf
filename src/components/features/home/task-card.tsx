"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Clock,
  AlertTriangle,
  Coins,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import type { Task } from "@/types";
import { useTribeTask } from "@/hooks/use-tribe-task";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { claim, claimOnchain, pending, ready, walletReady } = useTribeTask();
  const [claimed, setClaimed] = useState(false);

  const onchainPda = task.onchainTaskPda;
  const canClaimOnchain = !!onchainPda && walletReady;

  // Pretty-print the escrowed reward when present, e.g. "0.05 SOL".
  // Falls back to the off-chain reward string ('5 USD') when there's
  // no on-chain escrow.
  const rewardLabel = onchainPda && task.onchainRewardLamports
    ? `${(Number(task.onchainRewardLamports) / LAMPORTS_PER_SOL).toFixed(4)} SOL`
    : task.reward || "Gratitude";

  const handleClaim = async () => {
    setClaimed(true);
    if (!ready) return;
    try {
      if (canClaimOnchain && onchainPda) {
        await claimOnchain(new PublicKey(onchainPda));
      } else {
        await claim(task.id);
      }
    } catch {
      setClaimed(false);
    }
  };

  return (
    <div className="group bg-white rounded-[32px] border border-[#f0f0f0] p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03]">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-orange-500 font-bold">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-widest">Neighborhood Task</span>
        </div>
        <div className="flex items-center gap-2">
          {onchainPda && (
            <span
              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"
              title="Reward escrowed on Solana — released to claimer on completion"
            >
              <Zap className="h-3 w-3 fill-current" />
              On chain
            </span>
          )}
          {task.isUrgent && (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
              Urgent
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold tracking-tight mb-3">
        {task.title}
      </h3>
      <p className="text-[14px] font-medium text-[#666] leading-relaxed mb-6 line-clamp-2">
        {task.description}
      </p>

      {/* Reward / Meta */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-600 border border-green-100">
          <Coins className="h-4 w-4" />
          <span className="text-[12px] font-bold">{rewardLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-widest">
          <Clock className="h-3.5 w-3.5" />
          {task.timeAgo}
        </div>
      </div>

      {/* Visual */}
      {task.imageUrl && (
        <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#f5f5f5] mb-6">
          <Image
            src={task.imageUrl}
            alt={task.title}
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-700"
          />
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden relative border border-[#f0f0f0]">
            <Image src={task.user.avatarUrl} alt="" fill className="object-cover" />
          </div>
          <span className="text-[13px] font-bold tracking-tight">@{task.user.username}</span>
        </div>
        <button
          onClick={handleClaim}
          disabled={pending || claimed}
          title={
            canClaimOnchain
              ? "Claim — locks the on-chain task to you"
              : onchainPda
              ? "Connect wallet to claim the on-chain task"
              : "Help out"
          }
          className="px-5 py-2.5 rounded-full bg-black text-white font-bold text-[13px] hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10 disabled:opacity-60 flex items-center gap-1.5"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : claimed ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : null}
          {claimed ? "Claimed" : "Help Out"}
        </button>
      </div>
    </div>
  );
}
