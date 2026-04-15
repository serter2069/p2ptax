import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../../lib/api';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../../stores/authStore';
import { ReviewForm } from '../../../components/ReviewForm';

interface SpecialistProfile {
  nick?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ResponseItem {
  id: string;
  comment: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile?: SpecialistProfile | null;
  };
  createdAt: string;
}

interface RequestDetail {
  id: string;
  clientId: string;
  description: string;
  city: string;
  ifnsName?: string | null;
  budget?: number | null;
  category?: string | null;
  status: string;
  createdAt: string;
  _count: { responses: number };
  responses: ResponseItem[];
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'OPEN': return 'Активная';
    case 'NEW': return 'Новая';
    case 'IN_PROGRESS': return 'В работе';
    case 'CLOSING_SOON': return 'Скоро закроется';
    case 'CLOSED': return 'Закрыта';
    case 'CANCELLED': return 'Отменена';
    default: return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return Colors.statusSuccess;
    case 'NEW': return Colors.brandPrimary;
    case 'IN_PROGRESS': return Colors.statusWarning;
    case 'CLOSING_SOON': return Colors.statusWarning;
    case 'CLOSED': return Colors.textMuted;
    case 'CANCELLED': return Colors.statusError;
    default: return Colors.statusWarning;
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 172800000) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function MyRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [closingId, setClosingId] = useState(false);
  const [startingDialogId, setStartingDialogId] = useState<string | null>(null);
  const [reviewingNick, setReviewingNick] = useState<string | null>(null);
  const [reviewedNicks, setReviewedNicks] = useState<Set<string>>(new Set());

  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const found = await api.get<RequestDetail>(`/requests/${id}`);
      setRequest(found);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить запрос');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  function handleRefresh() {
    setRefreshing(true);
    fetchDetail(true);
  }

  async function handleClose() {
    if (!request) return;
    setClosingId(true);
    try {
      await api.patch(`/requests/${request.id}`, { status: 'CLOSED' });
      setRequest((prev) => prev ? { ...prev, status: 'CLOSED' } : prev);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Ошибка при закрытии';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Ошибка', msg);
      }
    } finally {
      setClosingId(false);
    }
  }

  async function handleStartDialog(specialistId: string) {
    if (startingDialogId) return;
    setStartingDialogId(specialistId);
    try {
      const resp = await api.post<{ threadId: string }>('/threads/start', { otherUserId: specialistId });
      router.push(`/(dashboard)/messages/${resp.threadId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось открыть диалог';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Ошибка', msg);
      }
    } finally {
      setStartingDialogId(null);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <Header title="Запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Запрос' }]} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View className="flex-1 bg-white">
        <Header title="Запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Запрос' }]} />
        <EmptyState
          icon="alert-circle-outline"
          title="Ошибка"
          subtitle={error || 'Запрос не найден'}
          ctaLabel="Повторить"
          onCtaPress={() => fetchDetail()}
        />
      </View>
    );
  }

  const statusLabel = getStatusLabel(request.status);
  const statusColor = getStatusColor(request.status);
  const isOwner = user?.userId === request.clientId;
  const isOpen = request.status === 'OPEN';
  const isClosed = request.status === 'CLOSED';

  return (
    <View className="flex-1 bg-white">
      <Header title="Запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Запрос' }]} />
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View className="w-full max-w-screen-sm gap-4">
          {/* ---- Request Info Card ---- */}
          <View className="gap-4 rounded-xl border border-borderLight bg-white p-4">
            {/* Title + status */}
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-lg font-bold text-textPrimary">
                {request.category || 'Налоговый запрос'}
              </Text>
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + '18' }}>
                <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text className="text-base leading-6 text-textSecondary">
              {request.description}
            </Text>

            {/* Meta */}
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
              {request.category && (
                <View className="flex-row items-center gap-2">
                  <Feather name="briefcase" size={14} color={Colors.textMuted} />
                  <Text className="text-sm text-textMuted">{request.category}</Text>
                </View>
              )}
              {request.budget != null && (
                <View className="flex-row items-center gap-2">
                  <Feather name="credit-card" size={14} color={Colors.textMuted} />
                  <Text className="text-sm text-textMuted">
                    {request.budget.toLocaleString('ru-RU')} ₽
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-2">
                <Feather name="calendar" size={14} color={Colors.textMuted} />
                <Text className="text-sm text-textMuted">{formatShortDate(request.createdAt)}</Text>
              </View>
            </View>

            {/* Review banner for closed requests */}
            {isClosed && request.responses.length > 0 && (
              <View className="rounded-lg border border-borderLight bg-bgSurface p-3">
                <Text className="text-center text-sm leading-5 text-brandPrimary">
                  Заявка закрыта. Оставьте отзыв специалисту, чтобы помочь другим клиентам.
                </Text>
              </View>
            )}

            {/* Actions */}
            {isOpen && isOwner && (
              <View className="flex-row gap-2">
                <Pressable
                  className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary"
                  onPress={() => router.push(`/(dashboard)/my-requests/edit/${request.id}`)}
                >
                  <Feather name="edit-2" size={14} color={Colors.brandPrimary} />
                  <Text className="text-sm font-medium text-brandPrimary">Редактировать</Text>
                </Pressable>
                <Pressable
                  className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-statusError bg-statusError/10"
                  onPress={handleClose}
                  disabled={closingId}
                >
                  {closingId ? (
                    <ActivityIndicator size="small" color={Colors.statusError} />
                  ) : (
                    <>
                      <Feather name="x-circle" size={14} color={Colors.statusError} />
                      <Text className="text-sm font-medium text-statusError">Закрыть</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* ---- Responses section ---- */}
          {request.responses.length === 0 ? (
            /* Empty state — no messages yet */
            <View className="items-center gap-3 py-8">
              <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
                <Feather name="clock" size={32} color={Colors.brandPrimary} />
              </View>
              <Text className="text-base font-semibold text-textPrimary">Ожидание сообщений</Text>
              <Text className="max-w-[280px] text-center text-sm text-textMuted">
                Специалисты рассматривают вашу заявку. Обычно первые сообщения приходят в течение часа.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              <Text className="text-base font-semibold text-textPrimary">
                Сообщения ({request.responses.length})
              </Text>

              {request.responses.map((resp) => {
                const displayName =
                  resp.specialist?.specialistProfile?.displayName
                  || resp.specialist?.specialistProfile?.nick
                  || resp.specialist?.email?.split('@')[0]
                  || '??';
                const initials = getInitials(displayName);
                const nick = resp.specialist?.specialistProfile?.nick;
                const canReview = isClosed && nick && !reviewedNicks.has(nick);

                return (
                  <View key={resp.id} className="gap-3">
                    <Pressable
                      className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3"
                      onPress={() => handleStartDialog(resp.specialist.id)}
                    >
                      {/* Avatar */}
                      <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
                        <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-textPrimary">{displayName}</Text>
                          <Text className="text-xs text-textMuted">{formatTime(resp.createdAt)}</Text>
                        </View>
                        <Text className="text-xs text-textMuted" numberOfLines={1}>
                          {resp.comment}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Action buttons below response card */}
                    <View className="flex-row gap-2 px-1">
                      {nick && (
                        <Pressable
                          className="h-9 flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-borderLight"
                          onPress={() => router.push(`/specialists/${nick}`)}
                        >
                          <Feather name="user" size={13} color={Colors.textSecondary} />
                          <Text className="text-xs font-medium text-textSecondary">Профиль</Text>
                        </Pressable>
                      )}
                      <Pressable
                        className="h-9 flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-brandPrimary"
                        onPress={() => handleStartDialog(resp.specialist.id)}
                        disabled={startingDialogId !== null}
                      >
                        {startingDialogId === resp.specialist.id ? (
                          <ActivityIndicator size="small" color={Colors.brandPrimary} />
                        ) : (
                          <>
                            <Feather name="message-circle" size={13} color={Colors.brandPrimary} />
                            <Text className="text-xs font-medium text-brandPrimary">Написать</Text>
                          </>
                        )}
                      </Pressable>
                      {canReview && reviewingNick !== nick && (
                        <Pressable
                          className="h-9 flex-1 flex-row items-center justify-center gap-1 rounded-lg bg-brandPrimary"
                          onPress={() => setReviewingNick(nick)}
                        >
                          <Feather name="star" size={13} color="#FFFFFF" />
                          <Text className="text-xs font-medium text-white">Отзыв</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Inline review form */}
                    {canReview && reviewingNick === nick && (
                      <View className="mt-1">
                        <ReviewForm
                          specialistNick={nick}
                          requestId={request.id}
                          onSuccess={() => {
                            setReviewingNick(null);
                            setReviewedNicks((prev) => new Set(prev).add(nick));
                            if (Platform.OS === 'web') {
                              alert('Спасибо! Ваш отзыв отправлен.');
                            } else {
                              Alert.alert('Спасибо!', 'Ваш отзыв отправлен.');
                            }
                          }}
                          onCancel={() => setReviewingNick(null)}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
