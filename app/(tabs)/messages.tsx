import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { threads as threadsApi } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';
import { Header } from '../../components/Header';
import {
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Input,
  Screen,
  Text,
} from '../../components/ui';

// ---------------------------------------------------------------------------
// Types
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
    <Card onPress={onPress} padding="sm" variant="outlined">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
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
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: Typography.fontWeight.bold,
              color: Colors.brandPrimary,
              fontFamily: Typography.fontFamily.bold,
            }}
          >
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="body" weight={unread ? 'bold' : 'medium'} numberOfLines={1}>{name}</Text>
            <Text variant="caption">{when}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Text
              variant="caption"
              weight={unread ? 'medium' : undefined}
              style={{ flex: 1, color: unread ? Colors.textPrimary : Colors.textMuted }}
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
      </View>
    </Card>
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
        <Text variant="body" weight="semibold" numberOfLines={2}>{group.request.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {group.request.city ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Feather name="map-pin" size={11} color={Colors.textMuted} />
              <Text variant="caption">{group.request.city}</Text>
            </View>
          ) : null}
          <Text variant="caption">
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
    <Container>
      <View style={{ gap: Spacing.md, paddingVertical: Spacing.lg }}>
        <View style={{ height: 28, width: '40%', backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ height: 72, backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.card }} />
        ))}
        <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
          <ActivityIndicator size="small" color={Colors.brandPrimary} />
        </View>
      </View>
    </Container>
  );
}

function MessagesEmpty() {
  return (
    <EmptyState
      icon={
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
      }
      title="У вас пока нет сообщений"
      description="Когда специалисты напишут по вашим заявкам, диалоги появятся здесь."
    />
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={
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
      }
      title="Ошибка загрузки"
      action={
        <Button
          variant="primary"
          size="lg"
          icon={<Feather name="refresh-cw" size={16} color={Colors.white} />}
          onPress={onRetry}
        >
          Повторить
        </Button>
      }
    />
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

  if (loading) return <Screen><Header variant="auth" /><LoadingState /></Screen>;
  if (error) {
    return (
      <Screen>
        <Header variant="auth" />
        <Container>
          <ErrorState onRetry={load} />
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header variant="auth" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Heading level={3}>Сообщения</Heading>
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
                  <Text
                    style={{
                      fontSize: Typography.fontSize.xs,
                      fontWeight: Typography.fontWeight.bold,
                      color: Colors.white,
                      fontFamily: Typography.fontFamily.bold,
                    }}
                  >
                    {totalUnread}
                  </Text>
                </View>
              )}
            </View>

            {(groups?.length ?? 0) > 0 ? (
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Поиск по сообщениям..."
                icon={<Feather name="search" size={16} color={Colors.textMuted} />}
                rightIcon={search.length > 0 ? (
                  <Pressable onPress={() => setSearch('')}>
                    <Feather name="x" size={16} color={Colors.textMuted} />
                  </Pressable>
                ) : undefined}
              />
            ) : null}

            {(groups?.length ?? 0) === 0 ? (
              <MessagesEmpty />
            ) : filtered.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
                <Text variant="muted">Ничего не найдено</Text>
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
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
