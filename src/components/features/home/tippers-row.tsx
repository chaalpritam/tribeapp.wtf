"use client";

import { Zap } from "lucide-react";
import type { Tipper } from "@/hooks/use-onchain-tips";

const MAX_VISIBLE_TIPPERS = 2;

function tipperLabel(t: Tipper): string {
  return t.username ? `@${t.username}` : `@tid${t.senderTid}`;
}

function formatSol(sol: number): string {
  if (sol >= 0.01) return `${sol.toFixed(2)}◎`;
  if (sol > 0) return "<0.01◎";
  return "0◎";
}

interface TippersRowProps {
  tipCount: number;
  tippers: Tipper[];
}

/**
 * Inline social signal under a tweet: "Tipped by @alice (0.1◎),
 * @bob (0.05◎) +3 more". Reads from the same on-chain aggregate
 * the tip-button uses, lifted up so the parent fetches once per
 * tweet instead of twice.
 */
export function TippersRow({ tipCount, tippers }: TippersRowProps) {
  if (tipCount === 0) return null;

  const visible = tippers.slice(0, MAX_VISIBLE_TIPPERS);
  const overflow = tipCount - visible.length;

  return (
    <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold text-amber-700/80">
      <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
      <span className="truncate">
        Tipped by{" "}
        {visible.map((t, i) => (
          <span key={t.pda}>
            {tipperLabel(t)}
            <span className="text-amber-700/50 tabular-nums">
              {" "}
              ({formatSol(t.amountSol)})
            </span>
            {i < visible.length - 1 && ", "}
          </span>
        ))}
        {overflow > 0 && (
          <span className="text-amber-700/60">
            {" "}
            +{overflow} more
          </span>
        )}
      </span>
    </div>
  );
}
