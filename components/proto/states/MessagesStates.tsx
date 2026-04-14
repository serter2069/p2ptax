import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_THREADS } from '../../../constants/protoMockData';

function ThreadItem({ name, lastMessage, time, unread, selected, onPress }: {
  name: string; lastMessage: string; time: string; unread: number; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.thread, selected ? s.threadSelected : null]}>
      <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/44/44` }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      <View style={s.threadBody}>
        <View style={s.threadTop}>
          <Text style={[s.threadName, unread > 0 ? s.threadNameBold : null]}>{name}</Text>
          <Text style={s.threadTime}>{time}</Text>
        </View>
        <View style={s.threadBottom}>
          <Text style={[s.threadMsg, unread > 0 ? s.threadMsgBold : null]} numberOfLines={1}>{lastMessage}</Text>
          {unread > 0 && (
            <View style={s.unreadBadge}><Text style={s.unreadText}>{unread}</Text></View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function InteractiveMessages() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Сообщения</Text>
        <View style={s.unreadCountBadge}>
          <Text style={s.unreadCountText}>{MOCK_THREADS.reduce((sum, t) => sum + t.unread, 0)}</Text>
        </View>
      </View>
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
    </View>
  );
}

export function MessagesStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveMessages />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  unreadCountBadge: {
    backgroundColor: Colors.brandPrimary, minWidth: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadCountText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  thread: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  threadSelected: { backgroundColor: Colors.bgSecondary, borderColor: Colors.brandPrimary },
  threadBody: { flex: 1, gap: 2 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  threadNameBold: { fontWeight: Typography.fontWeight.bold },
  threadTime: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  threadBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  threadMsg: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  threadMsgBold: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium },
  unreadBadge: {
    backgroundColor: Colors.brandPrimary, minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, fontWeight: Typography.fontWeight.bold, color: Colors.white },
});
