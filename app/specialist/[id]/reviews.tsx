import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '../../../constants/Colors';
import { Card, Container, EmptyState, Heading, Rating, Screen, Text } from '../../../components/ui';
import { Header } from '../../../components/Header';
import * as api from '../../../lib/api/endpoints';

function ReviewCard({ item }: { item: any }) {
  const date = new Date(item.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card variant="outlined" padding="md">
      <View style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Rating value={item.rating} size="md" showNumeric={false} />
          <Text variant="caption">{date}</Text>
        </View>
        {item.comment ? (
          <Text style={{ lineHeight: 22, color: Colors.textSecondary }}>{item.comment}</Text>
        ) : null}
        <Text variant="caption" weight="semibold">{item.client?.username || 'Клиент'}</Text>
      </View>
    </Card>
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
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Отзывы" onBack={() => router.back()} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
          <Container>
            <View style={{ gap: Spacing.md }}>
              {avgRating != null ? (
                <Card variant="outlined" padding="md" style={{ backgroundColor: Colors.bgSecondary }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Heading level={3}>{avgRating.toFixed(1)}</Heading>
                    <Feather name="star" size={20} color={Colors.amber} />
                    <Text variant="caption">({total} отзывов)</Text>
                  </View>
                </Card>
              ) : null}

              {reviews.length === 0 ? (
                <EmptyState
                  icon={<Feather name="star" size={32} color={Colors.border} />}
                  title="Отзывов пока нет"
                />
              ) : (
                reviews.map((r) => <ReviewCard key={r.id} item={r} />)
              )}

              {reviews.length < total ? (
                <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
                  {loadingMore ? (
                    <ActivityIndicator color={Colors.brandPrimary} />
                  ) : (
                    <Pressable onPress={() => load(page + 1, true)} style={{ paddingVertical: Spacing.sm }}>
                      <Text weight="semibold" style={{ color: Colors.brandPrimary }}>Загрузить ещё</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          </Container>
        </ScrollView>
      )}
    </Screen>
  );
}
