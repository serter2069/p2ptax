import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_THREADS } from '../../constants/protoMockData';

function ThreadItem({ name, lastMessage, time, unread, selected, onPress }: {
  name: string; lastMessage: string; time: string; unread: number; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 border-b border-bgSecondary py-3 ${selected ? 'rounded-lg bg-bgSecondary' : ''}`}
      style={selected ? { marginHorizontal: -16, paddingHorizontal: 16 } : undefined}
    >
      <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/44/44` }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      <View className="flex-1" style={{ gap: 2 }}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${unread > 0 ? 'font-bold' : 'font-medium'} text-textPrimary`}>{name}</Text>
          <Text className="text-xs text-textMuted">{time}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className={`flex-1 text-xs ${unread > 0 ? 'font-medium text-textPrimary' : 'text-textMuted'}`} numberOfLines={1}>{lastMessage}</Text>
          {unread > 0 && (
            <View className="items-center justify-center rounded-full bg-brandPrimary" style={{ minWidth: 20, height: 20, paddingHorizontal: 5 }}>
              <Text className="font-bold text-white" style={{ fontSize: 11 }}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Text className="mb-2 text-lg font-bold text-textPrimary">Сообщения</Text>
        {MOCK_THREADS.map((t) => (
          <ThreadItem
            key={t.id}
            name={t.name}
            lastMessage={t.lastMessage}
            time={t.time}
            unread={t.unread}
            selected={selectedId === t.id}
            onPress={() => setSelectedId(selectedId === t.id ? null : t.id)}
          />
        ))}
        {selectedId && (
          <View className="mt-2 rounded-lg bg-bgSecondary p-3">
            <Text className="text-sm font-medium text-brandPrimary">
              Открыт чат с: {MOCK_THREADS.find((t) => t.id === selectedId)?.name}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
