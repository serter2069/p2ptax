import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_THREADS } from '../../../constants/protoMockData';

function ThreadItem({ name, lastMessage, time, unread }: {
  name: string; lastMessage: string; time: string; unread: number;
}) {
  return (
    <View style={s.thread}>
      <View style={s.avatar}><Text style={s.avatarText}>{name[0]}</Text></View>
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
    </View>
  );
}

export function MessagesStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <Text style={s.pageTitle}>Сообщения</Text>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет сообщений</Text>
            <Text style={s.emptyText}>Сообщения появятся после принятия отклика специалиста</Text>
          </View>
        </View>
      </StateSection>
      <StateSection title="THREAD_LIST">
        <View style={s.container}>
          <Text style={s.pageTitle}>Сообщения</Text>
          {MOCK_THREADS.map((t) => (
            <ThreadItem key={t.id} name={t.name} lastMessage={t.lastMessage} time={t.time} unread={t.unread} />
          ))}
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
  unreadText: { fontSize: 11, fontWeight: Typography.fontWeight.bold, color: '#FFF' },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
