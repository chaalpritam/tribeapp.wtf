"use client";

import { useEffect, useCallback, useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";

interface SIWNSuccessPayload {
  signer_uuid: string;
  fid: number;
  user?: {
    username?: string;
    display_name?: string;
    pfp_url?: string;
    custody_address?: string;
    verifications?: string[];
    profile?: {
      bio?: {
        text?: string;
      };
    };
  };
}

interface NeynarSignInProps {
  onSuccess?: () => void;
  className?: string;
}

export function NeynarSignIn({ onSuccess, className }: NeynarSignInProps) {
  const setFarcasterAuth = useAuthStore((s) => s.setFarcasterAuth);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleSuccess = useCallback(
    (payload: SIWNSuccessPayload) => {
      console.log("Neynar SIWN Success Payload:", payload);
      const { signer_uuid, fid, user } = payload;
      setFarcasterAuth({
        fid,
        signerUuid: signer_uuid,
        username: user?.username ?? `fid-${fid}`,
        displayName: user?.display_name ?? user?.username ?? `User ${fid}`,
        pfpUrl: user?.pfp_url,
        bio: user?.profile?.bio?.text,
        custodyAddress: user?.custody_address,
        verifiedAddresses: user?.verifications,
      });
      onSuccess?.();
    },
    [setFarcasterAuth, onSuccess]
  );

  const handleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    if (!clientId) {
      console.error("Missing NEXT_PUBLIC_NEYNAR_CLIENT_ID");
      return;
    }

    const authUrl = new URL("https://app.neynar.com/login");
    authUrl.searchParams.append("client_id", clientId);

    const isDesktop = window.matchMedia("(min-width: 800px)").matches;
    const width = 600, height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const windowFeatures = `width=${width},height=${height},top=${top},left=${left}`;
    const windowOptions = isDesktop ? windowFeatures : "fullscreen=yes";

    const authWindow = window.open(authUrl.toString(), "_blank", windowOptions);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin === "https://app.neynar.com" && event.data.is_authenticated) {
        handleSuccess(event.data);
        if (authWindow) authWindow.close();
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage, false);
  };

  if (!hasHydrated) {
    return (
      <div className={className}>
        <div className="h-12 w-full min-w-[205px] animate-pulse rounded-xl bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }

  const farcasterLogo = (
    <svg width="30px" height="30px" viewBox="0 0 225 225" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="225" height="225" rx="50" fill="#855DCD" />
      <path d="M58 35H167V190H151V119H150.843C149.075 99.3773 132.583 84 112.5 84C92.4169 84 75.9253 99.3773 74.157 119H74V190H58V35Z" fill="white" />
      <path d="M29 57L35.5 79H41V168C38.2386 168 36 170.239 36 173V179H35C32.2386 179 30 181.239 30 184V190H86V184C86 181.239 83.7614 179 81 179H80V173C80 170.239 77.7614 168 75 168H69V57H29Z" fill="white" />
      <path d="M152 168C149.239 168 147 170.239 147 173V179H146C143.239 179 141 181.239 141 184V190H197V184C197 181.239 194.761 179 192 179H191V173C191 170.239 188.761 168 186 168V79H191.5L198 57H158V168H152Z" fill="white" />
    </svg>
  );

  return (
    <div className={className}>
      <button
        onClick={handleSignIn}
        className="inline-flex h-[48px] min-w-[205px] items-center justify-center gap-2 rounded-xl bg-white px-[15px] py-[8px] text-[16px] font-medium text-black shadow-sm ring-1 ring-black/5 hover:bg-gray-50 transition-colors"
      >
        <span>{farcasterLogo}</span>
        <span>Sign in with Farcaster</span>
      </button>
    </div>
  );
}
