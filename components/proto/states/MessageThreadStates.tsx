import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_MESSAGES, MockMessage } from '../../../constants/protoMockData';

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function ChatHeader({ name, online }: { name: string; online: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <View style={s.chatHeader}>
      <Pressable style={s.backBtn}>
        <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
      </Pressable>
      <View style={s.headerAvatar}>
        <Text style={s.headerAvatarText}>{initials}</Text>
        {online && <View style={s.onlineDotAbsolute} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.chatName}>{name}</Text>
        <Text style={[s.chatStatus, online ? s.chatStatusOnline : null]}>
          {online ? 'Онлайн' : 'Был(а) 15 мин назад'}
        </Text>
      </View>
      <Pressable style={s.headerAction}>
        <Feather name="more-vertical" size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

function MessageBubble({ text, fromMe, time }: { text: string; fromMe: boolean; time: string }) {
  return (
    <View style={[s.bubbleWrap, fromMe ? s.bubbleRight : s.bubbleLeft]}>
      <View style={[s.bubble, fromMe ? s.bubbleMine : s.bubbleTheirs]}>
        <Text style={[s.bubbleText, fromMe && s.bubbleTextMine]}>{text}</Text>
        <View style={s.bubbleFooter}>
          <Text style={[s.bubbleTime, fromMe && s.bubbleTimeMine]}>{time}</Text>
          {fromMe && <Feather name="check" size={10} color="rgba(255,255,255,0.6)" />}
        </View>
      </View>
    </View>
  );
}

function SystemMessage({ text }: { text: string }) {
  return (
    <View style={s.systemMsg}>
      <Text style={s.systemMsgText}>{text}</Text>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[s.bubbleWrap, s.bubbleLeft]}>
      <View style={[s.bubble, s.bubbleTheirs, s.typingBubble]}>
        <View style={s.typingDots}>
          <View style={s.typingDot} />
          <View style={[s.typingDot, { opacity: 0.6 }]} />
          <View style={[s.typingDot, { opacity: 0.3 }]} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (interactive chat)
// ---------------------------------------------------------------------------

function DefaultChat() {
  const [messages, setMessages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), text: inputText.trim(), fromMe: true, time },
    ]);
    setInputText('');
  };

  return (
    <View style={s.container}>
      <ChatHeader name="Алексей Петров" online={true} />
      <SystemMessage text="Заявка: Декларация 3-НДФЛ за 2025 год" />
      <View style={s.messages}>
        {messages.map((m) => (
          <MessageBubble key={m.id} text={m.text} fromMe={m.fromMe} time={m.time} />
        ))}
        <TypingIndicator />
      </View>
      <View style={s.inputBar}>
        <View style={s.inputRow}>
          <Pressable style={s.attachBtn}>
            <Feather name="paperclip" size={18} color={Colors.textMuted} />
          </Pressable>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Введите сообщение..."
            placeholderTextColor={Colors.textMuted}
            style={s.chatInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable onPress={handleSend} style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]}>
            <Feather name="send" size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingChat() {
  return (
    <View style={s.container}>
      <View style={s.chatHeader}>
        <SkeletonBlock width={20} height={20} radius={4} />
        <SkeletonBlock width={36} height={36} radius={18} />
        <View style={{ flex: 1, gap: 4 }}>
          <SkeletonBlock width="50%" height={14} />
          <SkeletonBlock width="30%" height={12} />
        </View>
      </View>
      <View style={s.messages}>
        {/* Skeleton bubbles */}
        <View style={[s.bubbleWrap, s.bubbleRight]}>
          <SkeletonBlock width="65%" height={44} radius={BorderRadius.lg} />
        </View>
        <View style={[s.bubbleWrap, s.bubbleLeft]}>
          <SkeletonBlock width="70%" height={56} radius={BorderRadius.lg} />
        </View>
        <View style={[s.bubbleWrap, s.bubbleRight]}>
          <SkeletonBlock width="55%" height={36} radius={BorderRadius.lg} />
        </View>
        <View style={[s.bubbleWrap, s.bubbleLeft]}>
          <SkeletonBlock width="60%" height={48} radius={BorderRadius.lg} />
        </View>
      </View>
      <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
      <View style={s.inputBar}>
        <SkeletonBlock width="100%" height={40} radius={BorderRadius.full} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY (new conversation)
// ---------------------------------------------------------------------------

function EmptyChat() {
  return (
    <View style={s.container}>
      <ChatHeader name="Алексей Петров" online={false} />
      <SystemMessage text="Заявка: Декларация 3-НДФЛ за 2025 год" />
      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="message-circle" size={32} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Начните общение</Text>
        <Text style={s.emptyText}>Напишите специалисту, чтобы обсудить детали вашей заявки</Text>
      </View>
      <View style={s.inputBar}>
        <View style={s.inputRow}>
          <Pressable style={s.attachBtn}>
            <Feather name="paperclip" size={18} color={Colors.textMuted} />
          </Pressable>
          <TextInput
            placeholder="Введите сообщение..."
            placeholderTextColor={Colors.textMuted}
            style={s.chatInput}
          />
          <Pressable style={[s.sendBtn, s.sendBtnDisabled]}>
            <Feather name="send" size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorChat() {
  return (
    <View style={s.container}>
      <ChatHeader name="Алексей Петров" online={false} />
      <View style={s.emptyBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="wifi-off" size={32} color={Colors.statusError} />
        </View>
        <Text style={s.emptyTitle}>Нет подключения</Text>
        <Text style={s.emptyText}>Не удалось загрузить сообщения</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MessageThreadStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultChat />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingChat />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyChat />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorChat />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // Chat header
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgCard,
    ...Shadows.sm,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  headerAvatarText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  onlineDotAbsolute: {
    position: 'absolute', bottom: -1, right: -1,
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.statusSuccess,
    borderWidth: 2, borderColor: Colors.bgCard,
  },
  chatName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  chatStatus: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  chatStatusOnline: { color: Colors.statusSuccess },
  headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // System message
  systemMsg: { alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  systemMsgText: {
    fontSize: Typography.fontSize.xs, color: Colors.textMuted,
    backgroundColor: Colors.bgSurface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },

  // Messages
  messages: { padding: Spacing.md, gap: Spacing.xs },
  bubbleWrap: { flexDirection: 'row' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', padding: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleMine: { backgroundColor: Colors.brandPrimary, borderBottomRightRadius: BorderRadius.sm },
  bubbleTheirs: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: BorderRadius.sm },
  bubbleText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: Colors.white },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },

  // Typing indicator
  typingBubble: { paddingVertical: Spacing.sm },
  typingDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },

  // Input bar
  inputBar: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  attachBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  chatInput: {
    flex: 1, height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.sm, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
  },
  sendBtnDisabled: { opacity: 0.5 },

  // Empty
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 260 },

  // Error
  errorIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 40, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Skeleton
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7, borderRadius: BorderRadius.md },
});
