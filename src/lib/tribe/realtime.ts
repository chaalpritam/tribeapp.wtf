import { getHubBaseUrl } from "./failover";

export interface HubEvent {
  event: string;
  data: unknown;
}

type Listener = (e: HubEvent) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 1_000;
const MAX_BACKOFF_MS = 30_000;

function wsUrl(): string {
  const base = getHubBaseUrl();
  return base.replace(/^http/, "ws") + "/v1/ws";
}

function connect(): void {
  if (socket && socket.readyState !== WebSocket.CLOSED) return;
  try {
    socket = new WebSocket(wsUrl());
  } catch {
    scheduleReconnect();
    return;
  }
  socket.addEventListener("open", () => {
    backoffMs = 1_000;
  });
  socket.addEventListener("message", (msg) => {
    let parsed: HubEvent | null = null;
    try {
      parsed = JSON.parse(typeof msg.data === "string" ? msg.data : "");
    } catch {
      return;
    }
    if (!parsed || typeof parsed.event !== "string") return;
    for (const listener of listeners) {
      try {
        listener(parsed);
      } catch {
        // listener errors shouldn't tear down the socket
      }
    }
  });
  socket.addEventListener("close", () => {
    socket = null;
    if (listeners.size > 0) scheduleReconnect();
  });
  socket.addEventListener("error", () => {
    socket?.close();
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, backoffMs);
  backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
}

/**
 * Subscribe to hub realtime events. Multiple callers share one
 * WebSocket. Returns an unsubscribe function; the socket closes when
 * the last listener unsubscribes.
 */
export function subscribeRealtime(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};
  listeners.add(listener);
  connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      socket?.close();
      socket = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }
  };
}
