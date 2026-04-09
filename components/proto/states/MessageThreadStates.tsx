import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_MESSAGES } from '../../../constants/protoMockData';

function ChatHeader() {
  return (
    <View style={s.chatHeader}>
      <Text style={s.backArrow}>{'<'}</Text>
      <View style={s.chatAvatar}><Text style={s.chatAvatarText}>А</Text></View>
      <View>
        <Text style={s.chatName}>Алексей Петров</Text>
        <Text style={s.chatStatus}>Онлайн</Text>
      </View>
    </View>
  );
}

function MessageBubble({ text, fromMe, time }: { text: string; fromMe: boolean; time: string }) {
  return (
    <View style={[s.bubbleWrap, fromMe ? s.bubbleRight : s.bubbleLeft]}>
      <View style={[s.bubble, fromMe ? s.bubbleMine : s.bubbleTheirs]}>
        <Text style={[s.bubbleText, fromMe ? s.bubbleTextMine : null]}>{text}</Text>
        <Text style={[s.bubbleTime, fromMe ? s.bubbleTimeMine : null]}>{time}</Text>
      </View>
    </View>
  );
}

function InputBar({ typing }: { typing?: boolean }) {
  return (
    <View style={s.inputBar}>
      {typing && <Text style={s.typingIndicator}>Алексей печатает...</Text>}
      <View style={s.inputRow}>
        <TextInput
          value=""
          editable={false}
          placeholder="Введите сообщение..."
          placeholderTextColor={Colors.textMuted}
          style={s.chatInput}
        />
        <View style={s.sendBtn}><Text style={s.sendText}>{'>'}</Text></View>
      </View>
    </View>
  );
}

export function MessageThreadStates() {
  return (
    <>
      <StateSection title="CHAT">
        <View style={s.container}>
          <ChatHeader />
          <View style={s.messages}>
            {MOCK_MESSAGES.map((m) => (
              <MessageBubble key={m.id} text={m.text} fromMe={m.fromMe} time={m.time} />
            ))}
          </View>
          <InputBar />
        </View>
      </StateSection>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <ChatHeader />
          <View style={s.emptyChat}>
            <Text style={s.emptyChatText}>Начните диалог с Алексеем Петровым</Text>
          </View>
          <InputBar />
        </View>
      </StateSection>
      <StateSection title="TYPING_INDICATOR">
        <View style={s.container}>
          <ChatHeader />
          <View style={s.messages}>
            {MOCK_MESSAGES.slice(0, 3).map((m) => (
              <MessageBubble key={m.id} text={m.text} fromMe={m.fromMe} time={m.time} />
            ))}
          </View>
          <InputBar typing />
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  backArrow: { fontSize: Typography.fontSize.lg, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.bold },
  chatAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  chatName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  chatStatus: { fontSize: Typography.fontSize.xs, color: Colors.statusSuccess },
  messages: { padding: Spacing.md, gap: Spacing.sm },
  bubbleWrap: { flexDirection: 'row' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleMine: { backgroundColor: Colors.brandPrimary, borderBottomRightRadius: BorderRadius.sm },
  bubbleTheirs: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: BorderRadius.sm },
  bubbleText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: '#FFF' },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  chatInput: {
    flex: 1, height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.sm, color: Colors.textPrimary,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendText: { fontSize: Typography.fontSize.md, color: '#FFF', fontWeight: Typography.fontWeight.bold },
  typingIndicator: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs, fontStyle: 'italic' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  emptyChatText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
