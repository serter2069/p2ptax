import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { useRouter } from 'expo-router';
import * as api from '../../lib/api/endpoints';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Feather key={n} name="star" size={12} color={n <= rating ? '#F59E0B' : Colors.border} />
      ))}
    </View>
  );
}

function ReviewRow({ item, onDelete }: { item: any; onDelete: (id: string) => void }) {
  const date = new Date(item.createdAt).toLocaleDateString('ru-RU');
  const specialist = item.specialist?.specialistProfile?.nick || item.specialist?.email || '—';
  const client = item.client?.email || '—';

  function confirmDelete() {
    Alert.alert('Удалить отзыв?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  }

  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <View style={s.rowHeader}>
          <StarDisplay rating={item.rating} />
          <Text style={s.rowDate}>{date}</Text>
        </View>
        {item.comment ? (
          <Text style={s.rowComment} numberOfLines={2}>{item.comment}</Text>
        ) : (
          <Text style={s.rowNoComment}>Без комментария</Text>
        )}
        <View style={s.rowMeta}>
          <Text style={s.metaText}>Специалист: <Text style={s.metaBold}>{specialist}</Text></Text>
          <Text style={s.metaText}>Клиент: <Text style={s.metaBold}>{client}</Text></Text>
        </View>
      </View>
      <Pressable onPress={confirmDelete} style={s.deleteBtn}>
        <Feather name="trash-2" size={16} color={Colors.statusError} />
      </Pressable>
    </View>
  );
}

export default function AdminReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await api.admin.getReviews({ page: p });
      const data = res.data as { items: any[]; total: number };
      setReviews(data.items);
      setTotal(data.total);
      setPage(p);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  async function handleDelete(id: string) {
    try {
      setDeleting(id);
      await api.admin.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } catch {
      Alert.alert('Ошибка', 'Не удалось удалить отзыв');
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Отзывы" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Модерация отзывов</Text>
          <Text style={s.pageSubtitle}>Всего: {total}</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.brandPrimary} /></View>
        ) : reviews.length === 0 ? (
          <View style={s.empty}>
            <Feather name="star" size={32} color={Colors.border} />
            <Text style={s.emptyText}>Отзывов нет</Text>
          </View>
        ) : (
          <>
            {reviews.map((r) => (
              <ReviewRow
                key={r.id}
                item={r}
                onDelete={deleting ? () => {} : handleDelete}
              />
            ))}
            {totalPages > 1 && (
              <View style={s.pagination}>
                <Pressable
                  style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                  onPress={() => page > 1 && load(page - 1)}
                  disabled={page <= 1}
                >
                  <Feather name="chevron-left" size={16} color={page <= 1 ? Colors.textMuted : Colors.brandPrimary} />
                </Pressable>
                <Text style={s.pageInfo}>{page} / {totalPages}</Text>
                <Pressable
                  style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                  onPress={() => page < totalPages && load(page + 1)}
                  disabled={page >= totalPages}
                >
                  <Feather name="chevron-right" size={16} color={page >= totalPages ? Colors.textMuted : Colors.brandPrimary} />
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  pageHeader: { gap: Spacing.xs, marginBottom: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  center: { paddingVertical: Spacing['3xl'], alignItems: 'center' },
  empty: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['3xl'] },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },

  row: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  rowMain: { flex: 1, gap: Spacing.xs },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  rowComment: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  rowNoComment: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  rowMeta: { gap: 2 },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaBold: { fontWeight: Typography.fontWeight.semibold, color: Colors.textSecondary },

  deleteBtn: {
    padding: Spacing.sm,
    alignSelf: 'flex-start',
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: Typography.fontSize.base, color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold },
});
