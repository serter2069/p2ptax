import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  client: { id: string };
  _count: { responses: number };
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

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile } = useBreakpoints();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        // Try fetching the specific request from the feed endpoint
        const params = new URLSearchParams();
        params.set('page', '1');
        const data = await api.get<{ items: RequestDetail[]; total: number }>(
          `/requests?${params.toString()}`,
        );
        const found = data.items.find((item) => item.id === id);
        if (found) {
          if (!cancelled) setRequest(found);
        } else {
          // Try loading more pages to find the request
          let page = 2;
          let foundItem: RequestDetail | null = null;
          while (page <= Math.ceil(data.total / 20) + 1 && !foundItem && !cancelled) {
            const moreData = await api.get<{ items: RequestDetail[] }>(
              `/requests?page=${page}`,
            );
            foundItem = moreData.items.find((item) => item.id === id) || null;
            page++;
          }
          if (foundItem && !cancelled) {
            setRequest(foundItem);
          } else if (!cancelled) {
            setError('Запрос не найден');
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setError('Войдите чтобы увидеть детали запроса');
          } else if (err instanceof ApiError) {
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

  return (
    <SafeAreaView style={styles.safe}>
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
                    {request.budget.toLocaleString('ru-RU')} rub.
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
            <Button
              onPress={() => router.push(`/(dashboard)/requests/${request.id}` as any)}
              variant="primary"
              style={styles.respondBtn}
            >
              Откликнуться
            </Button>
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
});
