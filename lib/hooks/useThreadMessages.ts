import { useState, useCallback, useEffect, useRef } from "react";
import { api, apiPatch } from "@/lib/api";

const PAGE_SIZE = 50;
const POLL_INTERVAL = 5000;

interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface MessageSender {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface MessageItem {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: MessageSender;
  files: FileAttachment[];
}

interface OtherUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isDeleted?: boolean;
}

export interface ThreadInfo {
  id: string;
  requestId: string;
  clientId: string;
  specialistId: string;
  request: { id: string; title: string; status: string };
  client: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; isDeleted?: boolean };
  specialist: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; isDeleted?: boolean };
  otherUser: OtherUser;
}

export interface UseThreadMessagesResult {
  messages: MessageItem[];
  thread: ThreadInfo | null;
  loading: boolean;
  error: string | null;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  loadData: () => Promise<void>;
  loadOlder: () => Promise<void>;
}

export function useThreadMessages(threadId: string): UseThreadMessagesResult {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const markAsRead = useCallback(async () => {
    if (!threadId) return;
    try {
      await apiPatch(`/api/messages/${threadId}/read`, {});
    } catch {
      // ignore
    }
  }, [threadId]);

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await api<{
        messages: MessageItem[];
        hasMore?: boolean;
        nextCursor?: string | null;
      }>(`/api/messages/${threadId}?limit=${PAGE_SIZE}`);
      // Preserve object identity for messages we already have. The poll
      // response is fresh JSON every time — same data, new object refs —
      // which would otherwise cause every <Image> in MessageBubble to
      // re-fetch its source on every 5-second poll. Match by id; reuse
      // the previous reference when content hasn't changed.
      let hadNewIncoming = false;
      setMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        let changed = prev.length !== res.messages.length;
        const merged = res.messages.map((m) => {
          const existing = byId.get(m.id);
          if (existing) return existing;
          changed = true;
          hadNewIncoming = true;
          return m;
        });
        return changed ? merged : prev;
      });
      setHasMoreOlder(Boolean(res.hasMore));
      setOldestMessageId(res.nextCursor ?? (res.messages[0]?.id ?? null));
      // If the poll brought a brand-new message in (almost always from
      // the counterpart), refresh lastReadAt so the inbox sidebar's
      // unread dot clears without forcing the user to navigate away
      // and back.
      if (hadNewIncoming) {
        void markAsRead();
      }
    } catch {
      // ignore
    }
  }, [threadId, markAsRead]);

  const loadOlder = useCallback(async () => {
    if (!threadId || !oldestMessageId || loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const res = await api<{
        messages: MessageItem[];
        hasMore?: boolean;
        nextCursor?: string | null;
      }>(`/api/messages/${threadId}?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldestMessageId)}`);
      if (res.messages.length > 0) {
        setMessages((prev) => [...res.messages, ...prev]);
      }
      setHasMoreOlder(Boolean(res.hasMore));
      setOldestMessageId(res.nextCursor ?? (res.messages[0]?.id ?? oldestMessageId));
    } catch (e) {
      if (__DEV__) console.error("load older messages error:", e);
    } finally {
      setLoadingOlder(false);
    }
  }, [threadId, oldestMessageId, loadingOlder, hasMoreOlder]);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await api<ThreadInfo>(`/api/threads/${threadId}`);
      setThread(res);
    } catch {
      // ignore
    }
  }, [threadId]);


  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchMessages(), fetchThread()]);
      await markAsRead();
    } catch {
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, fetchThread, markAsRead]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchMessages();
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  return {
    messages,
    thread,
    loading,
    error,
    hasMoreOlder,
    loadingOlder,
    setMessages,
    loadData,
    loadOlder,
  };
}
