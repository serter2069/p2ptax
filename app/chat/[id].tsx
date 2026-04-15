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
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { api } from '../../lib/api';
import { getSocket, disconnectSocket } from '../../lib/socket';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import type { Socket } from 'socket.io-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Attachment {
  url: string;
  type: string; // "IMAGE" | "DOCUMENT"
  name: string;
}

interface Message {
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
  messages: Message[];
  total: number;
  page: number;
  pages: number;
}

interface SpecialistProfile {
  nick: string;
  displayName: string | null;
}

interface ThreadParticipant {
  id: string;
  email: string;
  role: string;
  name?: string;
  specialistProfile?: SpecialistProfile | null;
}

interface ThreadItem {
  id: string;
  participant1: ThreadParticipant;
  participant2: ThreadParticipant;
  lastMessage: Message | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatMsgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateBadge(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDay.getTime() === today.getTime()) return 'Сегодня';
  if (msgDay.getTime() === yesterday.getTime()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function ChatThreadScreen() {
  const { id: threadId } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const { isMobile } = useBreakpoints();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherName, setOtherName] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Load initial messages + resolve other participant name
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setLoadError(false);
    try {
      const [msgData, threads] = await Promise.all([
        api.get<MessagesResponse>(`/threads/${threadId}/messages?page=1`),
        api.get<ThreadItem[]>('/threads'),
      ]);

      const totalPages = msgData.pages ?? 1;
      // If more than 1 page, load the last page first (newest messages)
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

      const thread = threads.find((t) => t.id === threadId);
      if (thread && user) {
        const other =
          thread.participant1.id === user.userId
            ? thread.participant2
            : thread.participant1;
        const profile = other.specialistProfile;
        setOtherName(
          profile?.displayName || profile?.nick || other.name || other.email.split('@')[0],
        );
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [threadId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Load older messages (pagination)
  // ---------------------------------------------------------------------------
  const loadMoreMessages = useCallback(async () => {
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
  // WebSocket
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!token || !threadId) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    function onConnect() {
      socket.emit('join_thread', { threadId });
    }

    function onNewMessage(msg: Message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto-mark as read if we are the recipient
      if (msg.senderId !== user?.userId) {
        socket.emit('mark_read', { messageId: msg.id });
      }
    }

    function onMessageRead(data: { messageId: string; readAt: string }) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, readAt: data.readAt } : m,
        ),
      );
    }

    function onTyping(data: { threadId: string; userId: string }) {
      if (data.userId !== user?.userId) {
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
  }, [token, threadId, user]);

  // ---------------------------------------------------------------------------
  // Auto-scroll on new messages
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Input + typing indicator
  // ---------------------------------------------------------------------------
  function handleInputChange(text: string) {
    setInput(text);
    if (socketRef.current?.connected && threadId) {
      socketRef.current.emit('typing:start', { threadId });
    }
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------
  async function uploadAttachment(fileData: {
    uri: string;
    name: string;
    mimeType: string;
  }) {
    if (!threadId) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(fileData.uri);
        const blob = await response.blob();
        formData.append('file', blob, fileData.name);
      } else {
        formData.append('file', {
          uri: fileData.uri,
          name: fileData.name,
          type: fileData.mimeType,
        } as unknown as Blob);
      }

      const result = await api.upload<Attachment>(
        `/threads/${threadId}/upload`,
        formData,
      );
      setPendingAttachment(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка загрузки файла';
      Alert.alert('Ошибка', msg);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleAttachPress() {
    if (Platform.OS === 'web') {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept =
        'image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      el.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const uri = URL.createObjectURL(file);
        await uploadAttachment({ uri, name: file.name, mimeType: file.type });
      };
      el.click();
      return;
    }

    Alert.alert('Прикрепить файл', 'Выберите тип', [
      {
        text: 'Фото из галереи',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              'Нет доступа',
              'Разрешите доступ к галерее в настройках',
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
            const mimeType = asset.mimeType ?? 'image/jpeg';
            await uploadAttachment({ uri: asset.uri, name, mimeType });
          }
        },
      },
      {
        text: 'Камера',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              'Нет доступа',
              'Разрешите доступ к камере в настройках',
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
            const mimeType = asset.mimeType ?? 'image/jpeg';
            await uploadAttachment({ uri: asset.uri, name, mimeType });
          }
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }

  function clearAttachment() {
    setPendingAttachment(null);
  }

  // ---------------------------------------------------------------------------
  // Send message (WS primary, REST fallback)
  // ---------------------------------------------------------------------------
  async function handleSend() {
    const content = input.trim();
    const hasAttachment = !!pendingAttachment;

    if (!content && !hasAttachment) return;
    if (!threadId || sending) return;

    setInput('');
    const attachmentToSend = pendingAttachment;
    setPendingAttachment(null);
    setSending(true);

    // Optimistic update
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      threadId: threadId!,
      senderId: user!.userId,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
      attachmentUrl: attachmentToSend?.url ?? null,
      attachmentType: attachmentToSend?.type ?? null,
      attachmentName: attachmentToSend?.name ?? null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const payload = {
        threadId,
        content,
        ...(attachmentToSend && {
          attachmentUrl: attachmentToSend.url,
          attachmentType: attachmentToSend.type,
          attachmentName: attachmentToSend.name,
        }),
      };

      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', payload);
      } else {
        const message = await api.post<Message>(
          `/threads/${threadId}/messages`,
          {
            content,
            ...(attachmentToSend && {
              attachmentUrl: attachmentToSend.url,
              attachmentType: attachmentToSend.type,
              attachmentName: attachmentToSend.name,
            }),
          },
        );
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    } catch {
      // Restore on failure
      setInput(content);
      if (attachmentToSend) setPendingAttachment(attachmentToSend);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function renderAttachmentContent(item: Message, isMe: boolean) {
    if (!item.attachmentUrl) return null;

    if (item.attachmentType === 'IMAGE') {
      return (
        <Image
          source={{ uri: item.attachmentUrl }}
          style={styles.attachImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View
        style={[styles.docRow, isMe ? styles.docRowMe : styles.docRowOther]}
      >
        <Ionicons
          name="document-outline"
          size={20}
          color={isMe ? 'rgba(255,255,255,0.9)' : Colors.textMuted}
        />
        <Text
          style={[
            styles.docName,
            isMe ? styles.docNameMe : styles.docNameOther,
          ]}
          numberOfLines={1}
        >
          {item.attachmentName ?? 'Файл'}
        </Text>
      </View>
    );
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
              {formatDateBadge(item.createdAt)}
            </Text>
          </View>
        )}
        <View
          style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}
        >
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
            ]}
          >
            {renderAttachmentContent(item, isMe)}
            {!!item.content && (
              <Text
                style={[
                  styles.msgText,
                  isMe ? styles.msgTextMe : styles.msgTextOther,
                ]}
              >
                {item.content}
              </Text>
            )}
            <View style={styles.msgMeta}>
              <Text
                style={[
                  styles.msgTime,
                  isMe ? styles.msgTimeMe : styles.msgTimeOther,
                ]}
              >
                {formatMsgTime(item.createdAt)}
              </Text>
              {isMe && (
                <Text style={styles.deliveryStatus}>
                  {item.readAt ? ' \u2713\u2713' : ' \u2713'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }

  const canSend = !!(input.trim() || pendingAttachment);

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={otherName || 'Диалог'}
        showBack
        breadcrumbs={[
          { label: 'Сообщения', route: '/(dashboard)/messages' },
          { label: otherName || 'Диалог' },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          </View>
        ) : loadError ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Не удалось загрузить сообщения"
            ctaLabel="Повторить"
            onCtaPress={fetchData}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-outline"
            title="Нет сообщений"
            subtitle="Напишите первое сообщение, чтобы начать диалог."
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onScroll={({ nativeEvent }) => {
              if (
                nativeEvent.contentOffset.y < 50 &&
                hasMore &&
                !loadingMore
              ) {
                loadMoreMessages();
              }
            }}
            scrollEventThrottle={200}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadingMoreWrap}>
                  <ActivityIndicator
                    size="small"
                    color={Colors.brandPrimary}
                  />
                </View>
              ) : null
            }
          />
        )}

        {typingVisible && (
          <View style={styles.typingWrap}>
            <Text style={styles.typingText}>печатает...</Text>
          </View>
        )}

        {/* Attachment preview above input */}
        {pendingAttachment && (
          <View style={styles.attachPreview}>
            {pendingAttachment.type === 'IMAGE' ? (
              <Image
                source={{ uri: pendingAttachment.url }}
                style={styles.attachPreviewImg}
              />
            ) : (
              <View style={styles.attachPreviewDoc}>
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={Colors.textMuted}
                />
                <Text style={styles.attachPreviewName} numberOfLines={1}>
                  {pendingAttachment.name}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={clearAttachment}
              style={styles.attachRemoveBtn}
              hitSlop={8}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          {/* Attach button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAttachPress}
            disabled={uploadingFile || sending}
            activeOpacity={0.7}
            hitSlop={6}
          >
            {uploadingFile ? (
              <ActivityIndicator size="small" color={Colors.textMuted} />
            ) : (
              <Ionicons name="attach" size={22} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

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
            style={[
              styles.sendBtn,
              (!canSend || sending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
  loadingMoreWrap: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  dateBadgeWrap: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
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
    maxWidth: 600,
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
    backgroundColor: Colors.bgSecondary,
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
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  deliveryStatus: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
  },
  msgTime: {
    fontSize: Typography.fontSize.xs,
  },
  msgTimeMe: {
    color: 'rgba(255,255,255,0.65)',
  },
  msgTimeOther: {
    color: Colors.textMuted,
  },
  // Attachment inside message bubble
  attachImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  docRowMe: {},
  docRowOther: {},
  docName: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  docNameMe: {
    color: 'rgba(255,255,255,0.9)',
  },
  docNameOther: {
    color: Colors.textPrimary,
  },
  // Attachment preview above input
  attachPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  attachPreviewImg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  attachPreviewDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  attachPreviewName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  attachRemoveBtn: {
    padding: 2,
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
  attachBtn: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
});
