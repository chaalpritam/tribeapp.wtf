"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { useTribeDmKey } from "@/hooks/use-tribe-dm-key";
import { dmConversationId, sendDm } from "@/lib/tribe";

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export default function NewConversationPage() {
  const router = useRouter();
  const identity = useTribeIdentityStore((s) => s.identity);
  useTribeDmKey();
  const [peerTidInput, setPeerTidInput] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!identity) {
      setError("Sign in first");
      return;
    }
    const peerTid = parseInt(peerTidInput.trim(), 10);
    if (!peerTid || Number.isNaN(peerTid) || peerTid === identity.tid) {
      setError("Enter a valid peer TID");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const convId = dmConversationId(identity.tid, peerTid);

      if (firstMessage.trim()) {
        const secret = fromBase64(identity.appKeySecret);
        await sendDm(identity.tid, peerTid, firstMessage.trim(), secret);
      }

      router.push(`/chat/${encodeURIComponent(convId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">New chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Peer TID
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 42"
              value={peerTidInput}
              onChange={(e) => setPeerTidInput(e.target.value)}
              className="w-full rounded-2xl border border-[#f0f0f0] bg-white py-4 px-4 text-base font-bold outline-none focus:ring-4 focus:ring-primary/5"
            />
            <p className="text-[12px] font-medium text-muted-foreground">
              The peer must have signed in once so the hub knows their DM key.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              First message (optional)
            </label>
            <textarea
              placeholder="Say hello..."
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-[#f0f0f0] bg-white py-4 px-4 text-base outline-none focus:ring-4 focus:ring-primary/5 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={start}
            disabled={busy || !peerTidInput.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Start chat
          </button>
        </div>
      </div>
    </div>
  );
}
