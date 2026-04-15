import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_MESSAGES, MockMessage } from '../../constants/protoMockData';

function ChatHeader({ name, online }: { name: string; online: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <View className="flex-row items-center gap-3 border-b border-borderLight bg-white px-4 py-3 shadow-sm">
      <Pressable className="h-9 w-9 items-center justify-center rounded-full">
        <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
      </Pressable>
      <View className="relative h-9 w-9 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Text className="text-xs font-bold text-brandPrimary">{initials}</Text>
        {online && <View className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-statusSuccess" />}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-textPrimary">{name}</Text>
        <Text className={`text-xs ${online ? 'text-statusSuccess' : 'text-textMuted'}`}>
          {online ? 'Онлайн' : 'Был(а) 15 мин назад'}
        </Text>
      </View>
      <Pressable className="h-9 w-9 items-center justify-center">
        <Feather name="more-vertical" size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

function FileAttachment({ name, size, type, fromMe }: { name: string; size: string; type: 'pdf' | 'image'; fromMe: boolean }) {
  return (
    <Pressable className={`mt-1 flex-row items-center gap-2 rounded-lg p-2 ${fromMe ? 'bg-white/10' : 'bg-bgSurface'}`}>
      <View className={`h-9 w-9 items-center justify-center rounded-lg ${fromMe ? 'bg-white/15' : type === 'pdf' ? 'bg-red-50' : 'bg-bgSurface'}`}>
        <Feather name={type === 'pdf' ? 'file-text' : 'image'} size={18} color={fromMe ? Colors.white : type === 'pdf' ? Colors.statusError : Colors.brandPrimary} />
      </View>
      <View className="flex-1">
        <Text className={`text-xs font-medium ${fromMe ? 'text-white' : 'text-textPrimary'}`} numberOfLines={1}>{name}</Text>
        <Text className={`text-[10px] ${fromMe ? 'text-white/60' : 'text-textMuted'}`}>{size}</Text>
      </View>
      <Feather name="download" size={14} color={fromMe ? 'rgba(255,255,255,0.6)' : Colors.textMuted} />
    </Pressable>
  );
}

function MessageBubble({ msg }: { msg: MockMessage }) {
  const { text, fromMe, time, read, attachment } = msg;
  return (
    <View className={`flex-row ${fromMe ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[78%] rounded-2xl p-3 ${fromMe ? 'rounded-br-sm bg-brandPrimary' : 'rounded-bl-sm border border-borderLight bg-white'}`}>
        {text ? <Text className={`text-sm leading-5 ${fromMe ? 'text-white' : 'text-textPrimary'}`}>{text}</Text> : null}
        {attachment && (
          <FileAttachment name={attachment.name} size={attachment.size} type={attachment.type} fromMe={fromMe} />
        )}
        <View className="mt-1 flex-row items-center justify-end gap-1">
          <Text className={`text-[10px] ${fromMe ? 'text-white/70' : 'text-textMuted'}`}>{time}</Text>
          {fromMe && (
            <View className="flex-row items-center">
              <Feather name="check" size={10} color={read ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'} />
              <Feather name="check" size={10} color={read ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'} style={{ marginLeft: -6 }} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View className="flex-row justify-start">
      <View className="rounded-2xl rounded-bl-sm border border-borderLight bg-white px-3 py-2">
        <View className="flex-row items-center gap-1">
          <View className="h-1.5 w-1.5 rounded-full bg-textMuted" />
          <View className="h-1.5 w-1.5 rounded-full bg-textMuted opacity-60" />
          <View className="h-1.5 w-1.5 rounded-full bg-textMuted opacity-30" />
        </View>
      </View>
    </View>
  );
}

function AttachmentPopup({ onClose }: { onClose: () => void }) {
  const options = [
    { icon: 'file-text' as const, label: 'Документ' },
    { icon: 'image' as const, label: 'Фото' },
    { icon: 'camera' as const, label: 'Камера' },
  ];
  return (
    <View className="absolute bottom-0 left-0 right-0 z-10">
      <Pressable className="absolute -top-[500px] bottom-0 left-0 right-0" onPress={onClose} />
      <View className="mx-4 mb-2 rounded-xl border border-borderLight bg-white p-4 shadow-lg">
        <Text className="mb-3 text-sm font-semibold text-textPrimary">Прикрепить файл</Text>
        <View className="flex-row gap-6">
          {options.map((opt) => (
            <Pressable key={opt.label} className="items-center gap-1">
              <View className="h-12 w-12 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
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

export default function ChatPage() {
  const [messages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showAttach, setShowAttach] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setInputText('');
  };

  return (
    <View className="flex-1 bg-white">
      <ChatHeader name="Алексей Петров" online={true} />
      <View className="items-center py-2 px-4">
        <Text className="rounded-full bg-bgSurface px-3 py-1 text-xs text-textMuted">
          Заявка: Камеральная проверка декларации по НДС
        </Text>
      </View>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 4, paddingVertical: 8 }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        <TypingIndicator />
      </ScrollView>
      <View className="relative">
        {showAttach && <AttachmentPopup onClose={() => setShowAttach(false)} />}
        <View className="border-t border-borderLight bg-white p-3">
          <View className="flex-row items-center gap-2">
            <Pressable className="h-9 w-9 items-center justify-center" onPress={() => setShowAttach(!showAttach)}>
              <Feather name="paperclip" size={18} color={showAttach ? Colors.brandPrimary : Colors.textMuted} />
            </Pressable>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Введите сообщение..."
              placeholderTextColor={Colors.textMuted}
              className="h-10 flex-1 rounded-full border border-borderLight bg-bgPrimary px-4 text-sm text-textPrimary"
              style={{ outlineStyle: 'none' } as any}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable onPress={handleSend} className={`h-10 w-10 items-center justify-center rounded-full bg-brandPrimary shadow-sm ${!inputText.trim() ? 'opacity-50' : ''}`}>
              <Feather name="arrow-up" size={18} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
