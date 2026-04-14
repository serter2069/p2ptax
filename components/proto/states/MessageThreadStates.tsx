import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_MESSAGES, MockMessage } from '../../../constants/protoMockData';

function ChatHeader() {
  return (
    <View style={s.chatHeader}>
      <Pressable style={s.backBtn}>
        <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
      </Pressable>
      <Image source={{ uri: 'https://picsum.photos/seed/AlekseyPetrov/36/36' }} style={{ width: 36, height: 36, borderRadius: 18 }} />
      <View>
        <Text style={s.chatName}>Алексей Петров</Text>
        <View style={s.onlineRow}>
          <View style={s.onlineDot} />
          <Text style={s.chatStatus}>Онлайн</Text>
        </View>
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

function InteractiveChat({ initialMessages }: { initialMessages: MockMessage[] }) {
  const [messages, setMessages] = useState<MockMessage[]>(initialMessages);
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
      <ChatHeader />
      <View style={s.messages}>
        {messages.map((m, i) => (
          <View key={m.id}>
            <MessageBubble text={m.text} fromMe={m.fromMe} time={m.time} />
            {i === 1 && (
              <View style={s.attachmentWrap}>
                <Image source={{ uri: 'https://picsum.photos/seed/chat-photo/160/100' }} style={{ width: 160, height: 100, borderRadius: 10 }} />
              </View>
            )}
            {i === 2 && (
              <View style={[s.attachmentWrap, { alignItems: 'flex-end' }]}>
                <Image source={{ uri: 'https://picsum.photos/seed/doc-pdf/140/60' }} style={{ width: 140, height: 60, borderRadius: 8 }} />
              </View>
            )}
          </View>
        ))}
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
          <Pressable onPress={handleSend} style={s.sendBtn}>
            <Feather name="send" size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MessageThreadStates() {
  return (
    <StateSection title="INTERACTIVE_CHAT">
      <InteractiveChat initialMessages={MOCK_MESSAGES} />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgCard,
    ...Shadows.sm,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chatName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.statusSuccess },
  chatStatus: { fontSize: Typography.fontSize.sm, color: Colors.statusSuccess },
  messages: { padding: Spacing.md, gap: Spacing.sm },
  bubbleWrap: { flexDirection: 'row' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleMine: { backgroundColor: Colors.brandPrimary, borderBottomRightRadius: BorderRadius.sm },
  bubbleTheirs: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: BorderRadius.sm },
  bubbleText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextMine: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  attachmentWrap: { paddingHorizontal: Spacing.md, marginTop: 4, marginBottom: Spacing.xs },
  attachBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  inputBar: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  chatInput: {
    flex: 1, height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
  },
});
