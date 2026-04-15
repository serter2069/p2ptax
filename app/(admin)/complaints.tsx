import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Badge } from '../../components/Badge';

interface ComplaintItem {
  id: string;
  reason: string;
  comment: string | null;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    username: string | null;
  };
  target: {
    id: string;
    email: string;
    username: string | null;
    specialistProfile: { nick: string; displayName: string | null } | null;
  };
}

interface ComplaintsResponse {
  items: ComplaintItem[];
  total: number;
  page: number;
  pageSize: number;
}

type StatusFilter = 'ALL' | 'PENDING' | 'REVIEWED' | 'DISMISSED';

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'Все',
  PENDING: 'Новые',
  REVIEWED: 'Рассмотрено',
  DISMISSED: 'Отклонено',
};

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'info'> = {
  PENDING: 'warning',
  REVIEWED: 'success',
  DISMISSED: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  REVIEWED: 'Рассмотрено',
  DISMISSED: 'Отклонено',
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Спам',
  fraud: 'Мошенничество',
  inappropriate: 'Неприемлемый контент',
  other: 'Другое',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export default function AdminComplaints() {
  const [items, setItems] = useState<ComplaintItem[]>([]);
  const [allItems, setAllItems] = useState<ComplaintItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchComplaints = useCallback(async (p: number, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<ComplaintsResponse>(`/complaints/admin?page=${p}`);
      setAllItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(1); }, [fetchComplaints]);

  // Apply local filter
  useEffect(() => {
    if (filter === 'ALL') {
      setItems(allItems);
    } else {
      setItems(allItems.filter((c) => c.status === filter));
    }
  }, [filter, allItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaints(1, true);
  };

  const handleStatusChange = async (complaint: ComplaintItem, newStatus: 'REVIEWED' | 'DISMISSED') => {
    if (actionLoading[complaint.id]) return;
    const label = newStatus === 'REVIEWED' ? 'Рассмотрено' : 'Отклонить';
    Alert.alert(
      label,
      `Изменить статус жалобы на "${STATUS_LABELS[newStatus]}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: label,
          onPress: async () => {
            setActionLoading((prev) => ({ ...prev, [complaint.id]: true }));
            try {
              await api.patch(`/complaints/admin/${complaint.id}`, { status: newStatus });
              setAllItems((prev) =>
                prev.map((c) => c.id === complaint.id ? { ...c, status: newStatus } : c)
              );
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message ?? 'Не удалось обновить статус');
            } finally {
              setActionLoading((prev) => ({ ...prev, [complaint.id]: false }));
            }
          },
        },
      ],
    );
  };

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pendingCount = allItems.filter((c) => c.status === 'PENDING').length;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Жалобы" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.hint}>
            Всего жалоб: {total}. Ожидают рассмотрения: {pendingCount}.
          </Text>

          {/* Status filter tabs */}
          <View style={styles.filterRow}>
            {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {FILTER_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>Нет жалоб</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Badge
                      variant={STATUS_BADGE[item.status] ?? 'info'}
                      label={STATUS_LABELS[item.status] ?? item.status}
                    />
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  </View>

                  <View style={styles.reasonRow}>
                    <Text style={styles.reasonLabel}>Причина: </Text>
                    <Text style={styles.reasonValue}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
                  </View>

                  {item.comment ? (
                    <Text style={styles.comment} numberOfLines={3}>{item.comment}</Text>
                  ) : null}

                  <View style={styles.meta}>
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Отправитель: </Text>
                      <Text style={styles.metaValue}>
                        {item.reporter.username ? `@${item.reporter.username}` : item.reporter.email}
                      </Text>
                    </Text>
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Цель: </Text>
                      <Text style={styles.metaValue}>
                        {item.target.specialistProfile?.nick
                          ? `@${item.target.specialistProfile.nick}`
                          : item.target.username
                            ? `@${item.target.username}`
                            : item.target.email}
                      </Text>
                    </Text>
                  </View>

                  {item.status === 'PENDING' && (
                    <View style={styles.actionRow}>
                      {actionLoading[item.id] ? (
                        <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.cardLoader} />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.reviewBtn}
                            onPress={() => handleStatusChange(item, 'REVIEWED')}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.reviewBtnText}>Рассмотрено</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dismissBtn}
                            onPress={() => handleStatusChange(item, 'DISMISSED')}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.dismissBtnText}>Отклонить</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {!loading && totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                onPress={() => { if (page > 1) fetchComplaints(page - 1); }}
                disabled={page <= 1}
                activeOpacity={0.75}
              >
                <Text style={styles.pageBtnText}>Назад</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                onPress={() => { if (page < totalPages) fetchComplaints(page + 1); }}
                disabled={page >= totalPages}
                activeOpacity={0.75}
              >
                <Text style={styles.pageBtnText}>Вперёд</Text>
              </TouchableOpacity>
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
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    paddingVertical: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  filterTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  reasonValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  comment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  meta: {
    gap: 2,
  },
  metaRow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  metaLabel: {
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  metaValue: {
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  reviewBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.statusSuccess,
    alignItems: 'center',
  },
  reviewBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusSuccess,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.statusError,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusError,
  },
  cardLoader: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  pageBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  pageInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});
