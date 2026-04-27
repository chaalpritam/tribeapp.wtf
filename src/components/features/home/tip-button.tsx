"use client";

import { useState } from "react";
import { Loader2, Send, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTribeTip } from "@/hooks/use-tribe-tip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QUICK_AMOUNTS_SOL = [0.01, 0.1, 1] as const;
const MAX_TIP_SOL = 100;

interface TipButtonProps {
  recipientTid: number;
  /** Base64 blake3 of the tweet — used to scope the on-chain aggregate. */
  targetHash: string;
  /** On-chain tip count + total SOL for this target, lifted from the parent. */
  tipCount: number;
  totalSol: number;
  /** Called after a successful tip so the parent can refresh aggregates. */
  onTipped: () => void;
}

export function TipButton({
  recipientTid,
  targetHash,
  tipCount,
  totalSol,
  onTipped,
}: TipButtonProps) {
  const { tip, pending: tipPending, ready: tipReady } = useTribeTip();
  const [tipped, setTipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const sendTip = async (amountSol: number) => {
    if (!tipReady || tipped || tipPending) return;
    setOpen(false);
    setTipped(true);
    try {
      await tip(recipientTid, amountSol, { targetHash });
      onTipped();
    } catch {
      setTipped(false);
    }
  };

  const onCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customAmount);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_TIP_SOL) return;
    setCustomAmount("");
    void sendTip(parsed);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={tipPending || tipped || !tipReady}
          title={`Tip SOL to tid:${recipientTid}`}
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Send a tip
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {QUICK_AMOUNTS_SOL.map((amount) => (
          <DropdownMenuItem
            key={amount}
            onSelect={() => void sendTip(amount)}
            className="font-bold tabular-nums"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{amount} SOL</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <form
          onSubmit={onCustomSubmit}
          className="flex items-center gap-1.5 px-2 py-1.5"
        >
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX_TIP_SOL}
            step="any"
            placeholder="Custom"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-20 rounded-sm bg-[#f5f5f5] px-2 py-1 text-[13px] outline-none placeholder:text-muted-foreground tabular-nums"
            onKeyDown={(e) => {
              // Don't let radix-ui hijack space / typing keys.
              e.stopPropagation();
            }}
          />
          <span className="text-[12px] font-bold text-muted-foreground">
            SOL
          </span>
          <button
            type="submit"
            disabled={
              !customAmount ||
              !Number.isFinite(parseFloat(customAmount)) ||
              parseFloat(customAmount) <= 0
            }
            className="ml-auto rounded-sm p-1 text-amber-500 hover:bg-amber-50 disabled:opacity-30 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
