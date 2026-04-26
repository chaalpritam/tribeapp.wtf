"use client";

import { useEffect, useState } from "react";

/**
 * True after the component has mounted on the client. Use it to gate
 * reads of persisted client-only state (zustand persist, localStorage)
 * without producing a hydration mismatch on the first server render.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
