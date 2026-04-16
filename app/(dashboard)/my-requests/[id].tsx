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
import { requests } from '../../../lib/api/endpoints';
import { useAuth } from '../../../stores/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestStatus =
  | 'NEW'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'CLOSING_SOON'
  | 'CLOSED'
  | 'CANCELLED';

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
  threads: Thread[];
  _count: { threads: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLOSEABLE_STATUSES: RequestStatus[] = ['NEW', 'OPEN', 'IN_PROGRESS', 'CLOSING_SOON'];

const STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: 'Новая',
  OPEN: 'Активная',
  IN_PROGRESS: 'В работе',
  CLOSING_SOON: 'Скоро закроется',
  CLOSED: 'Закрыта',
  CANCELLED: 'Отменена',
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  NEW: Colors.brandPrimary,
  OPEN: Colors.statusSuccess,
  IN_PROGRESS: '#F59E0B',
  CLOSING_SOON: '#F97316',
  CLOSED: Colors.textMuted,
  CANCELLED: Colors.statusError,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getSpecialist(thread: Thread, clientId: string): ThreadUser {
  return thread.participant1Id === clientId ? thread.participant2 : thread.participant1;
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Colors.brandPrimary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-center text-base text-statusError">
          {error ?? 'Заявка не найдена'}
        </Text>
        <Pressable onPress={fetchRequest} className="mt-4">
          <Text className="text-sm text-brandPrimary">Повторить</Text>
        </Pressable>
      </View>
    );
  }

  const status = request.status as RequestStatus;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusColor = STATUS_COLORS[status] ?? Colors.textMuted;
  const isOwner = user?.userId === request.clientId;
  const canClose = isOwner && CLOSEABLE_STATUSES.includes(status);
  const isClosed = status === 'CLOSED' || status === 'CANCELLED';

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
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
  );
}
