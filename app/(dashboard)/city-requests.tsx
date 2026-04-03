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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

interface SpecialistProfile {
  cities: string[];
}

interface RequestItem {
  id: string;
  description: string;
  city: string;
  status: string;
  createdAt: string;
  client: { id: string };
  _count: { responses: number };
}

interface FeedResponse {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function CityRequestsScreen() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [myCities, setMyCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Track already-responded request IDs optimistically
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  // Pagination state per city
  const [cityPages, setCityPages] = useState<Record<string, number>>({});
  const [cityHasMore, setCityHasMore] = useState<Record<string, boolean>>({});
  const [loadingMoreCity, setLoadingMoreCity] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const profile = await api.get<SpecialistProfile>('/specialists/me');
      const cities = profile.cities;
      setMyCities(cities);

      if (cities.length === 0) {
        setRequests([]);
        return;
      }

      // Fetch open requests for each city in parallel (page 1)
      const results = await Promise.all(
        cities.map((city) =>
          api
            .get<FeedResponse>(`/requests?city=${encodeURIComponent(city)}&page=1`)
            .catch(() => ({ items: [], total: 0, page: 1, pageSize: 20 }) as FeedResponse),
        ),
      );

      // Track pagination per city
      const pages: Record<string, number> = {};
      const hasMore: Record<string, boolean> = {};
      cities.forEach((city, idx) => {
        const res = results[idx];
        pages[city] = 1;
        hasMore[city] = res.total > res.pageSize;
      });
      setCityPages(pages);
      setCityHasMore(hasMore);

      const seen = new Set<string>();
      const merged: RequestItem[] = [];
      for (const res of results) {
        for (const item of res.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
      }

      // Sort newest first
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(merged);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('no_profile');
      } else {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить запросы');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRefresh() {
    setRefreshing(true);
    // Keep existing respondedIds — do NOT reset on pull-to-refresh
    fetchData(true);
  }

  function openRespond(id: string) {
    Alert.alert(
      'Подтверждение',
      'Откликнуться на этот запрос?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Откликнуться',
          onPress: () => {
            setRespondingId(id);
            setMessage('');
            setModalVisible(true);
          },
        },
      ],
    );
  }

  function closeModal() {
    setModalVisible(false);
    setRespondingId(null);
    setMessage('');
  }

  async function submitResponse() {
    if (!respondingId) return;
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert('Ошибка', 'Введите сообщение для отклика');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/requests/${respondingId}/respond`, { message: trimmed });
      setRespondedIds((prev) => new Set([...prev, respondingId]));
      closeModal();
      Alert.alert('Отклик отправлен', 'Клиент получит уведомление.');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Вы уже откликались на этот запрос.'
            : err.message
          : 'Ошибка при отправке отклика';
      Alert.alert('Ошибка', msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function loadMoreForCity(city: string) {
    const nextPage = (cityPages[city] ?? 1) + 1;
    setLoadingMoreCity(city);
    try {
      const res = await api.get<FeedResponse>(
        `/requests?city=${encodeURIComponent(city)}&page=${nextPage}`,
      );
      const newItems = res.items.filter(
        (item) => !requests.some((r) => r.id === item.id),
      );
      setRequests((prev) => [...prev, ...newItems]);
      setCityPages((prev) => ({ ...prev, [city]: nextPage }));
      setCityHasMore((prev) => ({
        ...prev,
        [city]: nextPage * res.pageSize < res.total,
      }));
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить ещё запросы');
    } finally {
      setLoadingMoreCity(null);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderItem({ item }: { item: RequestItem }) {
    const alreadyResponded = respondedIds.has(item.id);
    return (
      <View style={styles.cardWrapper}>
        <Card padding={Spacing.lg}>
          <View style={styles.metaRow}>
            <View style={styles.cityChip}>
              <Text style={styles.cityText}>{item.city}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.description} numberOfLines={4}>
            {item.description}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.responsesText}>Откликов: {item._count.responses}</Text>
          </View>
          {alreadyResponded ? (
            <View style={styles.respondedBadge}>
              <Text style={styles.respondedText}>Отклик отправлен</Text>
            </View>
          ) : (
            <Button
              onPress={() => openRespond(item.id)}
              variant="primary"
              style={styles.respondBtn}
            >
              Откликнуться
            </Button>
          )}
        </Card>
      </View>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      );
    }

    if (error === 'no_profile') {
      return (
        <EmptyState
          icon="person-outline"
          title="Профиль не найден"
          subtitle="Создайте профиль специалиста, чтобы видеть запросы в ваших городах"
        />
      );
    }

    if (error) {
      return (
        <EmptyState
          icon="alert-circle-outline"
          title="Ошибка загрузки"
          subtitle={error}
          ctaLabel="Повторить"
          onCtaPress={() => fetchData()}
        />
      );
    }

    if (myCities.length === 0) {
      return (
        <EmptyState
          icon="business-outline"
          title="Нет городов в профиле"
          subtitle="Добавьте города в профиль, чтобы видеть запросы"
        />
      );
    }

    if (requests.length === 0) {
      return (
        <EmptyState
          icon="mail-open-outline"
          title="Нет открытых запросов"
          subtitle={`В ваших городах (${myCities.join(', ')}) пока нет запросов`}
        />
      );
    }

    return null;
  };

  const content = renderContent();

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Запросы в моих городах" showBack />

      {myCities.length > 0 && !loading && !error && (
        <View style={styles.citiesBar}>
          <Text style={styles.citiesText}>
            {'Города: '}{myCities.join(', ')}
          </Text>
        </View>
      )}

      {content ? (
        <View style={styles.contentFlex}>{content}</View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.brandPrimary}
            />
          }
          ListFooterComponent={
            myCities.some((c) => cityHasMore[c]) ? (
              <View style={styles.loadMoreWrap}>
                {myCities.filter((c) => cityHasMore[c]).map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={styles.loadMoreBtn}
                    onPress={() => loadMoreForCity(city)}
                    disabled={loadingMoreCity === city}
                  >
                    {loadingMoreCity === city ? (
                      <ActivityIndicator size="small" color={Colors.brandPrimary} />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        {`Ещё запросы: ${city}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />
      )}

      {/* Respond modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ваш отклик</Text>
            <Text style={styles.modalHint}>Кратко опишите, как вы можете помочь</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Здравствуйте! Я специалист по..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              style={styles.messageInput}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <Button onPress={closeModal} variant="ghost" style={styles.modalBtn}>
                Отмена
              </Button>
              <Button
                onPress={submitResponse}
                variant="primary"
                loading={submitting}
                disabled={submitting}
                style={styles.modalBtn}
              >
                Отправить
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  contentFlex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citiesBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  citiesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    maxWidth: 430,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cityChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  footer: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
  },
  responsesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  respondBtn: {
    width: '100%',
  },
  respondedBadge: {
    backgroundColor: Colors.statusBg.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  respondedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  loadMoreWrap: {
    width: '100%',
    maxWidth: 430,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  loadMoreBtn: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  modalHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
  },
  messageInput: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    flex: 1,
  },
});
