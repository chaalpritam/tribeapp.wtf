"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Eye, EyeOff } from "lucide-react";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { HUB_URL } from "@/lib/tribe/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PairingPayload {
  v: 1;
  kind: "tribe-pair";
  tid: string;
  appKeySeedB64: string;
  hubUrl: string;
}

const LAN_PLACEHOLDER = "YOUR-LAN-IP";

/**
 * tribeapp.wtf's Zustand store holds tweetnacl's 64-byte secretKey
 * (seed || pubkey). tribe-ios's AppKey.restore wants the 32-byte
 * ed25519 seed, so strip the trailing public key before encoding.
 */
function seedFromStoredSecret(b64: string): string | null {
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const seed =
      bytes.length === 64
        ? bytes.subarray(0, 32)
        : bytes.length === 32
          ? bytes
          : null;
    if (!seed) return null;
    let binary = "";
    for (let i = 0; i < seed.length; i++) {
      binary += String.fromCharCode(seed[i]);
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

/**
 * localhost works for desktop browsing but not for a phone on the
 * same Wi-Fi — surface a placeholder so a stale `localhost` URL
 * never makes it into the QR.
 */
function defaultMobileHubUrl(): string {
  try {
    const u = new URL(HUB_URL);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      return `${u.protocol}//${LAN_PLACEHOLDER}:${u.port || "4000"}`;
    }
    return HUB_URL;
  } catch {
    return HUB_URL;
  }
}

/**
 * Show a QR encoding this device's identity so tribe-ios can scan to
 * sign in as the same TID. Same envelope tribe-ios's
 * PairFromDesktopView consumes (v=1, kind="tribe-pair", tid,
 * appKeySeedB64, hubUrl), so the formats stay symmetric across the
 * three clients.
 */
export function MobilePairingPanel() {
  const identity = useTribeIdentityStore((s) => s.identity);

  const [mobileHubUrl, setMobileHubUrl] = useState(defaultMobileHubUrl());
  const [revealed, setRevealed] = useState(false);
  const [qrCache, setQrCache] = useState<{
    key: string;
    dataUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload: PairingPayload | null = useMemo(() => {
    if (!identity?.tid || !identity?.appKeySecret) return null;
    if (!mobileHubUrl || mobileHubUrl.includes(LAN_PLACEHOLDER)) return null;
    const seedB64 = seedFromStoredSecret(identity.appKeySecret);
    if (!seedB64) return null;
    return {
      v: 1,
      kind: "tribe-pair",
      tid: String(identity.tid),
      appKeySeedB64: seedB64,
      hubUrl: mobileHubUrl.trim(),
    };
  }, [identity, mobileHubUrl]);

  const payloadJSON = payload ? JSON.stringify(payload) : null;

  useEffect(() => {
    if (!revealed || !payloadJSON) return;
    let cancelled = false;
    QRCode.toDataURL(payloadJSON, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
    })
      .then((url) => {
        if (cancelled) return;
        setQrCache({ key: payloadJSON, dataUrl: url });
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to render QR");
      });
    return () => {
      cancelled = true;
    };
  }, [revealed, payloadJSON]);

  if (!identity) return null;

  const liveQrDataUrl =
    revealed && payloadJSON && qrCache?.key === payloadJSON
      ? qrCache.dataUrl
      : null;

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <h2 className="text-[14px] font-bold tracking-tight">
        Sign in on mobile
      </h2>
      <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
        Open tribe-ios → Sign in → Scan QR from desktop, then point the
        camera at the QR below.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="mobile-hub-url"
            className="block text-xs font-medium"
          >
            Hub URL the phone should use
          </label>
          <Input
            id="mobile-hub-url"
            value={mobileHubUrl}
            onChange={(e) => setMobileHubUrl(e.target.value)}
            placeholder="http://192.168.1.x:4000"
            className="mt-1 font-mono text-xs"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Use a LAN IP, not <code>localhost</code> — the phone can&apos;t
            reach this machine through <code>localhost</code>.
          </p>
        </div>

        {!revealed ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={!payload}
            onClick={() => setRevealed(true)}
          >
            <Eye className="h-4 w-4" />
            Reveal QR
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-center rounded-xl border bg-white p-3">
              {liveQrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={liveQrDataUrl}
                  alt="Pairing QR"
                  className="h-72 w-72"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Rendering…
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Anyone who scans this can sign as you. Don&apos;t share it.
            </p>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setRevealed(false)}
            >
              <EyeOff className="h-4 w-4" />
              Hide
            </Button>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
