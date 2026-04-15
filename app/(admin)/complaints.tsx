import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/Colors';
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
    <View className="flex-1 bg-bgPrimary">
      <Header title="Жалобы" showBack />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View className="w-full max-w-lg px-5 gap-3">
          <Text className="text-xs text-textMuted leading-[18px] py-2">
            Всего жалоб: {total}. Ожидают рассмотрения: {pendingCount}.
          </Text>

          {/* Status filter tabs */}
          <View className="flex-row gap-1">
            {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
              <Pressable
                key={f}
                className={`flex-1 py-2 px-1 rounded-lg items-center border ${filter === f ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                style={filter === f ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                onPress={() => setFilter(f)}
              >
                <Text className={`text-xs font-medium ${filter === f ? 'text-white' : 'text-textSecondary'}`}>
                  {FILTER_LABELS[f]}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginVertical: 24 }} />
          ) : error ? (
            <Text className="text-sm text-statusError text-center py-4">{error}</Text>
          ) : items.length === 0 ? (
            <Text className="text-base text-textMuted text-center py-6">Нет жалоб</Text>
          ) : (
            <View className="gap-2">
              {items.map((item) => (
                <View key={item.id} className="bg-bgCard rounded-xl p-4 border border-border gap-2 shadow-sm">
                  <View className="flex-row justify-between items-center">
                    <Badge
                      variant={STATUS_BADGE[item.status] ?? 'info'}
                      label={STATUS_LABELS[item.status] ?? item.status}
                    />
                    <Text className="text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-sm text-textMuted font-medium">Причина: </Text>
                    <Text className="text-sm text-textPrimary font-semibold">{REASON_LABELS[item.reason] ?? item.reason}</Text>
                  </View>

                  {item.comment ? (
                    <Text className="text-sm text-textSecondary leading-[18px] italic" numberOfLines={3}>{item.comment}</Text>
                  ) : null}

                  <View className="gap-0.5">
                    <Text className="text-sm text-textSecondary">
                      <Text className="text-textMuted font-medium">Отправитель: </Text>
                      <Text className="text-textSecondary">
                        {item.reporter.username ? `@${item.reporter.username}` : item.reporter.email}
                      </Text>
                    </Text>
                    <Text className="text-sm text-textSecondary">
                      <Text className="text-textMuted font-medium">Цель: </Text>
                      <Text className="text-textSecondary">
                        {item.target.specialistProfile?.nick
                          ? `@${item.target.specialistProfile.nick}`
                          : item.target.username
                            ? `@${item.target.username}`
                            : item.target.email}
                      </Text>
                    </Text>
                  </View>

                  {item.status === 'PENDING' && (
                    <View className="flex-row gap-2 mt-1">
                      {actionLoading[item.id] ? (
                        <ActivityIndicator size="small" color={Colors.brandPrimary} style={{ flex: 1, paddingVertical: 8 }} />
                      ) : (
                        <>
                          <Pressable
                            className="flex-1 py-2 rounded-lg bg-bgSecondary border items-center"
                            style={{ borderColor: Colors.statusSuccess }}
                            onPress={() => handleStatusChange(item, 'REVIEWED')}
                          >
                            <Text className="text-sm font-medium" style={{ color: Colors.statusSuccess }}>Рассмотрено</Text>
                          </Pressable>
                          <Pressable
                            className="flex-1 py-2 rounded-lg bg-bgSecondary border items-center"
                            style={{ borderColor: Colors.statusError }}
                            onPress={() => handleStatusChange(item, 'DISMISSED')}
                          >
                            <Text className="text-sm font-medium" style={{ color: Colors.statusError }}>Отклонить</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {!loading && totalPages > 1 && (
            <View className="flex-row justify-between items-center py-4 gap-3">
              <Pressable
                className="py-2 px-4 rounded-lg bg-bgCard border border-border"
                style={{ opacity: page <= 1 ? 0.4 : 1 }}
                onPress={() => { if (page > 1) fetchComplaints(page - 1); }}
                disabled={page <= 1}
              >
                <Text className="text-sm font-medium text-textPrimary">Назад</Text>
              </Pressable>
              <Text className="text-sm text-textMuted">{page} / {totalPages}</Text>
              <Pressable
                className="py-2 px-4 rounded-lg bg-bgCard border border-border"
                style={{ opacity: page >= totalPages ? 0.4 : 1 }}
                onPress={() => { if (page < totalPages) fetchComplaints(page + 1); }}
                disabled={page >= totalPages}
              >
                <Text className="text-sm font-medium text-textPrimary">Вперёд</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
