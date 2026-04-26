import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { mainnetClient } from "@/lib/viem";

/**
 * Resolves an ENS name to an Ethereum address locally using Viem.
 */
export async function resolveEnsName(name: string): Promise<string | null> {
    if (!name.endsWith(".eth")) return null;

    try {
        return await mainnetClient.getEnsAddress({
            name: normalize(name),
        });
    } catch (error) {
        console.warn(`Failed to resolve ENS name ${name}:`, error);
        return null;
    }
}

/**
 * Resolves a Farcaster handle to an Ethereum address via Neynar.
 * Since Neynar's standard API doesn't have a direct "resolve handle to 0x" 
 * that is as fast as Web3Bio, we search and verify.
 */
export async function resolveFarcasterHandle(username: string): Promise<string | null> {
    const cleanUsername = username.replace(/^@/, "").replace(/\.farcaster$/, "");

    try {
        const response = await fetch(`/api/neynar/users/search?q=${encodeURIComponent(cleanUsername)}`);
        if (!response.ok) return null;

        const data = await response.json();
        const users = data.users || [];

        // Find exact match
        const user = users.find((u: { username: string; custody_address?: string; verifications?: string[] }) => u.username.toLowerCase() === cleanUsername.toLowerCase());
        if (!user) return null;

        return user.custody_address || user.verifications?.[0] || null;
    } catch (error) {
        console.error(`Failed to resolve Farcaster handle ${username}:`, error);
        return null;
    }
}

/**
 * Local implementation of handle resolution logic.
 * Prioritizes ENS (.eth) and then Farcaster.
 */
export async function resolveIdentifier(identifier: string): Promise<string | null> {
    if (isAddress(identifier)) {
        return identifier.toLowerCase();
    }

    const name = identifier.toLowerCase();

    // 1. ENS resolution
    if (name.endsWith(".eth")) {
        return await resolveEnsName(name);
    }

    // 2. Farcaster resolution (handles or explicit .farcaster)
    return await resolveFarcasterHandle(name);
}

/**
 * Simple menton extraction logic.
 */
export function extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9._-]+(\.eth|\.farcaster)?)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Resolves mentions in a message locally.
 */
export async function resolveMentionsInMessage(text: string): Promise<Record<string, string>> {
    const mentions = extractMentions(text);
    const resolutionMap: Record<string, string> = {};

    await Promise.all(
        mentions.map(async (mention) => {
            const address = await resolveIdentifier(mention);
            if (address) {
                resolutionMap[mention] = address;
            }
        })
    );

    return resolutionMap;
}
