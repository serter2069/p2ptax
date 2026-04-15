import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_MESSAGES, MockMessage } from '../../constants/protoMockData';

function ChatHeader() {
  return (
    <View className="flex-row items-center gap-3 border-b border-border bg-bgCard px-4 py-3">
      <Text className="text-lg font-bold text-brandPrimary">{'<'}</Text>
      <Image source={{ uri: 'https://picsum.photos/seed/AlekseyPetrov/36/36' }} style={{ width: 36, height: 36, borderRadius: 18 }} />
      <View>
        <Text className="text-sm font-semibold text-textPrimary">Алексей Петров</Text>
        <Text className="text-xs text-statusSuccess">Онлайн</Text>
      </View>
    </View>
  );
}

function MessageBubble({ text, fromMe, time }: { text: string; fromMe: boolean; time: string }) {
  return (
    <View className={`flex-row ${fromMe ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`rounded-xl p-3 ${fromMe ? 'bg-brandPrimary' : 'border border-border bg-bgCard'}`}
        style={{ maxWidth: '80%', borderBottomRightRadius: fromMe ? 4 : 12, borderBottomLeftRadius: fromMe ? 12 : 4 }}
      >
        <Text className={`text-sm ${fromMe ? 'text-white' : 'text-textPrimary'}`} style={{ lineHeight: 20 }}>{text}</Text>
        <Text
          className="self-end"
          style={{ fontSize: 10, marginTop: 4, color: fromMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted }}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

export default function MessageThreadPage() {
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
    <View className="flex-1">
      <ChatHeader />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
        {messages.map((m, i) => (
          <View key={m.id}>
            <MessageBubble text={m.text} fromMe={m.fromMe} time={m.time} />
            {i === 1 && (
              <View className="px-3" style={{ marginTop: 4, marginBottom: 4 }}>
                <Image source={{ uri: 'https://picsum.photos/seed/chat-photo/160/100' }} style={{ width: 160, height: 100, borderRadius: 10 }} />
              </View>
            )}
            {i === 2 && (
              <View className="items-end px-3" style={{ marginTop: 4, marginBottom: 4 }}>
                <Image source={{ uri: 'https://picsum.photos/seed/doc-pdf/140/60' }} style={{ width: 140, height: 60, borderRadius: 8 }} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View className="border-t border-border bg-bgCard p-3">
        <View className="flex-row items-center gap-2">
          <Pressable className="h-9 w-9 items-center justify-center">
            <Feather name="paperclip" size={18} color={Colors.textMuted} />
          </Pressable>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Введите сообщение..."
            placeholderTextColor={Colors.textMuted}
            className="h-10 flex-1 rounded-full bg-bgPrimary px-4 text-sm text-textPrimary"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable onPress={handleSend} className="h-10 w-10 items-center justify-center rounded-full bg-brandPrimary">
            <Text className="text-base font-bold text-white">{'>'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
