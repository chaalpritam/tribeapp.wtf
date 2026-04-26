"use client";

import { useEffect, useRef } from "react";
import { subscribeRealtime, type HubEvent } from "@/lib/tribe";

/**
 * Listen for a specific hub event over the shared realtime socket.
 * Callers pass an event name and a callback; the hook auto-subscribes
 * on mount and cleans up on unmount.
 */
export function useTribeRealtime(
  event: string,
  onMessage: (data: unknown) => void
): void {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    const unsubscribe = subscribeRealtime((e: HubEvent) => {
      if (e.event === event) cbRef.current(e.data);
    });
    return unsubscribe;
  }, [event]);
}
