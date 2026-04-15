import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { MOCK_THREADS } from '../../constants/protoMockData';

function ThreadItem({ name, lastMessage, time, unread, selected, onPress }: {
  name: string; lastMessage: string; time: string; unread: number; selected: boolean; onPress: () => void;
}) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, backgroundColor: selected ? Colors.bgSecondary : Colors.bgCard, borderRadius: BorderRadius.card, borderWidth: 1, borderColor: selected ? Colors.brandPrimary : Colors.border, ...Shadows.sm }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>{initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontWeight: unread > 0 ? Typography.fontWeight.bold : Typography.fontWeight.medium, color: Colors.textPrimary }}>{name}</Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: unread > 0 ? Colors.textPrimary : Colors.textMuted, fontWeight: unread > 0 ? Typography.fontWeight.medium : undefined }} numberOfLines={1}>{lastMessage}</Text>
          {unread > 0 && (
            <View style={{ backgroundColor: Colors.brandPrimary, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
              <Text style={{ fontSize: 11, fontWeight: Typography.fontWeight.bold, color: Colors.white }}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function MessagesScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const filtered = search
    ? MOCK_THREADS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase()))
    : MOCK_THREADS;
  const totalUnread = MOCK_THREADS.reduce((sum, t) => sum + t.unread, 0);

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>Сообщения</Text>
        {totalUnread > 0 && (
          <View style={{ backgroundColor: Colors.brandPrimary, minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white }}>{totalUnread}</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 40, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.md, marginBottom: Spacing.xs }}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Поиск по сообщениям..." placeholderTextColor={Colors.textMuted} style={{ flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, paddingVertical: 0, outlineStyle: 'none' } as any} />
        {search.length > 0 && (<Pressable onPress={() => setSearch('')}><Feather name="x" size={16} color={Colors.textMuted} /></Pressable>)}
      </View>
      {filtered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}><Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>Ничего не найдено</Text></View>
      ) : (
        filtered.map((t) => (
          <ThreadItem key={t.id} name={t.name} lastMessage={t.lastMessage} time={t.time} unread={t.unread} selected={selectedId === t.id} onPress={() => setSelectedId(selectedId === t.id ? null : t.id)} />
        ))
      )}
    </View>
  );
}
