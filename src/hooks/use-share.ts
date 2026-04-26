"use client";

import { useState, useCallback } from "react";

export function useShare() {
  const [showToast, setShowToast] = useState(false);

  const share = useCallback(async (title: string, text: string, url: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        // User cancelled or share failed — fall through to clipboard
        if ((e as DOMException).name === "AbortError") return;
      }
    }

    // Clipboard fallback
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Last resort: legacy copy
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  return { share, showToast };
}
