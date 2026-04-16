import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { requests, specialists as specialistsApi, threads as threadsApi } from '../../../lib/api/endpoints';
import { useAuth } from '../../../lib/auth';
import { Header } from '../../../components/Header';
import { adaptThread } from '../../../lib/types/thread';

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

const STATUS_COLORS: Record<RequestStatus, string> = {
  ACTIVE: Colors.statusSuccess,
  CLOSING_SOON: '#F97316',
  CLOSED: Colors.textMuted,
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
    <View className="gap-3">
      <Text className="text-base font-semibold text-textPrimary">Рекомендуемые специалисты</Text>
      {loading ? (
        <View className="items-center py-6">
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <Text className="text-sm text-statusError">{error}</Text>
      ) : items.length === 0 ? (
        <View className="rounded-xl border border-borderLight bg-bgCard p-4">
          <Text className="text-sm text-textMuted">Пока никого не нашли по этим параметрам</Text>
        </View>
      ) : (
        items.map((s) => {
          const name = s.displayName ?? s.nick ?? 'Специалист';
          const initials = name.slice(0, 2).toUpperCase();
          const rating = s.activity?.avgRating;
          const city = (s.cities ?? [])[0];
          return (
            <View
              key={s.nick ?? name}
              className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
                <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-textPrimary" numberOfLines={1}>{name}</Text>
                <View className="mt-0.5 flex-row items-center gap-2">
                  {rating != null && (
                    <View className="flex-row items-center gap-1">
                      <Feather name="star" size={11} color="#F59E0B" />
                      <Text className="text-xs text-textMuted">{Number(rating).toFixed(1)}</Text>
                    </View>
                  )}
                  {city && (
                    <View className="flex-row items-center gap-1">
                      <Feather name="map-pin" size={11} color={Colors.textMuted} />
                      <Text className="text-xs text-textMuted" numberOfLines={1}>{city}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => s.nick && handleWrite(s.nick)}
                disabled={!s.nick || writingTo === s.nick}
                className="h-9 flex-row items-center justify-center gap-1 rounded-lg bg-brandPrimary px-3"
              >
                {writingTo === s.nick ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="send" size={12} color={Colors.white} />
                    <Text className="text-xs font-semibold text-white">Написать</Text>
                  </>
                )}
              </Pressable>
            </View>
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
    <View className="gap-3 rounded-xl border border-brandPrimary/30 bg-brandPrimary/5 p-4">
      <Text className="text-sm font-semibold text-brandPrimary">
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
            className="flex-row items-center gap-3 rounded-lg border border-borderLight bg-white p-3"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
              <Text className="text-xs font-bold text-brandPrimary">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary">{displayName}</Text>
              {nick && <Text className="text-xs text-textMuted">@{nick}</Text>}
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
      <View className="flex-1 bg-white">
        <Header variant="back" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View className="flex-1 bg-white">
        <Header variant="back" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-base text-statusError">
            {error ?? 'Заявка не найдена'}
          </Text>
          <Pressable onPress={fetchRequest} className="mt-4">
            <Text className="text-sm text-brandPrimary">Повторить</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const status = request.status as RequestStatus;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusColor = STATUS_COLORS[status] ?? Colors.textMuted;
  const isOwner = user?.id === request.clientId;
  const canClose = isOwner && CLOSEABLE_STATUSES.includes(status);
  const isClosed = status === 'CLOSED';
  const extensionsCount = request.extensionsCount ?? 0;
  const canExtend =
    isOwner && status === 'CLOSING_SOON' && extensionsCount < MAX_EXTENSIONS;

  return (
    <View className="flex-1 bg-white">
    <Header variant="back" backTitle={request.title} onBack={() => router.back()} />
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Request card */}
      <View className="gap-4 rounded-xl border border-borderLight bg-white p-4">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-lg font-bold text-textPrimary">{request.title}</Text>
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + '18' }}>
            <Text className="text-xs font-semibold" style={{ color: statusColor }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text className="text-base leading-6 text-textSecondary">{request.description}</Text>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Feather name="map-pin" size={14} color={Colors.textMuted} />
            <Text className="text-sm text-textMuted">{request.city}</Text>
          </View>
          {request.ifnsName && (
            <View className="flex-row items-center gap-2">
              <Feather name="home" size={14} color={Colors.textMuted} />
              <Text className="text-sm text-textMuted">{request.ifnsName}</Text>
            </View>
          )}
          {request.serviceType && (
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={14} color={Colors.textMuted} />
              <Text className="text-sm text-textMuted">{request.serviceType}</Text>
            </View>
          )}
          <View className="flex-row items-center gap-2">
            <Feather name="calendar" size={14} color={Colors.textMuted} />
            <Text className="text-sm text-textMuted">{formatDate(request.createdAt)}</Text>
          </View>
        </View>

        {/* Extend button — owner, CLOSING_SOON, extensionsCount < 3 */}
        {canExtend && (
          <Pressable
            onPress={handleExtend}
            disabled={extending}
            className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary bg-brandPrimary/10"
          >
            {extending ? (
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
            ) : (
              <>
                <Feather name="refresh-cw" size={14} color={Colors.brandPrimary} />
                <Text className="text-sm font-medium text-brandPrimary">
                  Продлить (осталось {MAX_EXTENSIONS - extensionsCount})
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* Close button — owner only, closeable statuses */}
        {canClose && (
          <Pressable
            onPress={handleClose}
            disabled={closing}
            className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-statusError bg-statusError/10"
          >
            {closing ? (
              <ActivityIndicator size="small" color={Colors.statusError} />
            ) : (
              <>
                <Feather name="x-circle" size={14} color={Colors.statusError} />
                <Text className="text-sm font-medium text-statusError">Закрыть заявку</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Recommended specialists — owner only, active / closing_soon */}
      {isOwner && !isClosed && <RecommendedSpecialists request={request} />}

      {/* Review CTAs — shown immediately after closing if threads exist */}
      {isClosed && isOwner && request.threads.length > 0 && (
        <ReviewCTAList
          requestId={request.id}
          threads={request.threads}
          clientId={request.clientId}
        />
      )}

      {/* Threads list */}
      {request.threads.length > 0 && (
        <View className="gap-3">
          <Text className="text-base font-semibold text-textPrimary">
            Сообщения ({request._count.threads})
          </Text>
          {request.threads.map((thread) => {
            const specialist = getSpecialist(thread, request.clientId);
            const displayName =
              specialist.specialistProfile?.displayName ?? specialist.email;
            const initials = getInitials(
              specialist.specialistProfile?.displayName,
              specialist.email,
            );

            return (
              <Pressable
                key={thread.id}
                onPress={() => router.push(`/chat/${thread.id}` as any)}
                className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
                  <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textPrimary">{displayName}</Text>
                  {specialist.specialistProfile?.nick && (
                    <Text className="text-xs text-textMuted">
                      @{specialist.specialistProfile.nick}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
    </View>
  );
}
