import { Client, IdentifierKind } from "@xmtp/browser-sdk";
import { getExistingClient } from "./client";
import { getIdentityByFid, registerIdentity } from "./identity-map";
import { resolveIdentifier } from "./name-resolver";
import { env } from "@/lib/env";

export interface ResolvedXmtpIdentity {
    address: string;
    inboxId?: string;
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
}

/**
 * Resolves a Farcaster FID to an XMTP-reachable Ethereum address.
 * It checks the local cache first, then fetches from local Neynar API.
 */
export async function resolveFidToXmtp(fid: number): Promise<ResolvedXmtpIdentity | null> {
    // 1. Check local identity map
    const cached = getIdentityByFid(fid);
    if (cached && cached.address) {
        return {
            address: cached.address,
            inboxId: cached.inboxId,
            fid: cached.fid,
            username: cached.username || `fid-${fid}`,
            displayName: cached.displayName || cached.username || `User ${fid}`,
            pfpUrl: cached.pfpUrl || "",
        };
    }

    // 2. Fetch from local Neynar API route
    try {
        const response = await fetch(`/api/neynar/user?fid=${fid}`);
        if (!response.ok) return null;

        const data = await response.json();
        const user = data.user;
        if (!user) return null;

        // We prefer custody address, then the first verified address
        const address = user.custody_address || user.verifications?.[0];
        if (!address) return null;

        const identity: ResolvedXmtpIdentity = {
            address: address.toLowerCase(),
            fid: user.fid,
            username: user.username,
            displayName: user.display_name || user.username,
            pfpUrl: user.pfp_url,
        };

        return identity;
    } catch (error) {
        console.error("Failed to resolve FID to XMTP via Neynar:", error);
        return null;
    }
}

/**
 * Resolves a generic identifier (FID, Address, Handle) to an Ethereum address.
 */
export async function resolveXmtpAddress(identifier: string | number): Promise<string | null> {
    if (typeof identifier === "number") {
        const identity = await resolveFidToXmtp(identifier);
        return identity?.address || null;
    }

    // Use NameResolver for string identifiers (Handles, ENS, Addresses)
    return await resolveIdentifier(identifier);
}



/**
 * Checks if a Farcaster user is active on the XMTP network.
 * Returns the inboxId if they are reachable.
 */
export async function checkXmtpReachability(address: string): Promise<string | null> {
    const client = getExistingClient();
    if (!client) return null;

    try {
        const isReachable = await client.canMessage([
            { identifier: address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }
        ]);

        // canMessage returns a Map<string, boolean>
        if (isReachable.get(address.toLowerCase())) {
            return "reachable";
        }
        return null;
    } catch (error) {
        console.warn("XMTP reachability check failed:", error);
        return null;
    }
}

/**
 * Higher-level helper to both resolve and verify a user can be messaged.
 */
export async function resolveAndVerifyUser(fid: number) {
    const identity = await resolveFidToXmtp(fid);
    if (!identity) return null;

    const isReachable = await checkXmtpReachability(identity.address);
    if (!isReachable) return null;

    return identity;
}
