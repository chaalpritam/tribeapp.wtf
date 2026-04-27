"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTribeTip } from "@/hooks/use-tribe-tip";
import { useOnchainTipsForTarget } from "@/hooks/use-onchain-tips";

const DEFAULT_TIP_AMOUNT = 1;

interface TipButtonProps {
  recipientTid: number;
  /** Base64 blake3 of the tweet — used to scope the on-chain aggregate. */
  targetHash: string;
}

export function TipButton({ recipientTid, targetHash }: TipButtonProps) {
  const { tip, pending: tipPending, ready: tipReady } = useTribeTip();
  const [tipped, setTipped] = useState(false);
  const {
    tipCount,
    totalSol,
    refresh: refreshAggregate,
  } = useOnchainTipsForTarget(targetHash);

  const onClick = async () => {
    if (tipped || !tipReady) return;
    setTipped(true);
    try {
      await tip(recipientTid, DEFAULT_TIP_AMOUNT, { targetHash });
      void refreshAggregate();
    } catch {
      setTipped(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={tipPending || tipped}
      title={`Tip ${DEFAULT_TIP_AMOUNT} SOL to tid:${recipientTid}`}
      className={cn(
        "flex items-center gap-1.5 rounded-full transition-all active:scale-90",
        tipCount > 0 ? "px-3 py-2" : "p-2",
        tipped
          ? "bg-amber-50 text-amber-500"
          : "hover:bg-[#f5f5f5] text-[#666]"
      )}
    >
      {tipPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Zap className={cn("h-5 w-5", tipped && "fill-current")} />
      )}
      {tipCount > 0 && (
        <span className="text-[13px] font-bold tabular-nums">
          {totalSol >= 0.01 ? `${totalSol.toFixed(2)}◎` : tipCount}
        </span>
      )}
    </button>
  );
}
