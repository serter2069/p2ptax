import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api';
import {
  getSocket,
  disconnectSocket,
  useSocket,
  type TypedSocket,
  type MessageReceivedEvent,
  type MessageReadEvent,
  type TypingEvent,
} from '../socket';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
}

interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  pages: number;
}

interface UseChatOptions {
  threadId: string | undefined;
  userId: string | undefined;
  token: string | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  loadError: boolean;
  sending: boolean;
  typingVisible: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  connectionState: string;
  sendMessage: (content: string, attachment?: {
    url: string;
    type: string;
    name: string;
  } | null) => Promise<void>;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  emitTyping: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useChat({ threadId, userId, token }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const socketRef = useRef<TypedSocket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { connectionState } = useSocket(token);

  // ---------------------------------------------------------------------------
  // Load initial messages (newest page)
  // ---------------------------------------------------------------------------
  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setLoadError(false);
    try {
      const msgData = await api.get<MessagesResponse>(
        `/threads/${threadId}/messages?page=1`,
      );

      const totalPages = msgData.pages ?? 1;
      if (totalPages > 1) {
        const lastPageData = await api.get<MessagesResponse>(
          `/threads/${threadId}/messages?page=${totalPages}`,
        );
        setMessages(lastPageData.messages ?? []);
        setPage(totalPages);
        setHasMore(totalPages > 1);
      } else {
        setMessages(msgData.messages ?? []);
        setPage(1);
        setHasMore(false);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ---------------------------------------------------------------------------
  // Load older messages (pagination)
  // ---------------------------------------------------------------------------
  const loadMore = useCallback(async () => {
    if (!threadId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const prevPage = page - 1;
      const msgData = await api.get<MessagesResponse>(
        `/threads/${threadId}/messages?page=${prevPage}`,
      );
      const older = msgData.messages ?? [];
      if (older.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = older.filter((m) => !existingIds.has(m.id));
          return [...newMsgs, ...prev];
        });
        setPage(prevPage);
      }
      setHasMore(prevPage > 1);
    } catch {
      // silently fail — user can retry by scrolling up again
    } finally {
      setLoadingMore(false);
    }
  }, [threadId, page, hasMore, loadingMore]);

  // ---------------------------------------------------------------------------
  // WebSocket — join thread, listen for events
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!token || !threadId) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    function onConnect() {
      socket.emit('join_thread', { threadId: threadId! });
    }

    function onNewMessage(msg: MessageReceivedEvent) {
      setMessages((prev) => {
        // Replace optimistic message or skip duplicate
        const optimisticIdx = prev.findIndex(
          (m) => m.id.startsWith('optimistic-') && m.senderId === msg.senderId && m.content === msg.content,
        );
        if (optimisticIdx !== -1) {
          const updated = [...prev];
          updated[optimisticIdx] = msg;
          return updated;
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Auto mark as read if we are the recipient
      if (msg.senderId !== userId) {
        socket.emit('mark_read', { messageId: msg.id });
      }
    }

    function onMessageRead(data: MessageReadEvent) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, readAt: data.readAt } : m,
        ),
      );
    }

    function onTyping(data: TypingEvent) {
      if (data.userId !== userId) {
        setTypingVisible(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingVisible(false), 2500);
      }
    }

    if (socket.connected) onConnect();

    socket.on('connect', onConnect);
    socket.on('message:new', onNewMessage);
    socket.on('message_received', onNewMessage);
    socket.on('message:read', onMessageRead);
    socket.on('message_read', onMessageRead);
    socket.on('typing:start', onTyping);
    socket.on('typing', onTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('message:new', onNewMessage);
      socket.off('message_received', onNewMessage);
      socket.off('message:read', onMessageRead);
      socket.off('message_read', onMessageRead);
      socket.off('typing:start', onTyping);
      socket.off('typing', onTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      disconnectSocket();
    };
  }, [token, threadId, userId]);

  // ---------------------------------------------------------------------------
  // Send message — optimistic + WS primary, REST fallback
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (
      content: string,
      attachment?: { url: string; type: string; name: string } | null,
    ) => {
      const trimmed = content.trim();
      const hasAttachment = !!attachment;
      if (!trimmed && !hasAttachment) return;
      if (!threadId || !userId || sending) return;

      setSending(true);

      // Optimistic update
      const optimisticMsg: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        threadId,
        senderId: userId,
        content: trimmed,
        readAt: null,
        createdAt: new Date().toISOString(),
        attachmentUrl: attachment?.url ?? null,
        attachmentType: attachment?.type ?? null,
        attachmentName: attachment?.name ?? null,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const payload = {
          threadId,
          content: trimmed,
          ...(attachment && {
            attachmentUrl: attachment.url,
            attachmentType: attachment.type,
            attachmentName: attachment.name,
          }),
        };

        if (socketRef.current?.connected) {
          socketRef.current.emit('send_message', payload);
        } else {
          // REST fallback
          const message = await api.post<ChatMessage>(
            `/threads/${threadId}/messages`,
            {
              content: trimmed,
              ...(attachment && {
                attachmentUrl: attachment.url,
                attachmentType: attachment.type,
                attachmentName: attachment.name,
              }),
            },
          );
          // Replace optimistic with real message
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== optimisticMsg.id);
            if (filtered.some((m) => m.id === message.id)) return filtered;
            return [...filtered, message];
          });
        }
      } catch {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        throw new Error('Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [threadId, userId, sending],
  );

  // ---------------------------------------------------------------------------
  // Emit typing indicator
  // ---------------------------------------------------------------------------
  const emitTyping = useCallback(() => {
    if (socketRef.current?.connected && threadId) {
      socketRef.current.emit('typing:start', { threadId });
    }
  }, [threadId]);

  return {
    messages,
    loading,
    loadError,
    sending,
    typingVisible,
    hasMore,
    loadingMore,
    connectionState,
    sendMessage,
    loadMore,
    reload: fetchMessages,
    emitTyping,
  };
}
