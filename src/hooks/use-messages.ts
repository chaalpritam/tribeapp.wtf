"use client";

import { useCallback, useEffect, useRef } from "react";
import { isText } from "@xmtp/browser-sdk";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useXmtpStore } from "@/store/use-xmtp-store";
import type { XmtpMessage } from "@/store/use-xmtp-store";
import { getExistingClient } from "@/lib/xmtp/client";

function toXmtpMessage(
  msg: DecodedMessage,
  currentInboxId: string | null
): XmtpMessage {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderAddress: "",
    senderInboxId: msg.senderInboxId,
    content: isText(msg) ? (msg.content as string) : "[unsupported message]",
    timestamp: msg.sentAt,
    isFromCurrentUser: msg.senderInboxId === currentInboxId,
  };
}

export function useMessages(conversationId: string | null) {
  const { messages, inboxId, status, setMessages, addMessage } =
    useXmtpStore();
  const streamRef = useRef<{ end: () => void } | null>(null);

  const conversationMessages = conversationId
    ? (messages[conversationId] ?? [])
    : [];

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    const client = getExistingClient();
    if (!client) return;

    const convo = await client.conversations.getConversationById(
      conversationId
    );
    if (!convo) return;

    await convo.sync();
    const msgs = await convo.messages();

    const xmtpMessages: XmtpMessage[] = msgs.map((msg) =>
      toXmtpMessage(msg, inboxId)
    );

    setMessages(conversationId, xmtpMessages);
  }, [conversationId, inboxId, setMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;

      const client = getExistingClient();
      if (!client) throw new Error("XMTP client not connected");

      const convo = await client.conversations.getConversationById(
        conversationId
      );
      if (!convo) throw new Error("Conversation not found");

      const messageId = await convo.sendText(content.trim());

      // Optimistically add the message
      addMessage(conversationId, {
        id: messageId,
        conversationId,
        senderAddress: "",
        senderInboxId: inboxId ?? "",
        content: content.trim(),
        timestamp: new Date(),
        isFromCurrentUser: true,
      });

      return messageId;
    },
    [conversationId, inboxId, addMessage]
  );

  // Stream incoming messages for this conversation
  useEffect(() => {
    if (!conversationId || status !== "connected") return;

    let active = true;

    async function startStream() {
      const client = getExistingClient();
      if (!client || !active) return;

      const convo = await client.conversations.getConversationById(
        conversationId!
      );
      if (!convo || !active) return;

      const stream = await convo.stream({
        onValue: (msg) => {
          if (!active) return;
          // Skip own messages (already added optimistically)
          if (msg.senderInboxId === inboxId) return;
          addMessage(conversationId!, toXmtpMessage(msg, inboxId));
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
  }, [conversationId, status, inboxId, addMessage]);

  return {
    messages: conversationMessages,
    loadMessages,
    sendMessage,
  };
}
