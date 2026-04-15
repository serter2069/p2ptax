import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { api } from '../../lib/api';
import { useChat, type ChatMessage } from '../../lib/hooks/useChat';
import { Colors } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Attachment {
  url: string;
  type: string; // "IMAGE" | "DOCUMENT"
  name: string;
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
  lastMessage: ChatMessage | null;
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Skeleton block
// ---------------------------------------------------------------------------
function SkeletonBlock({ className: cls }: { className: string }) {
  return <View className={`bg-bgSurface opacity-70 ${cls}`} />;
}

// ---------------------------------------------------------------------------
// Chat header (matches prototype ChatHeader)
// ---------------------------------------------------------------------------
function ChatHeader({
  name,
  online,
  onBack,
}: {
  name: string;
  online: boolean;
  onBack: () => void;
}) {
  const initials = getInitials(name);
  return (
    <View className="flex-row items-center gap-3 border-b border-border bg-white px-4 py-3 shadow-sm">
      <Pressable
        onPress={onBack}
        className="h-9 w-9 items-center justify-center rounded-full"
      >
        <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
      </Pressable>
      <View className="relative h-9 w-9 items-center justify-center rounded-full border border-border bg-bgSurface">
        <Text className="text-xs font-bold text-brandPrimary">{initials}</Text>
        {online && (
          <View
            className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-statusSuccess"
            style={{ borderWidth: 2, borderColor: Colors.white }}
          />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-textPrimary">{name}</Text>
        <Text
          className={`text-xs ${online ? 'text-statusSuccess' : 'text-textMuted'}`}
        >
          {online ? 'Онлайн' : 'Был(а) недавно'}
        </Text>
      </View>
      <Pressable className="h-9 w-9 items-center justify-center">
        <Feather name="more-vertical" size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// System message (request context)
// ---------------------------------------------------------------------------
function SystemMessage({ text }: { text: string }) {
  return (
    <View className="items-center px-4 py-2">
      <Text className="rounded-full bg-bgSurface px-3 py-1 text-xs text-textMuted overflow-hidden">
        {text}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// File attachment inside bubble (matches prototype FileAttachment)
// ---------------------------------------------------------------------------
function FileAttachment({
  item,
  isMe,
}: {
  item: ChatMessage;
  isMe: boolean;
}) {
  if (!item.attachmentUrl) return null;

  if (item.attachmentType === 'IMAGE') {
    return (
      <Image
        source={{ uri: item.attachmentUrl }}
        className="mb-1 h-[150px] w-[200px] rounded-md"
        resizeMode="cover"
      />
    );
  }

  // DOCUMENT — prototype style
  return (
    <Pressable
      className={`mt-1 flex-row items-center gap-2 rounded-md p-2 ${
        isMe ? 'bg-white/10' : 'bg-bgSurface'
      }`}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-md"
        style={{
          backgroundColor: isMe
            ? 'rgba(255,255,255,0.15)'
            : Colors.statusBg.error,
        }}
      >
        <Feather
          name="file-text"
          size={18}
          color={isMe ? Colors.white : Colors.statusError}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-xs font-medium ${isMe ? 'text-white' : 'text-textPrimary'}`}
          numberOfLines={1}
        >
          {item.attachmentName ?? 'Файл'}
        </Text>
      </View>
      <Feather
        name="download"
        size={14}
        color={isMe ? 'rgba(255,255,255,0.6)' : Colors.textMuted}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator (matches prototype TypingIndicator)
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <View className="flex-row justify-start px-3">
      <View className="rounded-lg border border-border bg-white p-2" style={{ borderBottomLeftRadius: 3 }}>
        <View className="flex-row items-center gap-1">
          <View className="h-1.5 w-1.5 rounded-full bg-textMuted" />
          <View className="h-1.5 w-1.5 rounded-full bg-textMuted opacity-60" />
          <View className="h-1.5 w-1.5 rounded-full bg-textMuted opacity-30" />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Attachment popup (matches prototype AttachmentPopup)
// ---------------------------------------------------------------------------
function AttachmentPopup({
  onClose,
  onPickPhoto,
  onPickCamera,
  onPickDocument,
}: {
  onClose: () => void;
  onPickPhoto: () => void;
  onPickCamera: () => void;
  onPickDocument: () => void;
}) {
  const options = [
    { icon: 'file-text' as const, label: 'Документ', onPress: onPickDocument },
    { icon: 'image' as const, label: 'Фото', onPress: onPickPhoto },
    { icon: 'camera' as const, label: 'Камера', onPress: onPickCamera },
  ];
  return (
    <View className="absolute bottom-0 left-0 right-0 z-10">
      <Pressable
        className="absolute -top-[500px] bottom-0 left-0 right-0"
        onPress={onClose}
      />
      <View className="mx-3 mb-2 rounded-2xl border border-border bg-white p-4 shadow-lg">
        <Text className="mb-3 text-sm font-semibold text-textPrimary">
          Прикрепить файл
        </Text>
        <View className="flex-row gap-5">
          {options.map((opt) => (
            <Pressable
              key={opt.label}
              className="items-center gap-1"
              onPress={() => {
                onClose();
                opt.onPress();
              }}
            >
              <View className="h-12 w-12 items-center justify-center rounded-full border border-border bg-bgSurface">
                <Feather name={opt.icon} size={20} color={Colors.brandPrimary} />
              </View>
              <Text className="text-xs text-textSecondary">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading state (skeleton, matches prototype LoadingChat)
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <View className="flex-1 bg-bgPrimary">
      {/* Header skeleton */}
      <View className="flex-row items-center gap-3 border-b border-border bg-white px-4 py-3">
        <SkeletonBlock className="h-5 w-5 rounded" />
        <SkeletonBlock className="h-9 w-9 rounded-full" />
        <View className="flex-1 gap-1">
          <SkeletonBlock className="h-3.5 w-1/2 rounded" />
          <SkeletonBlock className="h-3 w-[30%] rounded" />
        </View>
      </View>
      {/* Message skeletons */}
      <View className="flex-1 p-3 gap-1">
        <View className="flex-row justify-end">
          <SkeletonBlock className="h-11 w-[65%] rounded-lg" />
        </View>
        <View className="flex-row justify-start">
          <SkeletonBlock className="h-14 w-[70%] rounded-lg" />
        </View>
        <View className="flex-row justify-end">
          <SkeletonBlock className="h-9 w-[55%] rounded-lg" />
        </View>
        <View className="flex-row justify-start">
          <SkeletonBlock className="h-12 w-[60%] rounded-lg" />
        </View>
      </View>
      <View className="items-center py-3">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
      {/* Input skeleton */}
      <View className="border-t border-border bg-white p-3">
        <SkeletonBlock className="h-10 w-full rounded-full" />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state (matches prototype EmptyChat)
// ---------------------------------------------------------------------------
function EmptyChatState() {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-5">
      <View className="h-16 w-16 items-center justify-center rounded-full border border-border bg-bgSurface">
        <Feather name="message-circle" size={32} color={Colors.brandPrimary} />
      </View>
      <Text className="text-base font-semibold text-textPrimary">
        Начните общение
      </Text>
      <Text className="max-w-[260px] text-center text-sm text-textMuted">
        Напишите специалисту, чтобы обсудить детали вашей заявки
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Error state (matches prototype ErrorChat)
// ---------------------------------------------------------------------------
function ErrorChatState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-5">
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.statusBg.error }}
      >
        <Feather name="wifi-off" size={32} color={Colors.statusError} />
      </View>
      <Text className="text-base font-semibold text-textPrimary">
        Нет подключения
      </Text>
      <Text className="max-w-[260px] text-center text-sm text-textMuted">
        Не удалось загрузить сообщения
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-2 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary px-6 h-10"
      >
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">
          Попробовать снова
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function ChatThreadScreen() {
  const { id: threadId } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();

  const [otherName, setOtherName] = useState('');
  const [otherOnline] = useState(false);
  const [input, setInput] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(
    null,
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // ---------------------------------------------------------------------------
  // Chat hook — messages, send, typing, read receipts via WS + REST
  // ---------------------------------------------------------------------------
  const {
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
    reload,
    emitTyping,
  } = useChat({
    threadId,
    userId: user?.userId,
    token,
  });

  // ---------------------------------------------------------------------------
  // Resolve other participant name
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!threadId || !user) return;
    api
      .get<ThreadItem[]>('/threads')
      .then((threads) => {
        const thread = threads.find((t) => t.id === threadId);
        if (thread) {
          const other =
            thread.participant1.id === user.userId
              ? thread.participant2
              : thread.participant1;
          const profile = other.specialistProfile;
          setOtherName(
            profile?.displayName ||
              profile?.nick ||
              other.name ||
              other.email.split('@')[0],
          );
        }
      })
      .catch(() => {});
  }, [threadId, user]);

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
    emitTyping();
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

  function handlePickDocument() {
    if (Platform.OS === 'web') {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept =
        'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      el.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const uri = URL.createObjectURL(file);
        await uploadAttachment({ uri, name: file.name, mimeType: file.type });
      };
      el.click();
    }
    // On native, handled via ImagePicker or document picker
  }

  async function handlePickPhoto() {
    if (Platform.OS === 'web') {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept = 'image/jpeg,image/png,image/gif,image/webp';
      el.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const uri = URL.createObjectURL(file);
        await uploadAttachment({ uri, name: file.name, mimeType: file.type });
      };
      el.click();
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках');
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
  }

  async function handlePickCamera() {
    if (Platform.OS === 'web') return; // No camera on web
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к камере в настройках');
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
  }

  function clearAttachment() {
    setPendingAttachment(null);
  }

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  async function handleSend() {
    const content = input.trim();
    const hasAttachment = !!pendingAttachment;

    if (!content && !hasAttachment) return;
    if (!threadId || sending) return;

    setInput('');
    const attachmentToSend = pendingAttachment;
    setPendingAttachment(null);

    try {
      await sendMessage(content, attachmentToSend);
    } catch {
      setInput(content);
      if (attachmentToSend) setPendingAttachment(attachmentToSend);
    }
  }

  // ---------------------------------------------------------------------------
  // Render message bubble (matches prototype MessageBubble)
  // ---------------------------------------------------------------------------
  function renderMessage({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) {
    const isMe = item.senderId === user?.userId;
    const prevItem = index > 0 ? messages[index - 1] : null;
    const showDate =
      !prevItem ||
      new Date(item.createdAt).toDateString() !==
        new Date(prevItem.createdAt).toDateString();

    return (
      <>
        {showDate && (
          <View className="my-2 w-full max-w-[600px] items-center">
            <Text className="rounded-full bg-bgSurface px-3 py-0.5 text-xs text-textMuted overflow-hidden">
              {formatDateBadge(item.createdAt)}
            </Text>
          </View>
        )}
        <View
          className={`mb-1 w-full max-w-[600px] flex-row ${
            isMe ? 'justify-end' : 'justify-start'
          }`}
        >
          <View
            className={`max-w-[78%] rounded-lg p-3 ${
              isMe
                ? 'bg-brandPrimary'
                : 'border border-border bg-white'
            }`}
            style={
              isMe
                ? { borderBottomRightRadius: 3 }
                : { borderBottomLeftRadius: 3 }
            }
          >
            <FileAttachment item={item} isMe={isMe} />
            {!!item.content && (
              <Text
                className={`text-sm leading-5 ${
                  isMe ? 'text-white' : 'text-textPrimary'
                }`}
              >
                {item.content}
              </Text>
            )}
            {/* Footer: time + read status */}
            <View className="mt-1 flex-row items-center justify-end gap-1">
              <Text
                className="text-[10px]"
                style={{
                  color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted,
                }}
              >
                {formatMsgTime(item.createdAt)}
              </Text>
              {isMe && (
                <View className="flex-row items-center">
                  <Feather
                    name="check"
                    size={10}
                    color={
                      item.readAt
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.4)'
                    }
                  />
                  <Feather
                    name="check"
                    size={10}
                    color={
                      item.readAt
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.4)'
                    }
                    style={{ marginLeft: -6 }}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }

  const canSend = !!(input.trim() || pendingAttachment);

  // ---------------------------------------------------------------------------
  // Connection status banner
  // ---------------------------------------------------------------------------
  const showConnectionBanner =
    connectionState === 'reconnecting' || connectionState === 'disconnected';

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bgPrimary">
        <LoadingState />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-bgPrimary">
      <ChatHeader
        name={otherName || 'Диалог'}
        online={otherOnline}
        onBack={() => router.back()}
      />

      {showConnectionBanner && (
        <View className="items-center bg-statusWarning px-3 py-1.5">
          <Text className="text-sm font-semibold text-white">
            {connectionState === 'reconnecting'
              ? 'Переподключение...'
              : 'Нет соединения'}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loadError ? (
          <ErrorChatState onRetry={reload} />
        ) : messages.length === 0 ? (
          <EmptyChatState />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onScroll={({ nativeEvent }) => {
              if (
                nativeEvent.contentOffset.y < 50 &&
                hasMore &&
                !loadingMore
              ) {
                loadMore();
              }
            }}
            scrollEventThrottle={200}
            ListHeaderComponent={
              loadingMore ? (
                <View className="w-full items-center py-3">
                  <ActivityIndicator
                    size="small"
                    color={Colors.brandPrimary}
                  />
                </View>
              ) : null
            }
          />
        )}

        {typingVisible && <TypingIndicator />}

        {/* Attachment preview above input */}
        {pendingAttachment && (
          <View className="flex-row items-center gap-2 border-t border-border bg-bgSurface px-3 py-1">
            {pendingAttachment.type === 'IMAGE' ? (
              <Image
                source={{ uri: pendingAttachment.url }}
                className="h-12 w-12 rounded"
              />
            ) : (
              <View className="flex-1 flex-row items-center gap-1.5">
                <Feather
                  name="file-text"
                  size={20}
                  color={Colors.textMuted}
                />
                <Text
                  className="flex-1 text-sm text-textPrimary"
                  numberOfLines={1}
                >
                  {pendingAttachment.name}
                </Text>
              </View>
            )}
            <Pressable onPress={clearAttachment} hitSlop={8} className="p-0.5">
              <Feather name="x-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Input bar (matches prototype) */}
        <View className="relative">
          {showAttach && (
            <AttachmentPopup
              onClose={() => setShowAttach(false)}
              onPickPhoto={handlePickPhoto}
              onPickCamera={handlePickCamera}
              onPickDocument={handlePickDocument}
            />
          )}
          <View className="flex-row items-center gap-2 border-t border-border bg-white p-3">
            <Pressable
              className="h-9 w-9 items-center justify-center"
              onPress={() => setShowAttach(!showAttach)}
              disabled={uploadingFile || sending}
            >
              {uploadingFile ? (
                <ActivityIndicator size="small" color={Colors.textMuted} />
              ) : (
                <Feather
                  name="paperclip"
                  size={18}
                  color={
                    showAttach ? Colors.brandPrimary : Colors.textMuted
                  }
                />
              )}
            </Pressable>
            <TextInput
              value={input}
              onChangeText={handleInputChange}
              placeholder="Введите сообщение..."
              placeholderTextColor={Colors.textMuted}
              className="flex-1 h-10 rounded-full border border-border bg-bgPrimary px-4 text-sm text-textPrimary"
              style={{ outlineStyle: 'none' } as any}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline={false}
              maxLength={2000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend || sending}
              className={`h-10 w-10 items-center justify-center rounded-full bg-brandPrimary shadow-sm ${
                !canSend || sending ? 'opacity-50' : ''
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Feather name="arrow-up" size={18} color={Colors.white} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
