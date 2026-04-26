"use client";

import { useEffect } from "react";
import { useXmtpStore } from "@/store/use-xmtp-store";
import { isXmtpSupported } from "@/lib/xmtp/client";

export function XmtpProvider({ children }: { children: React.ReactNode }) {
  const { setStatus } = useXmtpStore();

  useEffect(() => {
    if (!isXmtpSupported()) {
      setStatus("unsupported");
    }
  }, [setStatus]);

  return <>{children}</>;
}
