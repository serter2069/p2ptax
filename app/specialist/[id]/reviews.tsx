import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import * as api from '../../../lib/api/endpoints';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Feather
          key={n}
          name="star"
          size={14}
          color={n <= rating ? '#F59E0B' : Colors.border}
        />
      ))}
    </View>
  );
}

function ReviewCard({ item }: { item: any }) {
  const date = new Date(item.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <StarDisplay rating={item.rating} />
        <Text style={s.dateText}>{date}</Text>
      </View>
      {item.comment ? (
        <Text style={s.comment}>{item.comment}</Text>
      ) : null}
      <Text style={s.clientName}>{item.client?.username || 'Клиент'}</Text>
    </View>
  );
}

export default function SpecialistReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const specialistId = Array.isArray(id) ? id[0] : id;

  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(p: number, append = false) {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await api.reviews.getBySpecialist(specialistId!, p);
      const data = res.data as { items: any[]; total: number; page: number };
      setReviews((prev) => append ? [...prev, ...data.items] : data.items);
      setTotal(data.total);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (specialistId) load(1);
  }, [specialistId]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Отзывы" onBack={() => router.back()} />
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
          {avgRating && (
            <View style={s.summary}>
              <Text style={s.avgValue}>{avgRating}</Text>
              <Feather name="star" size={20} color="#F59E0B" />
              <Text style={s.totalText}>({total} отзывов)</Text>
            </View>
          )}

          {reviews.length === 0 ? (
            <View style={s.empty}>
              <Feather name="star" size={32} color={Colors.border} />
              <Text style={s.emptyText}>Отзывов пока нет</Text>
            </View>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} item={r} />)
          )}

          {reviews.length < total && (
            <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              {loadingMore ? (
                <ActivityIndicator color={Colors.brandPrimary} />
              ) : (
                <Text
                  style={s.loadMore}
                  onPress={() => load(page + 1, true)}
                >
                  Загрузить ещё
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avgValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  totalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starRow: { flexDirection: 'row', gap: 2 },
  dateText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  comment: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  clientName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.semibold,
  },

  empty: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['3xl'] },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },

  loadMore: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
    paddingVertical: Spacing.sm,
  },
});
