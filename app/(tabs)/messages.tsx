import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { threads as threadsApi } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';
import { Header } from '../../components/Header';

// ---------------------------------------------------------------------------
// Types — shape from GET /threads?grouped_by=request
// ---------------------------------------------------------------------------
interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt?: string | null;
}

interface Participant {
  id: string;
  email?: string;
  role?: string;
  specialistProfile?: {
    nick?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface GroupThread {
  id: string;
  participant1?: Participant | null;
  participant2?: Participant | null;
  lastMessage: LastMessage | null;
  lastMessageAt?: string | null;
  createdAt: string;
}

interface ThreadGroup {
  request: {
    id: string;
    title: string;
    description?: string | null;
    city?: string | null;
    status?: string | null;
    createdAt?: string | null;
  };
  threads: GroupThread[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function specialistOfThread(t: GroupThread, currentUserId: string | undefined): Participant | null {
  if (!currentUserId) return t.participant2 ?? t.participant1 ?? null;
  if (t.participant1?.id && t.participant1.id !== currentUserId) return t.participant1;
  if (t.participant2?.id && t.participant2.id !== currentUserId) return t.participant2;
  return null;
}

function displayName(p: Participant | null): string {
  if (!p) return 'Специалист';
  return (
    p.specialistProfile?.displayName ||
    p.specialistProfile?.nick ||
    p.email ||
    'Специалист'
  );
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

function isUnreadForMe(t: GroupThread, currentUserId: string | undefined): boolean {
  const msg = t.lastMessage;
  if (!msg || !currentUserId) return false;
  if (msg.senderId === currentUserId) return false;
  return !msg.readAt;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
function ThreadRow({
  thread,
  currentUserId,
  onPress,
}: {
  thread: GroupThread;
  currentUserId: string | undefined;
  onPress: () => void;
}) {
  const other = specialistOfThread(thread, currentUserId);
  const name = displayName(other);
  const initials = initialsOf(name);
  const last = thread.lastMessage;
  const preview = last?.content ?? 'Нет сообщений';
  const when = formatTime(thread.lastMessageAt ?? last?.createdAt ?? thread.createdAt);
  const unread = isUnreadForMe(thread, currentUserId);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        backgroundColor: Colors.bgCard,
        borderRadius: BorderRadius.card,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.sm,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: Colors.bgSurface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>{initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: unread ? Typography.fontWeight.bold : Typography.fontWeight.medium,
              color: Colors.textPrimary,
            }}
          >
            {name}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{when}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text
            style={{
              flex: 1,
              fontSize: Typography.fontSize.sm,
              color: unread ? Colors.textPrimary : Colors.textMuted,
              fontWeight: unread ? Typography.fontWeight.medium : undefined,
            }}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {unread && (
            <View
              style={{
                backgroundColor: Colors.brandPrimary,
                minWidth: 10,
                height: 10,
                borderRadius: 5,
              }}
            />
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function GroupSection({
  group,
  currentUserId,
  onOpenThread,
}: {
  group: ThreadGroup;
  currentUserId: string | undefined;
  onOpenThread: (threadId: string) => void;
}) {
  const count = group.threads.length;
  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }} numberOfLines={2}>
          {group.request.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {group.request.city ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="map-pin" size={11} color={Colors.textMuted} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>{group.request.city}</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>
            {count} {count === 1 ? 'специалист' : count >= 2 && count <= 4 ? 'специалиста' : 'специалистов'}
          </Text>
        </View>
      </View>
      <View style={{ gap: Spacing.sm }}>
        {group.threads.map((t) => (
          <ThreadRow
            key={t.id}
            thread={t}
            currentUserId={currentUserId}
            onPress={() => onOpenThread(t.id)}
          />
        ))}
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
      <View style={{ height: 28, width: '40%', backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 72, backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.card }} />
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['3xl'] }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.bgSurface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Feather name="message-circle" size={36} color={Colors.brandPrimary} />
      </View>
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>
        У вас пока нет сообщений
      </Text>
      <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 300 }}>
        Когда специалисты напишут по вашим заявкам, диалоги появятся здесь.
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['3xl'] }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.statusBg.error,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="alert-triangle" size={36} color={Colors.statusError} />
      </View>
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>
        Ошибка загрузки
      </Text>
      <Pressable
        onPress={onRetry}
        style={{
          height: 44,
          paddingHorizontal: Spacing['2xl'],
          borderRadius: BorderRadius.btn,
          backgroundColor: Colors.brandPrimary,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        }}
      >
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>
          Повторить
        </Text>
      </Pressable>
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<ThreadGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await threadsApi.getThreadsGroupedByRequest();
      const data = (res.data ?? []) as ThreadGroup[];
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!groups) return [];
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        threads: g.threads.filter((t) => {
          const other = specialistOfThread(t, user?.id);
          const name = displayName(other).toLowerCase();
          const preview = (t.lastMessage?.content ?? '').toLowerCase();
          const title = g.request.title.toLowerCase();
          return name.includes(q) || preview.includes(q) || title.includes(q);
        }),
      }))
      .filter((g) => g.threads.length > 0);
  }, [groups, search, user?.id]);

  const totalUnread = useMemo(() => {
    if (!groups) return 0;
    let sum = 0;
    for (const g of groups) for (const t of g.threads) if (isUnreadForMe(t, user?.id)) sum++;
    return sum;
  }, [groups, user?.id]);

  if (loading) return <View style={{ flex: 1 }}><Header variant="auth" /><LoadingState /></View>;
  if (error) return <View style={{ flex: 1 }}><Header variant="auth" /><ErrorState onRetry={load} /></View>;

  return (
    <View style={{ flex: 1 }}>
    <Header variant="auth" />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>
          Сообщения
        </Text>
        {totalUnread > 0 && (
          <View
            style={{
              backgroundColor: Colors.brandPrimary,
              minWidth: 24,
              height: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white }}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {(groups?.length ?? 0) > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            height: 40,
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: BorderRadius.card,
            paddingHorizontal: Spacing.md,
          }}
        >
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по сообщениям..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, paddingVertical: 0, outlineStyle: 'none' } as any}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      ) : null}

      {(groups?.length ?? 0) === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>Ничего не найдено</Text>
        </View>
      ) : (
        filtered.map((g) => (
          <GroupSection
            key={g.request.id}
            group={g}
            currentUserId={user?.id}
            onOpenThread={(id) => router.push(`/chat/${id}` as any)}
          />
        ))
      )}
    </ScrollView>
    </View>
  );
}
