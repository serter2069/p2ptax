import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

type ResponseStatus = 'sent' | 'viewed' | 'accepted' | 'deactivated';
type FilterTab = 'all' | 'active' | 'accepted' | 'deactivated';

interface ResponseItem {
  id: string;
  comment: string;
  status: ResponseStatus;
  price: number;
  deadline: string;
  viewedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  request: {
    id: string;
    title: string;
    description: string;
    city: string;
    status: string;
    createdAt: string;
    clientId: string;
  };
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'accepted', label: 'Принятые' },
  { key: 'deactivated', label: 'Отклоненные' },
];

const STATUS_CONFIG: Record<ResponseStatus, { label: string; bg: string; color: string }> = {
  sent: { label: 'Отправлен', bg: Colors.statusBg.info, color: Colors.statusInfo },
  viewed: { label: 'Просмотрен', bg: Colors.statusBg.warning, color: Colors.statusWarning },
  accepted: { label: 'Принят', bg: Colors.statusBg.success, color: Colors.statusSuccess },
  deactivated: { label: 'Деактивирован', bg: Colors.statusBg.error, color: Colors.statusError },
};

function filterResponses(responses: ResponseItem[], tab: FilterTab): ResponseItem[] {
  switch (tab) {
    case 'active':
      return responses.filter((r) => r.status === 'sent' || r.status === 'viewed');
    case 'accepted':
      return responses.filter((r) => r.status === 'accepted');
    case 'deactivated':
      return responses.filter((r) => r.status === 'deactivated');
    default:
      return responses;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' EUR';
}

export default function SpecialistMyResponsesScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchResponses = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<ResponseItem[]>('/specialist/responses');
      setResponses(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить отклики');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  function handleRefresh() {
    setRefreshing(true);
    fetchResponses(true);
  }

  async function handleDeactivate(responseId: string) {
    if (deactivatingId) return;
    setDeactivatingId(responseId);
    try {
      await api.patch(`/requests/responses/${responseId}`, { status: 'deactivated' });
      setResponses((prev) =>
        prev.map((r) => (r.id === responseId ? { ...r, status: 'deactivated' as ResponseStatus } : r)),
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось деактивировать отклик';
      Alert.alert('Ошибка', msg);
    } finally {
      setDeactivatingId(null);
    }
  }

  const filtered = filterResponses(responses, activeTab);

  function renderSkeletonCard() {
    return (
      <View style={styles.cardWrapper}>
        <Card padding={Spacing.lg}>
          <View style={[styles.skeleton, { width: '60%', height: 16 }]} />
          <View style={[styles.skeleton, { width: '40%', height: 14, marginTop: Spacing.sm }]} />
          <View style={[styles.skeleton, { width: '100%', height: 14, marginTop: Spacing.md }]} />
          <View style={[styles.skeleton, { width: '80%', height: 14, marginTop: Spacing.sm }]} />
        </Card>
      </View>
    );
  }

  function renderItem({ item }: { item: ResponseItem }) {
    const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.sent;
    const canDeactivate = item.status === 'sent' || item.status === 'viewed';

    return (
      <View style={styles.cardWrapper}>
        <Card padding={Spacing.lg}>
          {/* Title + Status */}
          <View style={styles.topRow}>
            <Text style={styles.requestTitle} numberOfLines={2}>
              {item.request.title || item.request.description}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          {/* City */}
          {item.request.city ? (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.cityText}>{item.request.city}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Price + Deadline */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Цена</Text>
              <Text style={styles.detailValue}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Срок</Text>
              <Text style={styles.detailValue}>{formatDate(item.deadline)}</Text>
            </View>
          </View>

          {/* Comment */}
          {item.comment ? (
            <Text style={styles.comment} numberOfLines={2}>
              {item.comment}
            </Text>
          ) : null}

          {/* Date */}
          <Text style={styles.dateText}>Отправлен: {formatDate(item.createdAt)}</Text>

          {/* Deactivate button */}
          {canDeactivate && (
            <TouchableOpacity
              style={styles.deactivateBtn}
              onPress={() => handleDeactivate(item.id)}
              disabled={deactivatingId === item.id}
              activeOpacity={0.7}
            >
              {deactivatingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.statusError} />
              ) : (
                <Text style={styles.deactivateBtnText}>Деактивировать</Text>
              )}
            </TouchableOpacity>
          )}
        </Card>
      </View>
    );
  }

  const tabBar = (
    <View style={styles.tabBar}>
      {FILTER_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const listHeader = <View>{tabBar}</View>;

  const emptyContent = loading ? (
    <View style={styles.skeletonList}>
      {renderSkeletonCard()}
      {renderSkeletonCard()}
      {renderSkeletonCard()}
    </View>
  ) : error ? (
    <EmptyState
      icon="alert-circle-outline"
      title="Ошибка загрузки"
      subtitle={error}
      ctaLabel="Повторить"
      onCtaPress={() => fetchResponses()}
    />
  ) : (
    <EmptyState
      icon="document-text-outline"
      title="Нет откликов"
      subtitle={
        activeTab === 'all'
          ? 'Вы ещё не откликались ни на один запрос'
          : 'Нет откликов в этой категории'
      }
      ctaLabel={activeTab === 'all' ? 'Смотреть запросы' : undefined}
      onCtaPress={activeTab === 'all' ? () => router.push('/(dashboard)/city-requests') : undefined}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Мои отклики" showBack />
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listContent,
          !isMobile && styles.listContentWide,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListEmptyComponent={emptyContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.sm,
  },
  listContentWide: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Card
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  requestTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  comment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  deactivateBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.statusError,
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
  },
  deactivateBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
  // Skeleton
  skeletonList: {
    gap: Spacing.md,
  },
  skeleton: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.sm,
  },
});
