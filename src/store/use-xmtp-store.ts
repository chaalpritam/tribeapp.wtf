"use client";

import { create } from "zustand";
import { getXmtpClient } from "@/lib/xmtp/client";
import {
  createBrowserWalletSigner,
  createEphemeralSigner,
} from "@/lib/xmtp/signer";
import { registerIdentity } from "@/lib/xmtp/identity-map";
import type { UserProfile } from "./use-auth-store";

export type XmtpStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "unsupported";

export interface ConversationPreview {
  id: string;
  name: string;
  tribeId?: string;
  peerAddress?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isGroup: boolean;
  imageUrl?: string;
}

export interface XmtpMessage {
  id: string;
  conversationId: string;
  senderAddress: string;
  senderInboxId: string;
  content: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
}

interface XmtpStore {
  status: XmtpStatus;
  conversations: ConversationPreview[];
  messages: Record<string, XmtpMessage[]>;
  inboxId: string | null;
  address: string | null;
  error: string | null;

  setStatus: (status: XmtpStatus) => void;
  setConnected: (inboxId: string, address: string) => void;
  setError: (error: string) => void;
  setConversations: (conversations: ConversationPreview[]) => void;
  addConversation: (conversation: ConversationPreview) => void;
  updateConversation: (
    id: string,
    updates: Partial<ConversationPreview>
  ) => void;
  setMessages: (conversationId: string, messages: XmtpMessage[]) => void;
  addMessage: (conversationId: string, message: XmtpMessage) => void;
  connect: (type: "farcaster" | "wallet", profile: UserProfile | null) => Promise<void>;
  reset: () => void;
}

const initialState = {
  status: "idle" as XmtpStatus,
  conversations: [] as ConversationPreview[],
  messages: {} as Record<string, XmtpMessage[]>,
  inboxId: null as string | null,
  address: null as string | null,
  error: null as string | null,
};

export const useXmtpStore = create<XmtpStore>()((set) => ({
  ...initialState,

  setStatus: (status) => set({ status, error: null }),

  setConnected: (inboxId, address) =>
    set({ status: "connected", inboxId, address, error: null }),

  setError: (error) => set({ status: "error", error }),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (exists) return state;
      return { conversations: [conversation, ...state.conversations] };
    }),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),
  connect: async (type, profile) => {
    const { isXmtpSupported } = await import("@/lib/xmtp/client");
    if (!isXmtpSupported()) {
      set({ status: "unsupported" });
      return;
    }

    set({ status: "connecting", error: null });
    try {
      const signer =
        type === "wallet"
          ? await createBrowserWalletSigner()
          : createEphemeralSigner();

      const client = await getXmtpClient(signer);
      const inboxId = client.inboxId || "";
      const address = (await signer.getIdentifier()).identifier;

      set({ status: "connected", inboxId, address, error: null });

      if (profile?.fid) {
        // If it's a wallet connection, check if it matches an FC address
        const isLinked =
          profile.custodyAddress?.toLowerCase() === address.toLowerCase() ||
          profile.verifiedAddresses?.some((a: string) => a.toLowerCase() === address.toLowerCase());

        registerIdentity({
          fid: profile.fid,
          inboxId,
          address,
          username: profile.username || "anonymous",
          displayName: profile.displayName || profile.username || "Anonymous",
          pfpUrl: profile.pfpUrl || profile.image || "/default-avatar.png",
          custodyAddress: profile.custodyAddress,
          verifiedAddresses: profile.verifiedAddresses,
        });

        if (type === "wallet" && !isLinked) {
          console.warn("Connected wallet is not linked to this Farcaster account.");
        }
      }
    } catch (err) {
      console.error("XMTP connection error:", err);
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to connect",
      });
    }
  },
  reset: () => set(initialState),
}));
