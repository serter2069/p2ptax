import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Badge } from '../../components/Badge';

interface RequestItem {
  id: string;
  description: string;
  city: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  client: { id: string; email: string };
  _count: { responses: number };
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Открыт',
  CLOSED: 'Закрыт',
  CANCELLED: 'Отменён',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  OPEN: 'success',
  CLOSED: 'warning',
  CANCELLED: 'error',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ items: RequestItem[]; total: number }>('/admin/requests');
      setRequests(data.items);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRefresh = () => { setRefreshing(true); fetchRequests(true); };

  // Simple counters
  const openCount = requests.filter((r) => r.status === 'OPEN').length;
  const closedCount = requests.filter((r) => r.status === 'CLOSED').length;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Все запросы" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          {/* Summary row */}
          {!loading && !error && requests.length > 0 ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{requests.length}</Text>
                <Text style={styles.summaryLabel}>Всего</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: Colors.statusSuccess }]}>{openCount}</Text>
                <Text style={styles.summaryLabel}>Открытых</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: Colors.textMuted }]}>{closedCount}</Text>
                <Text style={styles.summaryLabel}>Закрытых</Text>
              </View>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : requests.length === 0 ? (
            <Text style={styles.emptyText}>Нет запросов</Text>
          ) : (
            <View style={styles.list}>
              {requests.map((r) => (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.city}>{r.city}</Text>
                    <Badge
                      variant={STATUS_BADGE[r.status] ?? 'info'}
                      label={STATUS_LABELS[r.status] ?? r.status}
                    />
                  </View>
                  <Text style={styles.description} numberOfLines={2}>{r.description}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.meta} numberOfLines={1}>{r.client.email}</Text>
                    <Text style={styles.meta}>{formatDate(r.createdAt)}</Text>
                    <Text style={styles.responseCount}>
                      {r._count.responses} отклик{r._count.responses === 1 ? '' : r._count.responses < 5 ? 'а' : 'ов'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textAccent,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  loader: {
    marginVertical: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing['2xl'],
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  city: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  meta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  responseCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.medium,
  },
});
