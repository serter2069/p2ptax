/** WebSocket event payload types for the /chat namespace */

// --- Inbound (client → server) ---

export interface JoinThreadPayload {
  threadId: string;
}

export interface SendMessagePayload {
  threadId: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}

export interface MarkReadPayload {
  messageId: string;
}

export interface TypingPayload {
  threadId: string;
}

// --- Outbound (server → client) ---

export interface MessageReceivedEvent {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
}

export interface MessageReadEvent {
  messageId: string;
  readAt: Date;
}

export interface TypingEvent {
  threadId: string;
  userId: string;
}

export interface UserOnlineEvent {
  userId: string;
}

export interface UserOfflineEvent {
  userId: string;
}

export interface JoinedThreadEvent {
  threadId: string;
}

export interface ErrorEvent {
  message: string;
}
