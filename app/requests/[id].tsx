import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/EmptyState';
import { ReportModal } from '../../components/ReportModal';

interface RequestDetail {
  id: string;
  title?: string;
  description: string;
  city: string;
  ifnsName?: string;
  budget?: number | null;
  category?: string | null;
  status: string;
  createdAt: string;
  client?: { id: string; name?: string };
  _count: { responses: number };
  responses?: any[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка'];

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

// ---------------------------------------------------------------------------
// Request card (matches prototype)
// ---------------------------------------------------------------------------
function RequestCard({ request }: { request: RequestDetail }) {
  const isOpen = request.status === 'OPEN';

  return (
    <View className="gap-3 rounded-xl border border-borderLight bg-white p-5">
      {/* Status + date */}
      <View className="flex-row items-center justify-between">
        <View
          className={`flex-row items-center gap-1.5 rounded-full px-2 py-0.5 ${isOpen ? 'bg-[#DCFCE7]' : 'bg-bgSecondary'}`}
        >
          <View className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-[#15803D]' : 'bg-textMuted'}`} />
          <Text
            className={`text-xs font-semibold ${isOpen ? 'text-[#15803D]' : 'text-textMuted'}`}
          >
            {isOpen ? 'Активна' : request.status === 'CLOSED' ? 'Закрыта' : request.status}
          </Text>
        </View>
        <Text className="text-xs text-textMuted">{formatDate(request.createdAt)}</Text>
      </View>

      {/* Title */}
      {request.title && (
        <Text className="text-xl font-bold leading-7 text-textPrimary">{request.title}</Text>
      )}

      {/* Description */}
      <Text className="text-base leading-6 text-textSecondary">{request.description}</Text>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
          <Feather name="map-pin" size={12} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{request.city}</Text>
        </View>
        {request.category && (
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
            <Feather name="briefcase" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{request.category}</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View className="h-px bg-borderLight" />

      {/* Meta */}
      <View className="flex-row flex-wrap gap-5">
        {request.ifnsName && (
          <View className="gap-0.5">
            <Text className="text-xs uppercase tracking-wide text-textMuted">ФНС</Text>
            <Text className="text-base font-semibold text-textPrimary">{request.ifnsName}</Text>
          </View>
        )}
        {request.client?.name && (
          <View className="gap-0.5">
            <Text className="text-xs uppercase tracking-wide text-textMuted">Клиент</Text>
            <Text className="text-base font-semibold text-textPrimary">{request.client.name}</Text>
          </View>
        )}
        {request.budget != null && (
          <View className="gap-0.5">
            <Text className="text-xs uppercase tracking-wide text-textMuted">Бюджет</Text>
            <Text className="text-base font-semibold text-textPrimary">
              {request.budget.toLocaleString('ru-RU')} руб.
            </Text>
          </View>
        )}
      </View>

      {/* Services */}
      {request.category && (
        <View className="gap-1.5">
          <Text className="text-xs uppercase tracking-wide text-textMuted">Услуги</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {SERVICES.map((s) => (
              <View key={s} className="rounded-full bg-bgSecondary px-2.5 py-1">
                <Text className="text-xs font-medium text-brandPrimary">{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Response count badge
// ---------------------------------------------------------------------------
function ResponseCountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-bgSecondary px-3 py-2">
      <Feather name="users" size={14} color={Colors.brandPrimary} />
      <Text className="text-sm text-textSecondary">
        <Text className="font-semibold text-brandPrimary">{count} специалистов</Text> уже написали
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function PublicRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Eligibility state
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  // Message state (inline, no modal)
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAuthNote, setShowAuthNote] = useState(false);

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<RequestDetail>(`/requests/${id}`);
        if (!cancelled) setRequest(data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить запрос');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // Check eligibility for specialists
  useEffect(() => {
    if (!id || !user || user.role !== 'SPECIALIST' || !request || request.status !== 'OPEN') return;
    setEligibilityLoading(true);
    api.get<{ responses?: any[] }>(`/requests/${id}`)
      .then((data) => {
        const myResponse = data.responses?.find((r: any) => r.specialistId === user.userId);
        setAlreadyResponded(!!myResponse);
      })
      .catch(() => {})
      .finally(() => setEligibilityLoading(false));
  }, [id, user, request]);

  async function handleSendMessage() {
    if (!id) return;
    const trimmed = message.trim();
    if (!trimmed) {
      if (Platform.OS === 'web') {
        alert('Введите сообщение для отклика');
      } else {
        Alert.alert('Ошибка', 'Введите сообщение для отклика');
      }
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/requests/${id}/respond`, { message: trimmed });
      setMessage('');
      if (Platform.OS === 'web') {
        alert('Отклик отправлен! Клиент получит уведомление.');
      } else {
        Alert.alert('Отклик отправлен', 'Клиент получит уведомление.');
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Вы уже откликались на этот запрос.'
            : err.message
          : 'Ошибка при отправке отклика';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Ошибка', msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleUnauthSend() {
    setShowAuthNote(true);
    // After a brief delay, redirect to auth
    setTimeout(() => {
      router.push('/(auth)/email?role=SPECIALIST' as any);
    }, 2000);
  }

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <LandingHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </View>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <View className="flex-1 bg-white">
        <LandingHeader />
        <EmptyState
          icon="alert-circle-outline"
          title={error || 'Запрос не найден'}
          ctaLabel="К ленте запросов"
          onCtaPress={() => router.push('/requests')}
        />
      </View>
    );
  }

  const isOpen = request.status === 'OPEN';
  const isSpecialist = user && user.role === 'SPECIALIST';

  const pageTitle = request.category
    ? `${request.category} — запрос в ${request.city} | Налоговик`
    : `Налоговый запрос в ${request.city} | Налоговик`;
  const pageDescription = request.description.slice(0, 160);
  const pageUrl = `${APP_URL}/requests/${id}`;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: pageTitle }} />
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
      </Head>
      <LandingHeader />

      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Report button for authenticated users */}
        {user && request.client && user.userId !== request.client.id && (
          <View className="flex-row justify-end">
            <Pressable
              onPress={() => setReportModalVisible(true)}
              className="p-2"
            >
              <Feather name="flag" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Request card */}
        <RequestCard request={request} />

        {/* Response count */}
        <ResponseCountBadge count={request._count.responses} />

        {/* Authorized specialist: inline message form */}
        {user && isSpecialist && isOpen && (
          eligibilityLoading ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
            </View>
          ) : alreadyResponded ? (
            <View className="flex-row items-start gap-2 rounded-lg border border-borderLight bg-bgSecondary px-3 py-2.5">
              <Feather name="info" size={16} color={Colors.brandPrimary} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-sm leading-5 text-textSecondary">
                Вы уже откликались на этот запрос
              </Text>
            </View>
          ) : (
            <>
              {/* Message input */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-textSecondary">Написать клиенту</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  placeholder="Напишите первое сообщение клиенту..."
                  placeholderTextColor={Colors.textMuted}
                  maxLength={500}
                  className="min-h-[100px] rounded-lg border border-borderLight bg-white p-3 text-base text-textPrimary"
                  style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
                />
              </View>

              {/* Send row: attachment + send button */}
              <View className="flex-row items-center gap-3">
                <Pressable className="h-12 w-12 items-center justify-center rounded-lg border border-borderLight bg-white">
                  <Feather name="paperclip" size={20} color={Colors.textMuted} />
                </Pressable>
                <Pressable
                  className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${submitting || !message.trim() ? 'opacity-50' : ''}`}
                  onPress={handleSendMessage}
                  disabled={submitting || !message.trim()}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Feather name="send" size={16} color={Colors.white} />
                      <Text className="text-base font-semibold text-white">Отправить</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Hint */}
              <View className="flex-row items-center justify-center gap-1.5">
                <Feather name="info" size={14} color={Colors.textMuted} />
                <Text className="text-center text-sm text-textMuted">
                  После отправки вы будете перенаправлены в чат
                </Text>
              </View>
            </>
          )
        )}

        {/* Unauthorized: message form with auth redirect */}
        {!user && isOpen && (
          <>
            {/* Message input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-textSecondary">Написать клиенту</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Напишите первое сообщение клиенту..."
                placeholderTextColor={Colors.textMuted}
                className="min-h-[100px] rounded-lg border border-borderLight bg-white p-3 text-base text-textPrimary"
                style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
              />
            </View>

            {/* Send button */}
            <Pressable
              onPress={handleUnauthSend}
              className="h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary"
            >
              <Feather name="send" size={16} color={Colors.white} />
              <Text className="text-base font-semibold text-white">Отправить</Text>
            </Pressable>

            {/* Auth redirect note */}
            {showAuthNote && (
              <View className="flex-row items-start gap-2 rounded-lg border border-borderLight bg-bgSecondary px-3 py-2.5">
                <Feather name="info" size={16} color={Colors.brandPrimary} style={{ marginTop: 1 }} />
                <Text className="flex-1 text-sm leading-5 text-textSecondary">
                  После нажатия вы будете перенаправлены на авторизацию, а сообщение будет отправлено после входа
                </Text>
              </View>
            )}
          </>
        )}

        {/* Back link */}
        <Pressable
          onPress={() => router.push('/requests')}
          className="items-center py-2"
        >
          <Text className="text-sm font-medium text-brandPrimary">Все запросы</Text>
        </Pressable>
      </ScrollView>

      {/* Report modal */}
      {request.client && user && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          targetUserId={request.client.id}
        />
      )}
    </View>
  );
}
