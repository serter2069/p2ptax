import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_THREADS } from '../../constants/protoMockData';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const filtered = search
    ? MOCK_THREADS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase()))
    : MOCK_THREADS;
  const totalUnread = MOCK_THREADS.reduce((sum, t) => sum + t.unread, 0);

  return (
    <View className="flex-1 bg-white">
      <Header variant="auth" hasNotif />
      <View className="flex-1 p-4 gap-2">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-xl font-bold text-textPrimary">Сообщения</Text>
          {totalUnread > 0 && (
            <View className="min-w-[24px] h-6 items-center justify-center rounded-full bg-brandPrimary px-1.5">
              <Text className="text-xs font-bold text-white">{totalUnread}</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 h-10 rounded-xl border border-borderLight bg-white px-3 mb-1">
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по сообщениям..."
            placeholderTextColor={Colors.textMuted}
            className="flex-1 text-sm text-textPrimary"
            style={{ outlineStyle: 'none' } as any}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {filtered.map((t) => {
          const initials = t.name.split(' ').map(n => n[0]).join('');
          const selected = selectedId === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setSelectedId(selected ? null : t.id)}
              className={`flex-row items-center gap-3 rounded-xl border p-3 ${selected ? 'border-brandPrimary bg-bgSecondary' : 'border-borderLight bg-white'}`}
            >
              <View className="h-11 w-11 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
                <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center justify-between">
                  <Text className={`text-base ${t.unread > 0 ? 'font-bold' : 'font-medium'} text-textPrimary`}>{t.name}</Text>
                  <Text className="text-xs text-textMuted">{t.time}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className={`flex-1 text-sm ${t.unread > 0 ? 'font-medium text-textPrimary' : 'text-textMuted'}`} numberOfLines={1}>{t.lastMessage}</Text>
                  {t.unread > 0 && (
                    <View className="min-w-[20px] h-5 items-center justify-center rounded-full bg-brandPrimary px-1">
                      <Text className="text-xs font-bold text-white">{t.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
      <BottomNav activeId="messages" variant="client" />
    </View>
  );
}
