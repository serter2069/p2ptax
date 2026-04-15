import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { requests as requestsApi, threads as threadsApi } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpecialistProfile {
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ResponseItem {
  id: string;
  specialistId: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile: SpecialistProfile | null;
  };
  comment: string;
  price: number;
  deadline: string;
  status: string;
  createdAt: string;
}

interface RequestDetail {
  id: string;
  clientId?: string;
  title: string;
  description: string;
  city: string;
  ifnsId: string | null;
  ifnsName: string | null;
  serviceType: string | null;
  budget: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  responses?: ResponseItem[];
  _count?: { responses: number };
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  OPEN: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success, icon: 'check-circle' },
  CLOSING_SOON: { label: 'Скоро закроется', color: Colors.statusWarning, bg: Colors.statusBg.warning, icon: 'clock' },
  CLOSED: { label: 'Закрыта', color: Colors.textMuted, bg: Colors.statusBg.neutral, icon: 'x-circle' },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error, icon: 'slash' },
};

const STATUS_STEPS = [
  { key: 'OPEN', label: 'Активная' },
  { key: 'CLOSING_SOON', label: 'Скоро закроется' },
  { key: 'CLOSED', label: 'Закрыта' },
];

function getStatusIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' \u20BD';
}

// ---------------------------------------------------------------------------
// Status Flow
// ---------------------------------------------------------------------------

function StatusFlow({ currentStatus }: { currentStatus: string }) {
  const currentIdx = getStatusIndex(currentStatus);

  if (currentStatus === 'CANCELLED') {
    return (
      <View style={s.statusFlow}>
        <Text style={s.sectionTitle}>Статус заявки</Text>
        <View style={s.statusFlowRow}>
          <View style={[s.statusDot, { backgroundColor: Colors.statusError }]} />
          <Text style={[s.statusStepText, { color: Colors.statusError, fontWeight: Typography.fontWeight.semibold }]}>
            Отменена
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.statusFlow}>
      <Text style={s.sectionTitle}>Статус заявки</Text>
      <View style={s.statusFlowRow}>
        {STATUS_STEPS.map((step, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <React.Fragment key={step.key}>
              {idx > 0 && (
                <View style={[s.statusLine, isActive && s.statusLineActive]} />
              )}
              <View style={s.statusStepWrap}>
                <View
                  style={[
                    s.statusDot,
                    isActive
                      ? { backgroundColor: Colors.brandPrimary }
                      : { backgroundColor: Colors.borderLight },
                  ]}
                />
                <Text
                  style={[
                    s.statusStepText,
                    isCurrent && {
                      color: Colors.brandPrimary,
                      fontWeight: Typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Response Card (specialist who responded)
// ---------------------------------------------------------------------------

function ResponseCard({
  item,
  onPress,
}: {
  item: ResponseItem;
  onPress: () => void;
}) {
  const profile = item.specialist.specialistProfile;
  const name = profile?.displayName || item.specialist.email;
  const initials = getInitials(name);

  return (
    <Pressable style={s.responseCard} onPress={onPress}>
      <View style={s.responseAvatar}>
        <Text style={s.responseAvatarText}>{initials}</Text>
      </View>
      <View style={s.responseContent}>
        <View style={s.responseHeader}>
          <Text style={s.responseName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={s.responseDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={s.responseComment} numberOfLines={2}>
          {item.comment}
        </Text>
        <View style={s.responseMeta}>
          <View style={s.responseMetaItem}>
            <Feather name="dollar-sign" size={12} color={Colors.brandPrimary} />
            <Text style={s.responseMetaText}>{formatPrice(item.price)}</Text>
          </View>
          <View style={s.responseMetaItem}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={s.responseMetaDate}>{formatDate(item.deadline)}</Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, role, isAuthenticated } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [closing, setClosing] = useState(false);
  const [startingThread, setStartingThread] = useState(false);
  const [message, setMessage] = useState('');

  const isOwner = request?.clientId && user?.id === request.clientId;
  const isSpecialist = role === 'SPECIALIST';
  const isOpen = request?.status === 'OPEN' || request?.status === 'CLOSING_SOON';

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(false);

        const res = await requestsApi.getRequest(id);
        const data = res.data as RequestDetail;
        setRequest(data);

        // If owner, responses are included in the request data
        if (data.responses) {
          setResponses(data.responses);
        } else {
          setResponses([]);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleClose = useCallback(async () => {
    if (!id) return;
    Alert.alert('Закрыть заявку?', 'Вы уверены, что хотите закрыть эту заявку?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Закрыть',
        style: 'destructive',
        onPress: async () => {
          try {
            setClosing(true);
            await requestsApi.updateRequest(id, { status: 'CLOSED' });
            fetchData();
          } catch {
            Alert.alert('Ошибка', 'Не удалось закрыть заявку');
          } finally {
            setClosing(false);
          }
        },
      },
    ]);
  }, [id, fetchData]);

  const handleStartThread = useCallback(
    async (otherUserId: string) => {
      try {
        setStartingThread(true);
        const res = await threadsApi.startThread(otherUserId);
        const thread = res.data as { id: string };
        router.push(`/chat/${thread.id}` as never);
      } catch {
        Alert.alert('Ошибка', 'Не удалось начать чат');
      } finally {
        setStartingThread(false);
      }
    },
    [router],
  );

  const handleResponsePress = useCallback(
    (item: ResponseItem) => {
      handleStartThread(item.specialist.id);
    },
    [handleStartThread],
  );

  // Specialist writes to client (request owner)
  const handleSpecialistRespond = useCallback(() => {
    if (!request?.clientId) return;
    handleStartThread(request.clientId);
  }, [request, handleStartThread]);

  // Non-authenticated user: redirect to auth with return URL
  const handleAuthRedirect = useCallback(() => {
    router.push(`/(auth)/email?redirectTo=/request/${id}` as never);
  }, [router, id]);

  // -------------------------------------------------------------------------
  // Loading / Error states
  // -------------------------------------------------------------------------

  if (loading && !refreshing) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={s.centered}>
        <View style={s.errorIcon}>
          <Feather name="alert-triangle" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Ошибка загрузки</Text>
        <Text style={s.errorText}>Не удалось загрузить заявку</Text>
        <Pressable style={s.retryBtn} onPress={() => fetchData()}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }

  const st = STATUS_MAP[request.status] || STATUS_MAP.OPEN;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          Заявка
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        {/* Title + Status Badge */}
        <View style={s.titleRow}>
          <Text style={s.title}>{request.title}</Text>
          <View style={[s.badge, { backgroundColor: st.bg }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={s.description}>{request.description}</Text>

        {/* Info Section */}
        <View style={s.infoCard}>
          {request.city && (
            <View style={s.infoRow}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text style={s.infoLabel}>Город</Text>
              <Text style={s.infoValue}>{request.city}</Text>
            </View>
          )}
          {request.ifnsName && (
            <View style={s.infoRow}>
              <Feather name="home" size={14} color={Colors.textMuted} />
              <Text style={s.infoLabel}>ФНС</Text>
              <Text style={s.infoValue}>{request.ifnsName}</Text>
            </View>
          )}
          {request.serviceType && (
            <View style={s.infoRow}>
              <Feather name="briefcase" size={14} color={Colors.textMuted} />
              <Text style={s.infoLabel}>Услуга</Text>
              <Text style={s.infoValue}>{request.serviceType}</Text>
            </View>
          )}
          {request.budget != null && (
            <View style={s.infoRow}>
              <Feather name="dollar-sign" size={14} color={Colors.textMuted} />
              <Text style={s.infoLabel}>Бюджет</Text>
              <Text style={s.infoValue}>{formatPrice(request.budget)}</Text>
            </View>
          )}
          <View style={s.infoRow}>
            <Feather name="calendar" size={14} color={Colors.textMuted} />
            <Text style={s.infoLabel}>Дата</Text>
            <Text style={s.infoValue}>{formatDate(request.createdAt)}</Text>
          </View>
        </View>

        {/* Status Flow */}
        <StatusFlow currentStatus={request.status} />

        {/* Response count badge (non-owner, public view) */}
        {!isOwner && request._count && request._count.responses > 0 && (
          <View style={s.responseCountBadge}>
            <Feather name="users" size={14} color={Colors.brandPrimary} />
            <Text style={s.responseCountText}>
              {request._count.responses}{' '}
              {request._count.responses === 1 ? 'специалист откликнулся' : 'специалистов откликнулись'}
            </Text>
          </View>
        )}

        {/* Responses Section — only for owner */}
        {isOwner && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Отклики ({responses.length})
            </Text>
            {responses.length === 0 ? (
              <View style={s.emptyResponses}>
                <View style={s.emptyResponsesIcon}>
                  <Feather name="clock" size={28} color={Colors.brandPrimary} />
                </View>
                <Text style={s.emptyResponsesTitle}>Ожидание откликов</Text>
                <Text style={s.emptyResponsesText}>
                  Специалисты рассматривают вашу заявку. Обычно первые отклики приходят в течение часа.
                </Text>
              </View>
            ) : (
              <View style={s.responsesList}>
                {responses.map((item) => (
                  <ResponseCard
                    key={item.id}
                    item={item}
                    onPress={() => handleResponsePress(item)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          {/* Owner: close request */}
          {isOwner && isOpen && (
            <Pressable
              style={s.closeBtn}
              onPress={handleClose}
              disabled={closing}
            >
              {closing ? (
                <ActivityIndicator size="small" color={Colors.statusError} />
              ) : (
                <>
                  <Feather name="x-circle" size={16} color={Colors.statusError} />
                  <Text style={s.closeBtnText}>Закрыть заявку</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Authenticated specialist: message input + send */}
          {isAuthenticated && isSpecialist && isOpen && (
            <View style={s.messageSection}>
              <Text style={s.messageSectionLabel}>Написать клиенту</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Напишите первое сообщение клиенту..."
                placeholderTextColor={Colors.textMuted}
                style={s.messageInput}
              />
              <Pressable
                style={s.writeBtn}
                onPress={handleSpecialistRespond}
                disabled={startingThread}
              >
                {startingThread ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="send" size={16} color={Colors.white} />
                    <Text style={s.writeBtnText}>Написать</Text>
                  </>
                )}
              </Pressable>
              <View style={s.hintRow}>
                <Feather name="info" size={14} color={Colors.textMuted} />
                <Text style={s.hintText}>
                  После отправки вы будете перенаправлены в чат
                </Text>
              </View>
            </View>
          )}

          {/* Not authenticated: auth-gated CTA */}
          {!isAuthenticated && isOpen && (
            <View style={s.messageSection}>
              <Text style={s.messageSectionLabel}>Написать клиенту</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Напишите первое сообщение клиенту..."
                placeholderTextColor={Colors.textMuted}
                style={s.messageInput}
              />
              <Pressable
                style={s.writeBtn}
                onPress={handleAuthRedirect}
              >
                <Feather name="log-in" size={16} color={Colors.white} />
                <Text style={s.writeBtnText}>Войдите, чтобы написать</Text>
              </Pressable>
              <View style={s.authHintCard}>
                <Feather name="info" size={16} color={Colors.brandPrimary} style={{ marginTop: 1 }} />
                <Text style={s.authHintText}>
                  После нажатия вы будете перенаправлены на авторизацию, а сообщение будет отправлено после входа
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  centered: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },

  // Title + badge
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Description
  description: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    color: Colors.textSecondary,
  },

  // Info card
  infoCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    width: 60,
  },
  infoValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },

  // Status flow
  statusFlow: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  statusFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusStepWrap: {
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 18,
  },
  statusLineActive: {
    backgroundColor: Colors.brandPrimary,
  },
  statusStepText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Section
  section: { gap: Spacing.md },

  // Response card
  responsesList: { gap: Spacing.md },
  responseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  responseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseAvatarText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  responseContent: { flex: 1, gap: 4 },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  responseName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  responseDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  responseComment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  responseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 2,
  },
  responseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseMetaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
  responseMetaDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Empty responses
  emptyResponses: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },
  emptyResponsesIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResponsesTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptyResponsesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Response count badge (non-owner)
  responseCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  responseCountText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Actions
  actions: { gap: Spacing.md },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    borderRadius: BorderRadius.btn,
    borderWidth: 1,
    borderColor: Colors.statusError,
    backgroundColor: Colors.statusBg.error,
  },
  closeBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.statusError,
  },

  // Message section (specialist or unauth)
  messageSection: {
    gap: Spacing.md,
  },
  messageSectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  messageInput: {
    minHeight: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },

  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.btn,
    backgroundColor: Colors.brandPrimary,
  },
  writeBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // Hint row (authenticated)
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  hintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Auth hint card (not authenticated)
  authHintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  authHintText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    color: Colors.textSecondary,
  },

  // Error state
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.statusBg.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
