"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import nacl from "tweetnacl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Camera, ClipboardPaste } from "lucide-react";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PairingPayload {
  v: 1;
  kind: "tribe-pair";
  tid: string;
  appKeySeedB64: string;
  hubUrl: string;
}

function isPairingPayload(value: unknown): value is PairingPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<PairingPayload>;
  return (
    v.v === 1 &&
    v.kind === "tribe-pair" &&
    typeof v.tid === "string" &&
    typeof v.appKeySeedB64 === "string" &&
    typeof v.hubUrl === "string"
  );
}

/**
 * tribe-ios encodes the 32-byte ed25519 seed in the QR (matches the
 * way iOS stores app keys in its Keychain). tribeapp.wtf's Zustand
 * store expects the full 64-byte nacl `secretKey` (seed || pubkey)
 * that tweetnacl.sign.keyPair.fromSeed produces. Re-expand here so
 * the adopted account behaves identically to one registered locally.
 */
function expandSeedToSecretKey(seedB64: string): {
  secretKeyB64: string;
  publicKeyB64: string;
} {
  const bytes = Uint8Array.from(atob(seedB64), (c) => c.charCodeAt(0));
  if (bytes.length === 64) {
    let pubBinary = "";
    for (let i = 32; i < 64; i++) {
      pubBinary += String.fromCharCode(bytes[i]);
    }
    return { secretKeyB64: seedB64, publicKeyB64: btoa(pubBinary) };
  }
  if (bytes.length !== 32) {
    throw new Error(
      `App-key seed must be 32 or 64 bytes; got ${bytes.length}.`,
    );
  }
  const keypair = nacl.sign.keyPair.fromSeed(bytes);
  let secretBinary = "";
  for (let i = 0; i < keypair.secretKey.length; i++) {
    secretBinary += String.fromCharCode(keypair.secretKey[i]);
  }
  let pubBinary = "";
  for (let i = 0; i < keypair.publicKey.length; i++) {
    pubBinary += String.fromCharCode(keypair.publicKey[i]);
  }
  return {
    secretKeyB64: btoa(secretBinary),
    publicKeyB64: btoa(pubBinary),
  };
}

/**
 * Scan a QR (or paste the JSON) emitted by tribe-ios's
 * PairToDesktopView and adopt the identity into this profile.
 */
export function SignInFromMobilePanel() {
  const { disconnect } = useWallet();
  const setIdentity = useTribeIdentityStore((s) => s.setIdentity);

  const [mode, setMode] = useState<"closed" | "camera" | "paste">("closed");
  const [pastedText, setPastedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const stopCamera = useCallback(() => {
    cancelledRef.current = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const adopt = useCallback(
    async (payload: PairingPayload) => {
      try {
        const { secretKeyB64, publicKeyB64 } = expandSeedToSecretKey(
          payload.appKeySeedB64,
        );
        try {
          await disconnect();
        } catch {
          // best-effort
        }
        const tidNumber = Number(payload.tid);
        if (!Number.isFinite(tidNumber)) {
          throw new Error(`Invalid TID in QR: ${payload.tid}`);
        }
        setIdentity({
          tid: tidNumber,
          custodyWallet: "",
          username: null,
          appKeySecret: secretKeyB64,
          appKeyPubkey: publicKeyB64,
        });
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to adopt identity");
      }
    },
    [disconnect, setIdentity],
  );

  const handleDecoded = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw);
        if (!isPairingPayload(parsed)) {
          setError("QR isn't a Tribe pairing code.");
          return;
        }
        stopCamera();
        setMode("closed");
        void adopt(parsed);
      } catch {
        setError("QR contents weren't valid JSON.");
      }
    },
    [adopt, stopCamera],
  );

  useEffect(() => {
    if (mode !== "camera") return;
    cancelledRef.current = false;

    let teardown = () => {};

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const tick = () => {
          if (cancelledRef.current) return;
          const canvas = canvasRef.current;
          if (canvas && video.readyState >= video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", {
              willReadFrequently: true,
            });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
              );
              if (code?.data) {
                handleDecoded(code.data);
                return;
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        teardown = () => stopCamera();
      } catch (e) {
        setError(
          e instanceof Error
            ? `Camera unavailable: ${e.message}`
            : "Camera unavailable",
        );
        setMode("paste");
      }
    })();

    return () => {
      teardown();
    };
  }, [mode, handleDecoded, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handlePasteAdopt = useCallback(() => {
    setError(null);
    handleDecoded(pastedText.trim());
  }, [handleDecoded, pastedText]);

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <h2 className="text-[14px] font-bold tracking-tight">
        Sign in from mobile
      </h2>
      <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
        Scan a QR from tribe-ios → Settings → Sign in another device.
      </p>

      {mode === "closed" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setSuccess(false);
              setMode("camera");
            }}
          >
            <Camera className="h-4 w-4" />
            Scan QR
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setSuccess(false);
              setMode("paste");
            }}
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste JSON
          </Button>
        </div>
      )}

      {mode === "camera" && (
        <div className="mt-4 space-y-2">
          <div className="overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                stopCamera();
                setMode("paste");
              }}
            >
              Paste JSON instead
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                stopCamera();
                setMode("closed");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "paste" && (
        <div className="mt-4 space-y-2">
          <Textarea
            className="font-mono text-xs"
            rows={5}
            placeholder='{"v":1,"kind":"tribe-pair","tid":"…","appKeySeedB64":"…","hubUrl":"…"}'
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setMode("closed");
                setPastedText("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!pastedText.trim()}
              onClick={handlePasteAdopt}
            >
              Adopt identity
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
          Identity adopted — reloading…
        </p>
      )}
    </div>
  );
}
