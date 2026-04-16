import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/Colors';
import { Card, Container, EmptyState, Heading, Rating, Screen, Text } from '../../components/ui';
import { Header } from '../../components/Header';
import { useRouter } from 'expo-router';
import * as api from '../../lib/api/endpoints';

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
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Rating value={item.rating} size="sm" showNumeric={false} />
            <Text variant="caption">{date}</Text>
          </View>
          {item.comment ? (
            <Text variant="caption" numberOfLines={2} style={{ lineHeight: 20 }}>
              {item.comment}
            </Text>
          ) : (
            <Text variant="caption" style={{ fontStyle: 'italic' }}>
              Без комментария
            </Text>
          )}
          <View style={{ gap: 2 }}>
            <Text variant="caption">
              Специалист: <Text variant="caption" weight="semibold">{specialist}</Text>
            </Text>
            <Text variant="caption">
              Клиент: <Text variant="caption" weight="semibold">{client}</Text>
            </Text>
          </View>
        </View>
        <Pressable
          onPress={confirmDelete}
          style={{ padding: Spacing.sm, alignSelf: 'flex-start' }}
          accessibilityLabel="Удалить отзыв"
        >
          <Feather name="trash-2" size={16} color={Colors.statusError} />
        </Pressable>
      </View>
    </Card>
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
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Отзывы" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.md }}>
            <View style={{ gap: Spacing.xs, marginBottom: Spacing.sm }}>
              <Heading level={2}>Модерация отзывов</Heading>
              <Text variant="caption">Всего: {total}</Text>
            </View>

            {loading ? (
              <View style={{ paddingVertical: Spacing['3xl'], alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.brandPrimary} />
              </View>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={<Feather name="star" size={32} color={Colors.border} />}
                title="Отзывов нет"
              />
            ) : (
              <>
                {reviews.map((r) => (
                  <ReviewRow
                    key={r.id}
                    item={r}
                    onDelete={deleting ? () => {} : handleDelete}
                  />
                ))}
                {totalPages > 1 ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.lg,
                    marginTop: Spacing.md,
                  }}>
                    <Pressable
                      onPress={() => page > 1 && load(page - 1)}
                      disabled={page <= 1}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: Colors.bgSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: page <= 1 ? 0.4 : 1,
                      }}
                    >
                      <Feather name="chevron-left" size={16} color={page <= 1 ? Colors.textMuted : Colors.brandPrimary} />
                    </Pressable>
                    <Text weight="semibold">{page} / {totalPages}</Text>
                    <Pressable
                      onPress={() => page < totalPages && load(page + 1)}
                      disabled={page >= totalPages}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: Colors.bgSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: page >= totalPages ? 0.4 : 1,
                      }}
                    >
                      <Feather name="chevron-right" size={16} color={page >= totalPages ? Colors.textMuted : Colors.brandPrimary} />
                    </Pressable>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
