import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BorderRadius, Colors, Spacing } from '../../../constants/Colors';
import { requests, specialists as specialistsApi, threads as threadsApi } from '../../../lib/api/endpoints';
import { useAuth } from '../../../lib/auth';
import { Header } from '../../../components/Header';
import { adaptThread } from '../../../lib/types/thread';
import {
  Badge,
  BadgeVariant,
  Button,
  Card,
  Container,
  Heading,
  Screen,
  Text,
} from '../../../components/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestStatus =
  | 'ACTIVE'
  | 'CLOSING_SOON'
  | 'CLOSED';

interface SpecialistProfile {
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ThreadUser {
  id: string;
  email: string;
  specialistProfile: SpecialistProfile | null;
}

interface Thread {
  id: string;
  participant1Id: string;
  participant1: ThreadUser;
  participant2Id: string;
  participant2: ThreadUser;
  createdAt: string;
}

interface RequestDetail {
  id: string;
  clientId: string;
  title: string;
  description: string;
  city: string;
  ifnsName: string | null;
  serviceType: string | null;
  budget: number | null;
  category: string | null;
  status: RequestStatus;
  createdAt: string;
  lastActivityAt?: string;
  extensionsCount?: number;
  threads: Thread[];
  _count: { threads: number };
}

const MAX_EXTENSIONS = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLOSEABLE_STATUSES: RequestStatus[] = ['ACTIVE', 'CLOSING_SOON'];

const STATUS_LABELS: Record<RequestStatus, string> = {
  ACTIVE: 'Активная',
  CLOSING_SOON: 'Истекает скоро',
  CLOSED: 'Закрыта',
};

const STATUS_BADGE_VARIANT: Record<RequestStatus, BadgeVariant> = {
  ACTIVE: 'success',
  CLOSING_SOON: 'warning',
  CLOSED: 'default',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getSpecialist(thread: Thread, clientId: string): ThreadUser {
  // Derive via adapter so callers just read semantic aliases.
  // Backend row may carry both participant1/2 and a specialistId column.
  const adapted = adaptThread(thread as any, clientId);
  const specId = adapted.specialistId;
  return specId === thread.participant1Id ? thread.participant1 : thread.participant2;
}

function getInitials(name: string | null | undefined, email: string) {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ─── Recommended Specialists ─────────────────────────────────────────────────

interface SpecCardData {
  nick?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  cities?: string[];
  activity?: { avgRating?: number | null; reviewCount?: number; responseCount?: number };
}

function RecommendedSpecialists({ request }: { request: RequestDetail }) {
  const [items, setItems] = useState<SpecCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writingTo, setWritingTo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Try: ifnsName + city + category first; fall back to city only
    const primaryParams: Record<string, string> = { limit: '5' };
    if (request.city) primaryParams.city = request.city;
    if (request.ifnsName) primaryParams.fns = request.ifnsName;
    if (request.serviceType) primaryParams.category = request.serviceType;

    const run = async () => {
      try {
        let res = await specialistsApi.getSpecialists(primaryParams);
        let data: any = (res as any).data ?? res;
        let list: any[] = Array.isArray(data) ? data : (data.items ?? []);
        // Fallback to city-only if empty and we had extra filters
        if (list.length === 0 && (primaryParams.fns || primaryParams.category)) {
          const fb: Record<string, string> = { limit: '5' };
          if (request.city) fb.city = request.city;
          res = await specialistsApi.getSpecialists(fb);
          data = (res as any).data ?? res;
          list = Array.isArray(data) ? data : (data.items ?? []);
        }
        if (mounted) setItems(list.slice(0, 5));
      } catch (e: any) {
        if (mounted) setError('Не удалось загрузить специалистов');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [request.id, request.city, request.ifnsName, request.serviceType]);

  const handleWrite = useCallback(async (nick: string) => {
    if (writingTo) return;
    try {
      setWritingTo(nick);
      // Catalog response strips userId; fetch full profile by nick to get it
      const profileRes = await specialistsApi.getSpecialist(nick);
      const userId = (profileRes.data as any)?.userId;
      if (!userId) {
        Alert.alert('Ошибка', 'Не удалось определить специалиста');
        return;
      }
      const res = await threadsApi.startDirect({ otherUserId: userId, requestId: request.id });
      const threadId = (res.data as any)?.threadId ?? (res.data as any)?.thread_id;
      if (threadId) router.push(`/chat/${threadId}` as any);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Не удалось начать чат';
      Alert.alert('Ошибка', msg);
    } finally {
      setWritingTo(null);
    }
  }, [writingTo, request.id]);

  return (
    <View style={{ gap: Spacing.md }}>
      <Heading level={4}>Рекомендуемые специалисты</Heading>
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <Text variant="caption" style={{ color: Colors.statusError }}>{error}</Text>
      ) : items.length === 0 ? (
        <Card variant="outlined" padding="md">
          <Text variant="caption">Пока никого не нашли по этим параметрам</Text>
        </Card>
      ) : (
        items.map((s) => {
          const name = s.displayName ?? s.nick ?? 'Специалист';
          const initials = name.slice(0, 2).toUpperCase();
          const rating = s.activity?.avgRating;
          const city = (s.cities ?? [])[0];
          return (
            <Card key={s.nick ?? name} variant="outlined" padding="sm">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: Colors.borderLight,
                  backgroundColor: Colors.bgSurface,
                }}>
                  <Text weight="bold" style={{ color: Colors.brandPrimary, fontSize: 13 }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="semibold" numberOfLines={1}>{name}</Text>
                  <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    {rating != null ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="star" size={11} color={Colors.amber} />
                        <Text variant="caption">{Number(rating).toFixed(1)}</Text>
                      </View>
                    ) : null}
                    {city ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="map-pin" size={11} color={Colors.textMuted} />
                        <Text variant="caption" numberOfLines={1}>{city}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Button
                  size="md"
                  onPress={() => s.nick && handleWrite(s.nick)}
                  disabled={!s.nick || writingTo === s.nick}
                  loading={writingTo === s.nick}
                  icon={<Feather name="send" size={12} color={Colors.white} />}
                >
                  Написать
                </Button>
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

// ─── Review CTA list ─────────────────────────────────────────────────────────

function ReviewCTAList({
  requestId,
  threads,
  clientId,
}: {
  requestId: string;
  threads: Thread[];
  clientId: string;
}) {
  if (threads.length === 0) return null;

  return (
    <View style={{
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.brandPrimary + '4D',
      backgroundColor: Colors.brandPrimary + '0D',
    }}>
      <Text weight="semibold" style={{ color: Colors.brandPrimary }}>
        Заявка закрыта. Оставьте отзыв специалисту:
      </Text>
      {threads.map((thread) => {
        const specialist = getSpecialist(thread, clientId);
        const nick = specialist.specialistProfile?.nick;
        const displayName = specialist.specialistProfile?.displayName ?? specialist.email;
        const initials = getInitials(specialist.specialistProfile?.displayName, specialist.email);

        return (
          <Pressable
            key={thread.id}
            onPress={() =>
              router.push(
                `/leave-review?requestId=${requestId}&specialistId=${specialist.id}${nick ? `&specialistNick=${nick}` : ''}` as any,
              )
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              padding: Spacing.md,
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.borderLight,
              backgroundColor: Colors.white,
            }}
          >
            <View style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: Colors.borderLight,
              backgroundColor: Colors.bgSurface,
            }}>
              <Text weight="bold" style={{ color: Colors.brandPrimary, fontSize: 12 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="semibold">{displayName}</Text>
              {nick ? <Text variant="caption">@{nick}</Text> : null}
            </View>
            <Feather name="star" size={16} color={Colors.brandPrimary} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [extending, setExtending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await requests.getRequest(id);
      setRequest(res.data as RequestDetail);
    } catch {
      setError('Не удалось загрузить заявку');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleExtend = useCallback(async () => {
    if (!request || extending) return;
    try {
      setExtending(true);
      const res = await requests.extendRequest(request.id);
      setRequest(res.data as RequestDetail);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Не удалось продлить заявку';
      Alert.alert('Ошибка', msg);
    } finally {
      setExtending(false);
    }
  }, [request, extending]);

  const handleClose = useCallback(() => {
    if (!request) return;
    Alert.alert(
      'Закрыть заявку',
      'После закрытия заявка перейдёт в статус "Закрыта" и вы сможете оставить отзыв специалистам.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Закрыть',
          style: 'destructive',
          onPress: async () => {
            try {
              setClosing(true);
              const res = await requests.closeRequest(request.id);
              setRequest(res.data as RequestDetail);
            } catch (e: any) {
              const msg = e?.response?.data?.message ?? 'Не удалось закрыть заявку';
              Alert.alert('Ошибка', msg);
            } finally {
              setClosing(false);
            }
          },
        },
      ],
    );
  }, [request]);

  if (loading) {
    return (
      <Screen bg={Colors.white}>
        <Header variant="back" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      </Screen>
    );
  }

  if (error || !request) {
    return (
      <Screen bg={Colors.white}>
        <Header variant="back" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md }}>
          <Text align="center" style={{ color: Colors.statusError }}>
            {error ?? 'Заявка не найдена'}
          </Text>
          <Button variant="ghost" onPress={fetchRequest}>Повторить</Button>
        </View>
      </Screen>
    );
  }

  const status = request.status as RequestStatus;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusVariant = STATUS_BADGE_VARIANT[status] ?? 'default';
  const isOwner = user?.id === request.clientId;
  const canClose = isOwner && CLOSEABLE_STATUSES.includes(status);
  const isClosed = status === 'CLOSED';
  const extensionsCount = request.extensionsCount ?? 0;
  const canExtend =
    isOwner && status === 'CLOSING_SOON' && extensionsCount < MAX_EXTENSIONS;

  return (
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle={request.title} onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            {/* Request card */}
            <Card variant="outlined" padding="md" style={{ gap: Spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Heading level={3}>{request.title}</Heading>
                </View>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </View>

              <Text style={{ lineHeight: 24 }}>{request.description}</Text>

              <View style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Feather name="map-pin" size={14} color={Colors.textMuted} />
                  <Text variant="caption">{request.city}</Text>
                </View>
                {request.ifnsName ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Feather name="home" size={14} color={Colors.textMuted} />
                    <Text variant="caption">{request.ifnsName}</Text>
                  </View>
                ) : null}
                {request.serviceType ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Feather name="briefcase" size={14} color={Colors.textMuted} />
                    <Text variant="caption">{request.serviceType}</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Feather name="calendar" size={14} color={Colors.textMuted} />
                  <Text variant="caption">{formatDate(request.createdAt)}</Text>
                </View>
              </View>

              {/* Extend button — owner, CLOSING_SOON, extensionsCount < 3 */}
              {canExtend ? (
                <Button
                  variant="secondary"
                  onPress={handleExtend}
                  disabled={extending}
                  loading={extending}
                  fullWidth
                  icon={<Feather name="refresh-cw" size={14} color={Colors.brandPrimary} />}
                >
                  {`Продлить (осталось ${MAX_EXTENSIONS - extensionsCount})`}
                </Button>
              ) : null}

              {/* Close button — owner only, closeable statuses */}
              {canClose ? (
                <Button
                  variant="danger"
                  onPress={handleClose}
                  disabled={closing}
                  loading={closing}
                  fullWidth
                  icon={<Feather name="x-circle" size={14} color={Colors.white} />}
                >
                  Закрыть заявку
                </Button>
              ) : null}
            </Card>

            {/* Recommended specialists — owner only, active / closing_soon */}
            {isOwner && !isClosed ? <RecommendedSpecialists request={request} /> : null}

            {/* Review CTAs — shown immediately after closing if threads exist */}
            {isClosed && isOwner && request.threads.length > 0 ? (
              <ReviewCTAList
                requestId={request.id}
                threads={request.threads}
                clientId={request.clientId}
              />
            ) : null}

            {/* Threads list */}
            {request.threads.length > 0 ? (
              <View style={{ gap: Spacing.md }}>
                <Heading level={4}>
                  {`Сообщения (${request._count.threads})`}
                </Heading>
                {request.threads.map((thread) => {
                  const specialist = getSpecialist(thread, request.clientId);
                  const displayName =
                    specialist.specialistProfile?.displayName ?? specialist.email;
                  const initials = getInitials(
                    specialist.specialistProfile?.displayName,
                    specialist.email,
                  );

                  return (
                    <Card
                      key={thread.id}
                      onPress={() => router.push(`/chat/${thread.id}` as any)}
                      variant="outlined"
                      padding="sm"
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 9999,
                          borderWidth: 1,
                          borderColor: Colors.borderLight,
                          backgroundColor: Colors.bgSurface,
                        }}>
                          <Text weight="bold" style={{ color: Colors.brandPrimary, fontSize: 13 }}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text weight="semibold">{displayName}</Text>
                          {specialist.specialistProfile?.nick ? (
                            <Text variant="caption">
                              @{specialist.specialistProfile.nick}
                            </Text>
                          ) : null}
                        </View>
                        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                      </View>
                    </Card>
                  );
                })}
              </View>
            ) : null}
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
