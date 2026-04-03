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

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile: { nick: string } | null;
  };
  client: {
    id: string;
    email: string;
  };
}

interface ReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function Stars({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating ? '*' : '·');
  return (
    <Text style={styles.stars}>{stars.join('')} {rating}/5</Text>
  );
}

export default function AdminReviews() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (p: number, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<ReviewsResponse>(`/reviews/admin?page=${p}`);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews(1, true);
  };

  const handleDelete = (item: ReviewItem) => {
    Alert.alert(
      'Удалить отзыв?',
      `Отзыв от ${item.client.email} на ${item.specialist.specialistProfile?.nick ?? item.specialist.email}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/reviews/admin/${item.id}`);
              setItems((prev) => prev.filter((r) => r.id !== item.id));
              setTotal((prev) => prev - 1);
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message ?? 'Failed to delete review');
            }
          },
        },
      ],
    );
  };

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Отзывы" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.hint}>
            Всего отзывов: {total}. Страница {page} из {totalPages}.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>Нет отзывов</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Stars rating={item.rating} />
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  </View>

                  {item.comment ? (
                    <Text style={styles.comment} numberOfLines={3}>{item.comment}</Text>
                  ) : (
                    <Text style={styles.noComment}>Без комментария</Text>
                  )}

                  <View style={styles.meta}>
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Исполнитель: </Text>
                      <Text style={styles.metaValue}>
                        {item.specialist.specialistProfile?.nick
                          ? `@${item.specialist.specialistProfile.nick}`
                          : item.specialist.email}
                      </Text>
                    </Text>
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Клиент: </Text>
                      <Text style={styles.metaValue}>{item.client.email}</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.deleteBtnText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {!loading && totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                onPress={() => { if (page > 1) fetchReviews(page - 1); }}
                disabled={page <= 1}
                activeOpacity={0.75}
              >
                <Text style={styles.pageBtnText}>Назад</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                onPress={() => { if (page < totalPages) fetchReviews(page + 1); }}
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
  stars: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
    letterSpacing: 2,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  comment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  noComment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
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
  deleteBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.statusError,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  deleteBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusError,
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
