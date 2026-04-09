import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../../stores/authStore';

interface SpecialistProfile {
  nick?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ResponseItem {
  id: string;
  message: string;
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
  budget?: number | null;
  category?: string | null;
  status: string;
  createdAt: string;
  _count: { responses: number };
  responses: ResponseItem[];
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
      Alert.alert('Ошибка', msg);
    } finally {
      setClosingId(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleStartDialog(specialistId: string) {
    if (startingDialogId) return;
    setStartingDialogId(specialistId);
    try {
      const resp = await api.post<{ threadId: string }>('/threads/start', { otherUserId: specialistId });
      router.push(`/(dashboard)/messages/${resp.threadId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось открыть диалог';
      Alert.alert('Ошибка', msg);
    } finally {
      setStartingDialogId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Запрос' }]} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Запрос' }]} />
        <EmptyState
          icon="alert-circle-outline"
          title="Ошибка"
          subtitle={error || 'Запрос не найден'}
          ctaLabel="Повторить"
          onCtaPress={() => fetchDetail()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Запрос' }]} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View style={styles.container}>
          {/* Request info */}
          <Card padding={Spacing.xl}>
            <View style={styles.metaRow}>
              <View style={styles.cityChip}>
                <Text style={styles.cityText}>{request.city}</Text>
              </View>
              <View style={[styles.statusChip, request.status !== 'OPEN' && styles.statusChipClosed]}>
                <Text style={[styles.statusText, request.status !== 'OPEN' && styles.statusTextClosed]}>
                  {request.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{request.description}</Text>

            {(request.budget != null || request.category) ? (
              <View style={styles.tagsRow}>
                {request.category ? (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{request.category}</Text>
                  </View>
                ) : null}
                {request.budget != null ? (
                  <Text style={styles.budgetText}>Бюджет: {request.budget.toLocaleString('ru-RU')} ₽</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.dateLabel}>{formatDate(request.createdAt)}</Text>

            {request.status === 'OPEN' && user?.userId === request.clientId && (
              <View style={styles.actionRow}>
                <Button
                  onPress={() => router.push(`/(dashboard)/my-requests/edit/${request.id}`)}
                  variant="secondary"
                  style={styles.actionBtn}
                >
                  Редактировать
                </Button>
                <Button
                  onPress={handleClose}
                  variant="danger"
                  loading={closingId}
                  disabled={closingId}
                  style={styles.actionBtn}
                >
                  Закрыть запрос
                </Button>
              </View>
            )}
          </Card>

          {/* Responses */}
          <Text style={styles.sectionTitle}>
            Отклики ({request.responses.length})
          </Text>

          {request.responses.length === 0 ? (
            <EmptyState
              icon="mail-outline"
              title="Пока нет откликов"
              subtitle="Специалисты скоро увидят ваш запрос"
            />
          ) : (
            request.responses.map((resp) => (
              <Card key={resp.id} padding={Spacing.lg}>
                <View style={styles.responseHeader}>
                  <Text style={styles.specialistEmail}>
                    {resp.specialist?.specialistProfile?.displayName
                      || resp.specialist?.specialistProfile?.nick
                      || resp.specialist?.email?.split('@')[0]}
                  </Text>
                  <Text style={styles.responseDateText}>{formatDate(resp.createdAt)}</Text>
                </View>
                <Text style={styles.responseMessage}>{resp.message}</Text>
                <View style={styles.responseActions}>
                  {resp.specialist?.specialistProfile?.nick ? (
                    <Button
                      onPress={() => router.push(`/specialists/${resp.specialist.specialistProfile!.nick}`)}
                      variant="ghost"
                      style={styles.profileBtn}
                    >
                      Посмотреть профиль
                    </Button>
                  ) : null}
                  <Button
                    onPress={() => handleStartDialog(resp.specialist.id)}
                    variant="secondary"
                    loading={startingDialogId === resp.specialist.id}
                    disabled={startingDialogId !== null}
                    style={styles.dialogBtn}
                  >
                    Начать диалог
                  </Button>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cityChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  statusChip: {
    backgroundColor: Colors.statusBg.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  statusChipClosed: {
    backgroundColor: Colors.statusBg.warning,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  statusTextClosed: {
    color: Colors.textMuted,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  budgetText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  specialistEmail: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
  },
  responseDateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  responseMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  responseActions: {
    gap: Spacing.sm,
  },
  profileBtn: {
    width: '100%',
  },
  dialogBtn: {
    width: '100%',
  },
});
