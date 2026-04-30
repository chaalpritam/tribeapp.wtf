"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  Heart,
  Target,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { Progress } from "@/components/ui/progress";
import type { Crowdfund } from "@/types";
import { formatNumber } from "@/lib/utils";
import { useTribeCrowdfund } from "@/hooks/use-tribe-crowdfund";

interface CrowdfundCardProps {
  crowdfund: Crowdfund;
}

/** Off-chain (envelope) default — USD signal. */
const DEFAULT_PLEDGE_AMOUNT = 5;
/** On-chain default — real SOL transfer. Smaller because it moves
 *  real value via the wallet adapter. */
const DEFAULT_PLEDGE_AMOUNT_SOL = 0.01;

export function CrowdfundCard({ crowdfund }: CrowdfundCardProps) {
  const progress = Math.min((crowdfund.raised / crowdfund.goal) * 100, 100);
  const { pledge, pledgeOnchain, pending, ready, walletReady } =
    useTribeCrowdfund();
  const [pledged, setPledged] = useState(false);

  const onchainPda = crowdfund.onchainCrowdfundPda;
  const canPledgeOnchain = !!onchainPda && walletReady;
  const pledgeSol =
    crowdfund.onchainPledgeAmountSol ?? DEFAULT_PLEDGE_AMOUNT_SOL;

  const handlePledge = async () => {
    setPledged(true);
    if (!ready) return;
    try {
      if (canPledgeOnchain && onchainPda) {
        await pledgeOnchain(new PublicKey(onchainPda), pledgeSol);
      } else {
        await pledge(crowdfund.id, DEFAULT_PLEDGE_AMOUNT);
      }
    } catch {
      setPledged(false);
    }
  };

  return (
    <div className="group bg-white rounded-[32px] border border-[#f0f0f0] p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03]">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-rose-500 font-bold">
          <Heart className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-widest">Local Cause</span>
        </div>
        <div className="flex items-center gap-2">
          {onchainPda && (
            <span
              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"
              title="Pledges escrow real SOL on Solana"
            >
              <Zap className="h-3 w-3 fill-current" />
              On chain
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-500 uppercase tracking-widest">
            {Math.round(progress)}% Funded
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold tracking-tight mb-3">
        {crowdfund.title}
      </h3>
      <p className="text-[14px] font-medium text-[#666] leading-relaxed mb-6 line-clamp-2">
        {crowdfund.description}
      </p>

      {/* Progress Section */}
      <div className="mb-6 p-5 rounded-[24px] bg-[#fcfcfc] border border-[#f0f0f0]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-black">
              {formatNumber(crowdfund.raised)}            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#999] text-xs font-bold">
            <Target className="h-4 w-4" />
            GOAL: {formatNumber(crowdfund.goal)}          </div>
        </div>
        <Progress value={progress} className="h-2.5 bg-black/5" />
      </div>

      {/* Visual */}
      {crowdfund.imageUrl && (
        <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#f5f5f5] mb-6">
          <Image
            src={crowdfund.imageUrl}
            alt={crowdfund.title}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105 duration-700"
          />
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-6">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#999] uppercase tracking-widest">
          <Users className="h-4 w-4" />
          {crowdfund.contributors} Backers
        </div>
        <button
          onClick={handlePledge}
          disabled={pending || pledged}
          title={
            canPledgeOnchain
              ? `Pledge ${pledgeSol} SOL — escrowed on Solana`
              : onchainPda
              ? "Connect wallet to escrow real SOL"
              : "Fund cause"
          }
          className="px-6 py-3 rounded-full bg-rose-500 text-white font-bold text-[13px] hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-rose-500/20 disabled:opacity-60 flex items-center gap-1.5"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : pledged ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : null}
          {pledged
            ? "Pledged"
            : canPledgeOnchain
            ? `Pledge ${pledgeSol} SOL`
            : "Fund Cause"}
        </button>
      </div>
    </div>
  );
}
