import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { useChat, type ChatMessage } from '../../lib/hooks/useChat';
import { getAccessToken } from '../../lib/api/storage';
import { users, threads } from '../../lib/api/endpoints';

// ---------------------------------------------------------------------------
// ChatHeader
// ---------------------------------------------------------------------------
function ChatHeader({ name, online }: { name: string; online: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgCard, ...Shadows.sm }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>{initials}</Text>
        {online && <View style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.statusSuccess, borderWidth: 2, borderColor: Colors.bgCard }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>{name}</Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: online ? Colors.statusSuccess : Colors.textMuted }}>{online ? 'Онлайн' : 'Был(а) 15 мин назад'}</Text>
      </View>
      <Pressable style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="more-vertical" size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------
function MessageBubble({ msg, myId }: { msg: ChatMessage; myId: string | undefined }) {
  const fromMe = msg.senderId === myId;
  const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
  const read = !!msg.readAt;
  return (
    <View style={{ flexDirection: 'row', justifyContent: fromMe ? 'flex-end' : 'flex-start', marginVertical: 2 }}>
      <View style={{ maxWidth: '78%', padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: fromMe ? Colors.brandPrimary : Colors.bgCard, borderWidth: fromMe ? 0 : 1, borderColor: Colors.border, borderBottomRightRadius: fromMe ? BorderRadius.sm : BorderRadius.lg, borderBottomLeftRadius: fromMe ? BorderRadius.lg : BorderRadius.sm }}>
        {msg.content ? <Text style={{ fontSize: Typography.fontSize.sm, color: fromMe ? Colors.white : Colors.textPrimary, lineHeight: 20 }}>{msg.content}</Text> : null}
        {msg.attachmentUrl && (
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.xs, backgroundColor: fromMe ? 'rgba(255,255,255,0.12)' : Colors.bgSurface }}>
            <View style={{ width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: fromMe ? 'rgba(255,255,255,0.15)' : Colors.statusBg.error }}>
              <Feather name={msg.attachmentType === 'pdf' ? 'file-text' : 'image'} size={18} color={fromMe ? Colors.white : Colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: fromMe ? Colors.white : Colors.textPrimary }} numberOfLines={1}>{msg.attachmentName ?? 'Файл'}</Text>
            </View>
            <Feather name="download" size={14} color={fromMe ? 'rgba(255,255,255,0.6)' : Colors.textMuted} />
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: fromMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted }}>{time}</Text>
          {fromMe && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="check" size={10} color={read ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'} />
              <Feather name="check" size={10} color={read ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'} style={{ marginLeft: -6 }} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginVertical: 2 }}>
      <View style={{ maxWidth: '78%', padding: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: BorderRadius.sm }}>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted, opacity: 0.6 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted, opacity: 0.3 }} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SkeletonBubble — loading placeholder
// ---------------------------------------------------------------------------
function SkeletonBubble({ fromMe }: { fromMe: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: fromMe ? 'flex-end' : 'flex-start', marginVertical: 4 }}>
      <View style={{ width: fromMe ? 180 : 140, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.bgSurface, opacity: 0.6 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
      <Feather name="message-circle" size={36} color={Colors.textMuted} style={{ marginBottom: Spacing.md }} />
      <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>Напишите первое сообщение</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const threadId = rawId ?? '';

  const [inputText, setInputText] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | undefined>(undefined);
  const markedReadRef = useRef(false);

  // Load token + current user id
  useEffect(() => {
    getAccessToken().then((t) => setToken(t));
    users.getMe().then((res) => {
      const me = (res as any).data ?? res;
      setMyId(me?.id);
    }).catch(() => {});
  }, []);

  const {
    messages,
    loading,
    loadError,
    sending,
    typingVisible,
    hasMore,
    loadingMore,
    sendMessage,
    loadMore,
    reload,
  } = useChat({ threadId: threadId || undefined, userId: myId, token });

  // Mark thread as read on open
  useEffect(() => {
    if (!threadId || markedReadRef.current) return;
    markedReadRef.current = true;
    threads.markRead(threadId).catch(() => {});
  }, [threadId]);

  // Mark thread as read when a new inbound message arrives
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && threadId) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== myId) {
        threads.markRead(threadId).catch(() => {});
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, threadId, myId]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    try { await sendMessage(text); } catch { /* ignore */ }
  }, [inputText, sendMessage]);

  // FlatList inverted: newest at bottom, data reversed so index 0 = newest
  const reversedMessages = [...messages].reverse();

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble msg={item} myId={myId} />
  ), [myId]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) loadMore();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <Header variant="back" backTitle="Чат" onBack={() => router.back()} />
      <ChatHeader name="Чат" online={false} />

      {loading ? (
        <View style={{ flex: 1, padding: Spacing.md }}>
          <SkeletonBubble fromMe={false} />
          <SkeletonBubble fromMe={true} />
          <SkeletonBubble fromMe={false} />
        </View>
      ) : loadError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
          <Feather name="alert-circle" size={24} color={Colors.statusError} />
          <Text style={{ color: Colors.statusError }}>Не удалось загрузить сообщения</Text>
          <Pressable onPress={reload} style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md }}>
            <Text style={{ color: Colors.white, fontSize: Typography.fontSize.sm }}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reversedMessages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.xs, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState />}
          ListHeaderComponent={typingVisible ? <TypingIndicator /> : null}
          ListFooterComponent={loadingMore ? (
            <View style={{ paddingVertical: Spacing.md, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
            </View>
          ) : null}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
        />
      )}

      <View style={{ padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
          <Pressable style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="paperclip" size={18} color={Colors.textMuted} />
          </Pressable>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Введите сообщение..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, outlineStyle: 'none' } as any}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !inputText.trim()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center', opacity: (inputText.trim() && !sending) ? 1 : 0.5, ...Shadows.sm }}
          >
            <Feather name="arrow-up" size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
