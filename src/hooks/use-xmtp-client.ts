"use client";

import { useCallback } from "react";
import { useXmtpStore } from "@/store/use-xmtp-store";
import {
  getXmtpClient,
  disconnectXmtpClient,
  isXmtpSupported,
} from "@/lib/xmtp/client";
import { clearEphemeralWallet, getEphemeralAddress } from "@/lib/xmtp/signer";

export function useXmtpClient() {
  const { status, inboxId, address, error, setStatus, setConnected, setError, reset } =
    useXmtpStore();

  const connect = useCallback(async () => {
    if (!isXmtpSupported()) {
      setStatus("unsupported");
      return;
    }

    setStatus("connecting");
    try {
      const client = await getXmtpClient();
      const addr = getEphemeralAddress() ?? "";
      setConnected(client.inboxId ?? "", addr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [setStatus, setConnected, setError]);

  const disconnect = useCallback(() => {
    disconnectXmtpClient();
    clearEphemeralWallet();
    reset();
  }, [reset]);

  return {
    status,
    inboxId,
    address,
    error,
    isConnected: status === "connected",
    isSupported: isXmtpSupported(),
    connect,
    disconnect,
  };
}
