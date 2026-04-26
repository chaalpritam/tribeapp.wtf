"use client";

import { useCallback, useEffect, useRef } from "react";
import { Dm, Group, IdentifierKind } from "@xmtp/browser-sdk";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useXmtpStore } from "@/store/use-xmtp-store";
import type { ConversationPreview } from "@/store/use-xmtp-store";
import { getExistingClient } from "@/lib/xmtp/client";
import { getIdentityByInboxId, getTribeForConversation } from "@/lib/xmtp/identity-map";
import { isText } from "@xmtp/browser-sdk";
import { formatRelativeDate } from "@/lib/utils";
import { resolveIdentifier } from "@/lib/xmtp/name-resolver";

function extractTextContent(msg: DecodedMessage): string {
  if (isText(msg)) return msg.content as string;
  return "[unsupported message]";
}

export function useConversations() {
  const {
    status,
    conversations,
    inboxId,
    setConversations,
    addConversation,
    updateConversation,
  } = useXmtpStore();
  const streamRef = useRef<{ end: () => void } | null>(null);

  const loadConversations = useCallback(async () => {
    const client = getExistingClient();
    if (!client) return;

    await client.conversations.sync();
    const allConvos = await client.conversations.list();

    const previews: ConversationPreview[] = await Promise.all(
      allConvos.map(async (convo) => {
        const isGroup = convo instanceof Group;
        const isDm = convo instanceof Dm;
        const lastMsg = await convo.lastMessage();
        const tribeId = getTribeForConversation(convo.id);

        let name = "Conversation";
        let peerAddress: string | undefined;
        let imageUrl: string | undefined;

        if (isGroup) {
          name = (convo as Group).name ?? tribeId ?? "Group Chat";
          imageUrl = (convo as Group).imageUrl;
        } else if (isDm) {
          const peerInboxId = await (convo as Dm).peerInboxId();
          const identity = getIdentityByInboxId(peerInboxId);
          name = identity?.displayName ?? identity?.username ?? `User ${peerInboxId.slice(0, 8)}`;
          peerAddress = identity?.address;
          imageUrl = identity?.pfpUrl;
        }

        return {
          id: convo.id,
          name,
          tribeId,
          peerAddress,
          imageUrl,
          lastMessage: lastMsg ? extractTextContent(lastMsg) : undefined,
          lastMessageTime: lastMsg
            ? formatRelativeDate(lastMsg.sentAt.toISOString())
            : undefined,
          unreadCount: 0,
          isGroup,
        };
      })
    );

    setConversations(previews);
  }, [setConversations]);

  const createDm = useCallback(
    async (identifier: string) => {
      const client = getExistingClient();
      if (!client) throw new Error("XMTP client not connected");

      // Resolve identifier (Address, ENS, Farcaster handle)
      const resolvedAddress = await resolveIdentifier(identifier);
      if (!resolvedAddress) {
        throw new Error(`Could not resolve address for: ${identifier}`);
      }

      const dm = await client.conversations.createDmWithIdentifier({
        identifier: resolvedAddress.toLowerCase(),
        identifierKind: IdentifierKind.Ethereum,
      });

      // Name should be the handle/ENS if provided, otherwise a short address
      const name = identifier.includes("@") || identifier.includes(".")
        ? identifier
        : `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}`;

      const preview: ConversationPreview = {
        id: dm.id,
        name,
        peerAddress: resolvedAddress,
        unreadCount: 0,
        isGroup: false,
      };

      addConversation(preview);
      return dm.id;
    },
    [addConversation]
  );

  const createTribeGroup = useCallback(
    async (
      tribeId: string,
      tribeName: string,
      memberInboxIds: string[]
    ) => {
      const client = getExistingClient();
      if (!client) throw new Error("XMTP client not connected");

      const group = await client.conversations.createGroup(memberInboxIds, {
        groupName: tribeName,
        groupDescription: `Tribe chat for ${tribeName}`,
      });

      const { registerTribeGroup } = await import("@/lib/xmtp/identity-map");
      registerTribeGroup(tribeId, group.id);

      const preview: ConversationPreview = {
        id: group.id,
        name: tribeName,
        tribeId,
        unreadCount: 0,
        isGroup: true,
      };

      addConversation(preview);
      return group.id;
    },
    [addConversation]
  );

  // Stream new conversations in real-time
  useEffect(() => {
    if (status !== "connected") return;

    let active = true;

    async function startStream() {
      const client = getExistingClient();
      if (!client || !active) return;

      const stream = await client.conversations.stream({
        onValue: async (convo) => {
          if (!active) return;
          const isGroup = convo instanceof Group;
          const isDm = convo instanceof Dm;

          let name = "Conversation";
          let peerAddress: string | undefined;
          let imageUrl: string | undefined;

          if (isGroup) {
            name = (convo as Group).name ?? "Group Chat";
            imageUrl = (convo as Group).imageUrl;
          } else if (isDm) {
            const peerInboxId = await (convo as Dm).peerInboxId();
            const identity = getIdentityByInboxId(peerInboxId);
            name = identity?.displayName ?? identity?.username ?? `User ${peerInboxId.slice(0, 8)}`;
            peerAddress = identity?.address;
            imageUrl = identity?.pfpUrl;
          }

          addConversation({
            id: convo.id,
            name,
            peerAddress,
            imageUrl,
            tribeId: getTribeForConversation(convo.id),
            unreadCount: 1,
            isGroup,
          });
        },
      });

      streamRef.current = { end: () => stream.return() };
    }

    startStream();

    return () => {
      active = false;
      streamRef.current?.end();
      streamRef.current = null;
    };
  }, [status, addConversation]);

  // Stream all messages to update conversation previews
  useEffect(() => {
    if (status !== "connected") return;

    let active = true;
    let messageStream: { end: () => void } | null = null;

    async function startMessageStream() {
      const client = getExistingClient();
      if (!client || !active) return;

      const stream = await client.conversations.streamAllMessages({
        onValue: (msg) => {
          if (!active) return;
          const isOwn = msg.senderInboxId === inboxId;
          updateConversation(msg.conversationId, {
            lastMessage: extractTextContent(msg),
            lastMessageTime: formatRelativeDate(msg.sentAt.toISOString()),
            unreadCount: isOwn ? undefined : undefined, // Don't reset on own message
          });
        },
      });

      messageStream = { end: () => stream.return() };
    }

    startMessageStream();

    return () => {
      active = false;
      messageStream?.end();
    };
  }, [status, inboxId, updateConversation]);

  return {
    conversations,
    loadConversations,
    createDm,
    createTribeGroup,
  };
}
