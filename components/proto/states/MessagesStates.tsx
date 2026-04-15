import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_THREADS } from '../../../constants/protoMockData';

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function ThreadItem({ name, lastMessage, time, unread, selected, onPress }: {
  name: string; lastMessage: string; time: string; unread: number; selected: boolean; onPress: () => void;
}) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <Pressable onPress={onPress} style={[s.thread, selected && s.threadSelected]}>
      <View style={s.threadAvatar}>
        <Text style={s.threadAvatarText}>{initials}</Text>
      </View>
      <View style={s.threadBody}>
        <View style={s.threadTop}>
          <Text style={[s.threadName, unread > 0 && s.threadNameBold]}>{name}</Text>
          <Text style={s.threadTime}>{time}</Text>
        </View>
        <View style={s.threadBottom}>
          <Text style={[s.threadMsg, unread > 0 && s.threadMsgBold]} numberOfLines={1}>{lastMessage}</Text>
          {unread > 0 && (
            <View style={s.unreadBadge}><Text style={s.unreadText}>{unread}</Text></View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (interactive with search)
// ---------------------------------------------------------------------------

function DefaultMessages() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const filtered = search
    ? MOCK_THREADS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase()))
    : MOCK_THREADS;
  const totalUnread = MOCK_THREADS.reduce((sum, t) => sum + t.unread, 0);

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Сообщения</Text>
        {totalUnread > 0 && (
          <View style={s.unreadCountBadge}>
            <Text style={s.unreadCountText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по сообщениям..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={s.searchEmpty}>
          <Text style={s.searchEmptyText}>Ничего не найдено</Text>
        </View>
      ) : (
        filtered.map((t) => (
          <ThreadItem
            key={t.id}
            name={t.name}
            lastMessage={t.lastMessage}
            time={t.time}
            unread={t.unread}
            selected={selectedId === t.id}
            onPress={() => setSelectedId(selectedId === t.id ? null : t.id)}
          />
        ))
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingMessages() {
  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <SkeletonBlock width="40%" height={22} />
        <SkeletonBlock width={28} height={28} radius={14} />
      </View>
      <SkeletonBlock width="100%" height={40} radius={BorderRadius.card} />
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={s.skeletonThread}>
          <SkeletonBlock width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonBlock width="50%" height={14} />
              <SkeletonBlock width={40} height={12} />
            </View>
            <SkeletonBlock width="70%" height={12} />
          </View>
        </View>
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY
// ---------------------------------------------------------------------------

function EmptyMessages() {
  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Сообщения</Text>
      </View>
      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="message-circle" size={36} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Нет сообщений</Text>
        <Text style={s.emptyText}>Когда специалист примет вашу заявку, вы сможете обсудить детали в чате</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorMessages() {
  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Сообщения</Text>
      </View>
      <View style={s.emptyBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="wifi-off" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.emptyTitle}>Нет подключения</Text>
        <Text style={s.emptyText}>Не удалось загрузить сообщения. Проверьте интернет.</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MessagesStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultMessages />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingMessages />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyMessages />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorMessages />
      </StateSection>
    </>
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

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 40, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.md, marginBottom: Spacing.xs,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, paddingVertical: 0, outlineStyle: 'none' as any },
  searchEmpty: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  searchEmptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Thread
  thread: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  threadSelected: { backgroundColor: Colors.bgSecondary, borderColor: Colors.brandPrimary },
  threadAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  threadAvatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
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

  // Empty
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // Error
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Skeleton
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7, borderRadius: BorderRadius.md },
  skeletonThread: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border,
  },
});
