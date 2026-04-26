import type { UserKarma } from "./user";

export type MessageType = "text" | "image" | "event" | "poll" | "levelUp";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isFromCurrentUser: boolean;
  type: MessageType;
  senderKarma?: UserKarma;
  senderInboxId?: string;
  conversationId?: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  isGroup: boolean;
  tribeId?: string;
  peerAddress?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  imageUrl?: string;
}
