"use client";

import { useState } from "react";
import Image from "next/image";
import { PublicKey } from "@solana/web3.js";
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import type { ExploreItem } from "@/types";
import { formatNumber } from "@/lib/utils";
import { useTribeEvent } from "@/hooks/use-tribe-event";

interface EventCardProps {
  event: ExploreItem;
}

export function EventCard({ event }: EventCardProps) {
  const { rsvp, rsvpOnchain, pending, ready, walletReady } = useTribeEvent();
  const [rsvped, setRsvped] = useState(false);

  const onchainPda = event.onchainEventPda;
  const canRsvpOnchain = !!onchainPda && walletReady;

  const handleRsvp = async () => {
    setRsvped(true);
    if (!ready) return;
    try {
      if (canRsvpOnchain && onchainPda) {
        await rsvpOnchain(new PublicKey(onchainPda), "yes");
      } else {
        await rsvp(event.id, "yes");
      }
    } catch {
      setRsvped(false);
    }
  };

  return (
    <div className="group bg-white rounded-[32px] border border-[#f0f0f0] p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03] overflow-hidden">
      {/* Type Tag */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Calendar className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-widest">Local Event</span>
        </div>
        <div className="flex items-center gap-2">
          {onchainPda && (
            <span
              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"
              title="This event is anchored on Solana"
            >
              <Zap className="h-3 w-3 fill-current" />
              On chain
            </span>
          )}
          {event.isTrending && (
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-500 uppercase tracking-wider">
              Trending
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-2xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
        {event.title}
      </h3>
      <p className="text-[14px] font-medium text-[#666] leading-relaxed mb-6 line-clamp-2">
        {event.description}
      </p>

      {/* Visual */}
      {event.imageUrl && (
        <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#f5f5f5] mb-6">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-700"
          />
        </div>
      )}

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#fcfcfc] border border-[#f0f0f0]">
          <MapPin className="h-4 w-4 text-[#999]" />
          <span className="text-[12px] font-bold truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#fcfcfc] border border-[#f0f0f0]">
          <Users className="h-4 w-4 text-[#999]" />
          <span className="text-[12px] font-bold">{formatNumber(event.participants)} going</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleRsvp}
        disabled={pending || rsvped}
        title={
          canRsvpOnchain
            ? "RSVP — settles on Solana"
            : onchainPda
            ? "RSVP — connect wallet to settle on chain"
            : "RSVP"
        }
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-bold text-[14px] transition-all active:scale-[0.98] hover:bg-black/90 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : rsvped ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Ticket className="h-4 w-4" />
        )}
        {rsvped ? "Going" : "Join Event"}
      </button>
    </div>
  );
}
