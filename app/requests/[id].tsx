import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/EmptyState';
import { useBreakpoints } from '../../hooks/useBreakpoints';

interface RequestDetail {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  status: string;
  createdAt: string;
  client?: { id: string };
  _count: { responses: number };
  responses?: any[];
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

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

export default function PublicRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile } = useBreakpoints();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Eligibility state
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  // Respond modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [respondMessage, setRespondMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  function openRespondModal() {
    setRespondMessage('');
    setModalVisible(true);
  }

  function closeRespondModal() {
    setModalVisible(false);
    setRespondMessage('');
  }

  async function submitResponse() {
    if (!id) return;
    const trimmed = respondMessage.trim();
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
      closeRespondModal();
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LandingHeader />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.safe}>
        <LandingHeader />
        <EmptyState
          icon="alert-circle-outline"
          title={error || 'Запрос не найден'}
          ctaLabel="К ленте запросов"
          onCtaPress={() => router.push('/requests')}
        />
      </SafeAreaView>
    );
  }

  const isOpen = request.status === 'OPEN';

  const pageTitle = request.category
    ? `${request.category} — запрос в ${request.city} | Налоговик`
    : `Налоговый запрос в ${request.city} | Налоговик`;
  const pageDescription = request.description.slice(0, 160);
  const pageUrl = `${APP_URL}/requests/${id}`;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: pageTitle }} />
      {/* TODO: add og:image when CDN/static image is available */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
      </Head>
      <LandingHeader />
      <Header title="Детали запроса" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, !isMobile && styles.containerWide]}>
          {/* Status badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusChip, !isOpen && styles.statusChipClosed]}>
              <Text style={[styles.statusText, !isOpen && styles.statusTextClosed]}>
                {isOpen ? 'Открыт' : request.status === 'CLOSED' ? 'Закрыт' : request.status}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>

          {/* Meta info */}
          <View style={styles.card}>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Город</Text>
                <Text style={styles.metaValue}>{request.city}</Text>
              </View>

              {request.category && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Категория</Text>
                  <Text style={styles.metaValue}>{request.category}</Text>
                </View>
              )}

              {request.budget != null && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Бюджет</Text>
                  <Text style={styles.metaValue}>
                    {request.budget.toLocaleString('ru-RU')} руб.
                  </Text>
                </View>
              )}

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Откликов</Text>
                <Text style={styles.metaValue}>{request._count.responses}</Text>
              </View>
            </View>
          </View>

          {/* CTA for authenticated specialists */}
          {user && user.role === 'SPECIALIST' && isOpen && (
            eligibilityLoading ? (
              <ActivityIndicator size="small" color={Colors.brandPrimary} style={{ marginVertical: Spacing.md }} />
            ) : alreadyResponded ? (
              <View style={styles.ctaBox}>
                <Text style={styles.ctaText}>Вы уже откликались на этот запрос</Text>
              </View>
            ) : (
              <Button
                onPress={openRespondModal}
                variant="primary"
                style={styles.respondBtn}
              >
                Откликнуться
              </Button>
            )
          )}

          {/* CTA for unauthenticated */}
          {!user && isOpen && (
            <View style={styles.ctaBox}>
              <Text style={styles.ctaText}>
                Вы специалист? Войдите чтобы откликнуться на этот запрос
              </Text>
              <Button
                onPress={() => router.push('/(auth)/email?role=SPECIALIST' as any)}
                variant="primary"
                style={styles.respondBtn}
              >
                Войти и откликнуться
              </Button>
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.push('/requests')}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Все запросы</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Respond modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRespondModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ваш отклик</Text>
            <Text style={styles.modalHint}>Кратко опишите, как вы можете помочь</Text>
            <TextInput
              value={respondMessage}
              onChangeText={setRespondMessage}
              placeholder="Здравствуйте! Я специалист по..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.messageInput}
              autoFocus
            />
            <Text style={styles.charCounter}>{respondMessage.length}/500</Text>
            <View style={styles.modalBtns}>
              <Button onPress={closeRespondModal} variant="ghost" style={styles.modalBtn}>
                Отмена
              </Button>
              <Button
                onPress={submitResponse}
                variant="primary"
                loading={submitting}
                disabled={submitting || !respondMessage.trim()}
                style={styles.modalBtn}
              >
                Отправить
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 48,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  containerWide: {
    maxWidth: 700,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    backgroundColor: Colors.statusBg.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusChipClosed: {
    backgroundColor: Colors.bgSecondary,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusTextClosed: {
    color: Colors.textMuted,
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  metaGrid: {
    gap: Spacing.md,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  respondBtn: {
    width: '100%',
  },
  ctaBox: {
    backgroundColor: '#EBF3FB',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
  },
  backBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  modalHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
  },
  messageInput: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: -Spacing.xs,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    flex: 1,
  },
});
