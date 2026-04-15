import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ---------------------------------------------------------------------------
// Review Card (matches prototype ReviewCard)
// ---------------------------------------------------------------------------

function ReviewCard({ item, onDelete }: { item: ReviewItem; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const specialistName = item.specialist.specialistProfile?.nick
    ? `@${item.specialist.specialistProfile.nick}`
    : item.specialist.email;

  return (
    <View
      className="gap-2 rounded-[14px] border border-[#BAE6FD] bg-white p-4"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
    >
      {/* Header: author + stars / specialist + date */}
      <View className="flex-row justify-between">
        <View className="gap-1">
          <Text className="text-[15px] font-semibold text-textPrimary">{item.client.email}</Text>
          <View className="flex-row gap-[2px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Feather
                key={i}
                name="star"
                size={14}
                color={i <= item.rating ? Colors.statusWarning : Colors.bgSecondary}
              />
            ))}
          </View>
        </View>
        <View className="items-end gap-1">
          <View className="flex-row items-center gap-1">
            <Feather name="user" size={11} color={Colors.textMuted} />
            <Text className="text-[13px] text-textMuted">{specialistName}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Feather name="calendar" size={11} color={Colors.textMuted} />
            <Text className="text-[13px] text-textMuted">{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Comment text */}
      {item.comment ? (
        <Text
          className="text-[15px] leading-[22px] text-textSecondary"
          numberOfLines={expanded ? undefined : 2}
        >
          {item.comment}
        </Text>
      ) : (
        <Text className="text-[15px] italic text-textMuted">Без комментария</Text>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-2">
        {item.comment && (
          <Pressable
            onPress={() => setExpanded(!expanded)}
            className="flex-row items-center gap-1 rounded-[6px] border border-[#BAE6FD] px-3 py-1"
          >
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textPrimary} />
            <Text className="text-[13px] text-textPrimary">{expanded ? 'Свернуть' : 'Подробнее'}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onDelete}
          className="flex-row items-center gap-1 rounded-[6px] px-3 py-1"
          style={{ backgroundColor: Colors.statusBg.error }}
        >
          <Feather name="trash-2" size={14} color={Colors.statusError} />
          <Text className="text-[13px]" style={{ color: Colors.statusError }}>Удалить</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rating distribution bar
// ---------------------------------------------------------------------------

function RatingBar({ stars, count, pct }: { stars: number; count: number; pct: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="w-[30px] flex-row items-center justify-end gap-[2px]">
        <Text className="text-[13px] text-textMuted">{stars}</Text>
        <Feather name="star" size={12} color={Colors.statusWarning} />
      </View>
      <View className="h-2 flex-1 rounded bg-bgSecondary">
        <View className="h-2 rounded bg-brandPrimary" style={{ width: `${pct}%` }} />
      </View>
      <Text className="w-6 text-[13px] text-textMuted">{count}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type FilterKey = 'all' | 'flagged' | '5' | '4' | 'low';

export default function AdminReviews() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

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
    const specialistName = item.specialist.specialistProfile?.nick ?? item.specialist.email;
    Alert.alert(
      'Удалить отзыв?',
      `Отзыв от ${item.client.email} на ${specialistName}`,
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

  // Compute rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = items.filter((r) => r.rating === stars).length;
    return { stars, count, pct: total > 0 ? Math.round((count / items.length) * 100) : 0 };
  });
  const avgRating = items.length > 0
    ? (items.reduce((sum, r) => sum + r.rating, 0) / items.length).toFixed(1)
    : '0.0';

  // Filter logic
  const filtered = (() => {
    switch (filter) {
      case '5': return items.filter((r) => r.rating === 5);
      case '4': return items.filter((r) => r.rating === 4);
      case 'low': return items.filter((r) => r.rating <= 3);
      default: return items;
    }
  })();

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: '5', label: '5 звёзд' },
    { key: '4', label: '4 звезды' },
    { key: 'low', label: '1-3 звезды' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Отзывы" showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-3 p-4">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full" style={{ backgroundColor: Colors.statusBg.error }}>
              <Feather name="alert-triangle" size={36} color={Colors.statusError} />
            </View>
            <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
            <Text className="max-w-[280px] text-center text-[15px] text-textMuted">{error}</Text>
            <Pressable
              className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-[12px] bg-brandPrimary px-6"
              onPress={() => fetchReviews(1)}
            >
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
              <Text className="text-[13px] font-semibold text-white">Попробовать снова</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 p-4">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-[#BAE6FD] bg-bgSurface">
              <Feather name="star" size={40} color={Colors.brandPrimary} />
            </View>
            <Text className="text-lg font-semibold text-textPrimary">Нет отзывов</Text>
            <Text className="text-center text-[15px] text-textMuted">Отзывы пользователей появятся здесь</Text>
          </View>
        ) : (
          <View className="w-full gap-3 p-4">
            {/* Page header */}
            <View className="gap-1">
              <Text className="text-xl font-bold text-textPrimary">Отзывы</Text>
              <View className="flex-row items-center gap-1">
                <Feather name="star" size={16} color={Colors.statusWarning} />
                <Text className="text-[15px] text-textMuted">{avgRating} средний рейтинг</Text>
                <Text className="text-[13px] text-textMuted">· {total} отзывов</Text>
              </View>
            </View>

            {/* Rating distribution card */}
            <View
              className="gap-2 rounded-[14px] border border-[#BAE6FD] bg-white p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
            >
              {ratingCounts.map((row) => (
                <RatingBar key={row.stars} stars={row.stars} count={row.count} pct={row.pct} />
              ))}
            </View>

            {/* Filter chips */}
            <View className="flex-row flex-wrap gap-2">
              {filters.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-2 ${
                    filter === f.key
                      ? 'border-brandPrimary bg-brandPrimary'
                      : 'border-[#BAE6FD]'
                  }`}
                >
                  <Text
                    className={`text-[13px] ${
                      filter === f.key ? 'font-semibold text-white' : 'text-textMuted'
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Review cards */}
            <View className="gap-2">
              {filtered.map((item) => (
                <ReviewCard key={item.id} item={item} onDelete={() => handleDelete(item)} />
              ))}
            </View>

            {/* Pagination / load more */}
            <View className="flex-row items-center justify-between pt-2">
              <Text className="text-[13px] text-textMuted">
                Показано {filtered.length} из {total}
              </Text>
              {totalPages > 1 && (
                <View className="flex-row gap-1">
                  <Pressable
                    onPress={() => { if (page > 1) fetchReviews(page - 1); }}
                    disabled={page <= 1}
                    className={`h-8 w-8 items-center justify-center rounded-[6px] border border-[#BAE6FD] ${page <= 1 ? 'opacity-40' : ''}`}
                  >
                    <Feather name="chevron-left" size={16} color={Colors.textMuted} />
                  </Pressable>
                  <View className="h-8 w-8 items-center justify-center rounded-[6px] bg-brandPrimary">
                    <Text className="text-[13px] font-semibold text-white">{page}</Text>
                  </View>
                  <Pressable
                    onPress={() => { if (page < totalPages) fetchReviews(page + 1); }}
                    disabled={page >= totalPages}
                    className={`h-8 w-8 items-center justify-center rounded-[6px] border border-[#BAE6FD] ${page >= totalPages ? 'opacity-40' : ''}`}
                  >
                    <Feather name="chevron-right" size={16} color={Colors.textPrimary} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
