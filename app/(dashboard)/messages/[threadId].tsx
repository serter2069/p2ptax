import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { getSocket, disconnectSocket } from '../../../lib/socket';
import { Header } from '../../../components/Header';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import type { Socket } from 'socket.io-client';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  pages: number;
}

interface ThreadParticipant {
  id: string;
  email: string;
  role: string;
}

interface ThreadItem {
  id: string;
  participant1: ThreadParticipant;
  participant2: ThreadParticipant;
  lastMessage: Message | null;
  createdAt: string;
}

function formatMsgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user, token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherEmail, setOtherEmail] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial messages + thread info
  const fetchData = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const [msgData, threads] = await Promise.all([
        api.get<MessagesResponse>(`/threads/${threadId}/messages?page=1`),
        api.get<ThreadItem[]>('/threads'),
      ]);

      setMessages(msgData.messages ?? []);

      const thread = threads.find((t) => t.id === threadId);
      if (thread && user) {
        const other =
          thread.participant1.id === user.userId
            ? thread.participant2
            : thread.participant1;
        setOtherEmail(other.email);
      }
    } catch {
      // silently fail, show empty
    } finally {
      setLoading(false);
    }
  }, [threadId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket setup
  useEffect(() => {
    if (!token || !threadId) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    function onConnect() {
      socket.emit('join_thread', { threadId });
    }

    function onMessageReceived(msg: Message) {
      setMessages((prev) => {
        // avoid duplicate if we sent it optimistically
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Mark as read if we're the recipient
      if (msg.senderId !== user?.userId) {
        socket.emit('mark_read', { messageId: msg.id });
      }
    }

    function onTyping(data: { threadId: string; userId: string }) {
      if (data.userId !== user?.userId) {
        setTypingVisible(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingVisible(false), 2500);
      }
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('message_received', onMessageReceived);
    socket.on('typing', onTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('message_received', onMessageReceived);
      socket.off('typing', onTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      disconnectSocket();
    };
  }, [token, threadId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  function handleInputChange(text: string) {
    setInput(text);
    if (socketRef.current?.connected && threadId) {
      socketRef.current.emit('typing', { threadId });
    }
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || !threadId || sending) return;

    setInput('');
    setSending(true);

    try {
      if (socketRef.current?.connected) {
        // Primary path: send via WebSocket — gateway broadcasts message_received to room
        socketRef.current.emit('send_message', { threadId, content });
      } else {
        // Fallback: WebSocket unavailable — send via REST, which also emits to WS room
        const message = await api.post<Message>(`/threads/${threadId}/messages`, { content });
        // Append locally so sender sees the message immediately without waiting for WS event
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    } catch {
      // Restore input on failure so user can retry
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMe = item.senderId === user?.userId;
    const prevItem = index > 0 ? messages[index - 1] : null;
    const showDate =
      !prevItem ||
      new Date(item.createdAt).toDateString() !==
        new Date(prevItem.createdAt).toDateString();

    return (
      <>
        {showDate && (
          <View style={styles.dateBadgeWrap}>
            <Text style={styles.dateBadge}>
              {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
              })}
            </Text>
          </View>
        )}
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
              {item.content}
            </Text>
            <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
              {formatMsgTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={otherEmail || 'Диалог'} showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {typingVisible && (
          <View style={styles.typingWrap}>
            <Text style={styles.typingText}>печатает...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Сообщение..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.sendIcon}>{'>'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dateBadgeWrap: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 430,
    marginVertical: Spacing.sm,
  },
  dateBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  msgRow: {
    width: '100%',
    maxWidth: 430,
    marginBottom: 6,
    flexDirection: 'row',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleMe: {
    backgroundColor: Colors.brandPrimary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#fff',
  },
  msgTextOther: {
    color: Colors.textPrimary,
  },
  msgTime: {
    fontSize: Typography.fontSize.xs,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(255,255,255,0.65)',
  },
  msgTimeOther: {
    color: Colors.textMuted,
  },
  typingWrap: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  typingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: '#fff',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
});
