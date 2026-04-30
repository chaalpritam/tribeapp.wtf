"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Zap } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import type { Poll } from "@/types";
import { cn } from "@/lib/utils";
import { useTribeStore } from "@/store/use-tribe-store";
import { useTribePoll } from "@/hooks/use-tribe-poll";

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  const { votePoll } = useTribeStore();
  const { vote: voteOnHub, voteOnchain, ready: pollReady, walletReady } = useTribePoll();
  const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
  const hasVoted = !!poll.userVote;
  const onchainPda = poll.onchainPollPda;
  const canVoteOnchain = !!onchainPda && walletReady;

  return (
    <div className="group bg-white rounded-[32px] border border-[#f0f0f0] p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03]">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-indigo-500 font-bold">
          <BarChart3 className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-widest">Community Poll</span>
        </div>
        <div className="flex items-center gap-2">
          {onchainPda && (
            <span
              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"
              title="Vote tally settles on Solana"
            >
              <Zap className="h-3 w-3 fill-current" />
              On chain
            </span>
          )}
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {poll.duration} Left
          </div>
        </div>
      </div>

      {/* Question */}
      <h3 className="text-xl font-bold tracking-tight mb-6 leading-snug">
        {poll.question}
      </h3>

      {/* Visual */}
      {poll.imageUrl && (
        <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#f5f5f5] mb-6">
          <Image
            src={poll.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      {/* Options */}
      <div className="space-y-2.5">
        {poll.options.map((opt, index) => {
          const votes = poll.votes[opt.id] || 0;
          const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isSelected = poll.userVote === opt.id;

          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              disabled={hasVoted}
              onClick={async () => {
                votePoll(poll.id, opt.id);
                if (!pollReady) return;
                try {
                  if (canVoteOnchain && onchainPda) {
                    await voteOnchain(new PublicKey(onchainPda), index);
                  } else {
                    await voteOnHub(poll.id, index);
                  }
                } catch {
                  /* keep optimistic UI; chain replay handled separately */
                }
              }}
              className={cn(
                "relative w-full overflow-hidden rounded-2xl px-5 py-4 text-left transition-all border",
                isSelected
                  ? "border-black bg-black text-white"
                  : "bg-[#fcfcfc] border-[#f0f0f0] hover:border-black/10"
              )}
            >
              {hasVoted && !isSelected && (
                <div
                  className="absolute inset-y-0 left-0 bg-black/[0.03] transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between font-bold text-[14px]">
                <div className="flex items-center gap-2">
                  <span>{opt.text}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
                {hasVoted && (
                  <span className={cn(isSelected ? "text-white" : "text-muted-foreground")}>
                    {Math.round(pct)}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#f0f0f0] pt-4">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-muted" />
          ))}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#999]">
          {totalVotes} total votes
        </p>
      </div>
    </div>
  );
}
