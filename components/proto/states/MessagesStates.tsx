import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
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
    </Pressable>
  );
}

function InteractiveMessages() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Сообщения</Text>
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
        <View style={s.preview}>
          <Text style={s.previewText}>Открыт чат с: {MOCK_THREADS.find((t) => t.id === selectedId)?.name}</Text>
        </View>
      )}
    </View>
  );
}

export function MessagesStates() {
  return (
    <>
      <StateSection title="INTERACTIVE">
        <InteractiveMessages />
      </StateSection>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <Text style={s.pageTitle}>Сообщения</Text>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет сообщений</Text>
            <Text style={s.emptyText}>Сообщения появятся после принятия отклика специалиста</Text>
          </View>
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  thread: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  threadSelected: { backgroundColor: Colors.bgSecondary, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  threadBody: { flex: 1, gap: 2 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  threadNameBold: { fontWeight: Typography.fontWeight.bold },
  threadTime: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  threadBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  threadMsg: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  threadMsgBold: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium },
  unreadBadge: {
    backgroundColor: Colors.brandPrimary, minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  preview: {
    backgroundColor: Colors.bgSecondary, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  previewText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
