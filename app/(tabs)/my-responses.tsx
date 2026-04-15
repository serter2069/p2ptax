import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useBreakpoints } from '../../hooks/useBreakpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ResponseItem {
  id: string;
  comment: string;
  price: number;
  deadline: string;
  status: 'sent' | 'viewed' | 'accepted' | 'deactivated';
  createdAt: string;
  request: {
    id: string;
    title?: string;
    description: string;
    city: string;
    status: string;
    createdAt: string;
    clientId: string;
  };
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  sent: { label: 'Ожидает', bg: '#fef3cd', text: '#92400e' },
  viewed: { label: 'Просмотрен', bg: '#dbeafe', text: '#1d4ed8' },
  accepted: { label: 'Принят', bg: '#d1fae5', text: '#065f46' },
  deactivated: { label: 'Отклонён', bg: '#f3f4f6', text: '#6b7280' },
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  OPEN: 'Открыта',
  IN_PROGRESS: 'В работе',
  CLOSING_SOON: 'Скоро закрытие',
  CLOSED: 'Закрыта',
  CANCELLED: 'Отменена',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'только что';
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' \u20BD';
}

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
const FILTER_TABS = [
  { label: 'Все', value: '' },
  { label: 'Активные', value: 'active' },
  { label: 'Принятые', value: 'accepted' },
  { label: 'Архив', value: 'archive' },
];

function filterResponses(items: ResponseItem[], filter: string): ResponseItem[] {
  switch (filter) {
    case 'active':
      return items.filter((r) => r.status === 'sent' || r.status === 'viewed');
    case 'accepted':
      return items.filter((r) => r.status === 'accepted');
    case 'archive':
      return items.filter((r) => r.status === 'deactivated' || ['CLOSED', 'CANCELLED'].includes(r.request.status));
    default:
      return items;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MyResponsesTab() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  const [items, setItems] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<ResponseItem[]>('/requests/my-responses');
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить отклики.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  const filtered = filterResponses(items, filter);

  // Stats
  const activeCount = items.filter((r) => r.status === 'sent' || r.status === 'viewed').length;
  const acceptedCount = items.filter((r) => r.status === 'accepted').length;

  // ---------------------------------------------------------------------------
  // Render card
  // ---------------------------------------------------------------------------
  function renderCard({ item }: { item: ResponseItem }) {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.sent;
    const reqStatusLabel = REQUEST_STATUS_LABELS[item.request.status] || item.request.status;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/requests/${item.request.id}` as any)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        <Card padding={Spacing.lg} variant="elevated">
          {/* Top row: response status + date */}
          <View style={styles.topRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.text }]}>
                {statusCfg.label}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Request title */}
          {item.request.title ? (
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.request.title}
            </Text>
          ) : (
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.request.description}
            </Text>
          )}

          {/* Your comment snippet */}
          <Text style={styles.commentSnippet} numberOfLines={2}>
            {item.comment}
          </Text>

          {/* Tags: city, request status */}
          <View style={styles.tagsRow}>
            <View style={styles.cityChip}>
              <Feather name="map-pin" size={10} color={Colors.textSecondary} />
              <Text style={styles.cityText}>{item.request.city}</Text>
            </View>
            <View style={styles.reqStatusChip}>
              <Text style={styles.reqStatusText}>{reqStatusLabel}</Text>
            </View>
          </View>

          {/* Footer: price + deadline */}
          <View style={styles.cardFooter}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            <View style={styles.deadlineChip}>
              <Feather name="clock" size={12} color={Colors.textMuted} />
              <Text style={styles.deadlineText}>
                до {new Date(item.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, !isMobile && styles.listContentWide]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.headerBox, !isMobile && styles.headerBoxWide]}>
            <Text style={styles.pageTitle}>Мои отклики</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{items.length}</Text>
                <Text style={styles.statLabel}>Всего</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>Активных</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{acceptedCount}</Text>
                <Text style={styles.statLabel}>Принятых</Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {FILTER_TABS.map((f) => {
                const active = f.value === filter;
                return (
                  <TouchableOpacity
                    key={f.value || '__all__'}
                    onPress={() => setFilter(f.value)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchData()}
            />
          ) : (
            <EmptyState
              icon="paper-plane-outline"
              title="Откликов пока нет"
              subtitle={
                filter
                  ? 'Нет откликов с таким статусом'
                  : 'Откликайтесь на заявки из ленты, и они появятся здесь'
              }
              ctaLabel={filter ? 'Сбросить фильтр' : 'Перейти к ленте'}
              onCtaPress={() => {
                if (filter) {
                  setFilter('');
                } else {
                  router.push('/(tabs)/feed' as any);
                }
              }}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  listContentWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 700,
  },

  // Header
  headerBox: {
    gap: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerBoxWide: {
    maxWidth: 700,
  },
  pageTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: Colors.white,
  },

  // Card
  cardWrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  commentSnippet: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  reqStatusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reqStatusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceText: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },
  deadlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Loading
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
});
