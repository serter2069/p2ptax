import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { MOCK_MESSAGES, MockMessage } from '../../constants/protoMockData';

function ChatHeader({ name, online }: { name: string; online: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgCard, ...Shadows.sm }}>
      <Pressable style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Feather name="arrow-left" size={20} color={Colors.brandPrimary} /></Pressable>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>{initials}</Text>
        {online && <View style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.statusSuccess, borderWidth: 2, borderColor: Colors.bgCard }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>{name}</Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: online ? Colors.statusSuccess : Colors.textMuted }}>{online ? 'Онлайн' : 'Был(а) 15 мин назад'}</Text>
      </View>
      <Pressable style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Feather name="more-vertical" size={18} color={Colors.textMuted} /></Pressable>
    </View>
  );
}

function MessageBubble({ msg }: { msg: MockMessage }) {
  const { text, fromMe, time, read, attachment } = msg;
  return (
    <View style={{ flexDirection: 'row', justifyContent: fromMe ? 'flex-end' : 'flex-start' }}>
      <View style={{ maxWidth: '78%', padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: fromMe ? Colors.brandPrimary : Colors.bgCard, borderWidth: fromMe ? 0 : 1, borderColor: Colors.border, borderBottomRightRadius: fromMe ? BorderRadius.sm : BorderRadius.lg, borderBottomLeftRadius: fromMe ? BorderRadius.lg : BorderRadius.sm }}>
        {text ? <Text style={{ fontSize: Typography.fontSize.sm, color: fromMe ? Colors.white : Colors.textPrimary, lineHeight: 20 }}>{text}</Text> : null}
        {attachment && (
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.xs, backgroundColor: fromMe ? 'rgba(255,255,255,0.12)' : Colors.bgSurface }}>
            <View style={{ width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: fromMe ? 'rgba(255,255,255,0.15)' : Colors.statusBg.error }}>
              <Feather name={attachment.type === 'pdf' ? 'file-text' : 'image'} size={18} color={fromMe ? Colors.white : (attachment.type === 'pdf' ? Colors.statusError : Colors.brandPrimary)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: fromMe ? Colors.white : Colors.textPrimary }} numberOfLines={1}>{attachment.name}</Text>
              <Text style={{ fontSize: 10, color: fromMe ? 'rgba(255,255,255,0.6)' : Colors.textMuted, marginTop: 1 }}>{attachment.size}</Text>
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

function SystemMessage({ text }: { text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg }}>
      <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted, backgroundColor: Colors.bgSurface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, overflow: 'hidden' }}>{text}</Text>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
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

export default function ChatScreen() {
  const [messages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const handleSend = () => { if (!inputText.trim()) return; setInputText(''); };

  return (
    <View style={{ flex: 1 }}>
      <ChatHeader name="Алексей Петров" online={true} />
      <SystemMessage text="Заявка: Камеральная проверка декларации по НДС" />
      <View style={{ padding: Spacing.md, gap: Spacing.xs }}>
        {messages.map((m) => (<MessageBubble key={m.id} msg={m} />))}
        <TypingIndicator />
      </View>
      <View style={{ position: 'relative' }}>
        <View style={{ padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
            <Pressable style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Feather name="paperclip" size={18} color={Colors.textMuted} /></Pressable>
            <TextInput value={inputText} onChangeText={setInputText} placeholder="Введите сообщение..." placeholderTextColor={Colors.textMuted} style={{ flex: 1, height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, outlineStyle: 'none' } as any} onSubmitEditing={handleSend} returnKeyType="send" />
            <Pressable onPress={handleSend} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center', opacity: inputText.trim() ? 1 : 0.5, ...Shadows.sm }}><Feather name="arrow-up" size={18} color={Colors.white} /></Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
