import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { api, ApiError } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/ui/EmptyState';

interface SpecialistProfile {
  cities: string[];
}

interface RequestItem {
  id: string;
  description: string;
  city: string;
  category: string | null;
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
  const { isMobile } = useBreakpoints();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [myCities, setMyCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cityPages, setCityPages] = useState<Record<string, number>>({});
  const [cityHasMore, setCityHasMore] = useState<Record<string, boolean>>({});
  const [loadingMoreCity, setLoadingMoreCity] = useState<string | null>(null);

  const SEEN_STORAGE_KEY = 'p2ptax_seen_city_requests';
  const SEEN_CAP = 500;

  const loadSeenIds = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SEEN_STORAGE_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        setSeenIds(new Set(arr));
      }
    } catch {
      // Silently ignore
    }
  }, []);

  const persistSeenIds = useCallback(async (ids: Set<string>) => {
    try {
      const arr = Array.from(ids).slice(-SEEN_CAP);
      await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // Silently ignore
    }
  }, []);

  const markAsSeen = useCallback(
    (id: string) => {
      setSeenIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        persistSeenIds(next);
        return next;
      });
    },
    [persistSeenIds],
  );

  const markAllSeen = useCallback(() => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      return next;
    });
    setRequests((currentRequests) => {
      setSeenIds((prev) => {
        const next = new Set(prev);
        for (const r of currentRequests) next.add(r.id);
        persistSeenIds(next);
        return next;
      });
      return currentRequests;
    });
  }, [persistSeenIds]);

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

      const results = await Promise.all(
        cities.map((city) =>
          api
            .get<FeedResponse>(`/requests?city=${encodeURIComponent(city)}&page=1`)
            .catch(() => ({ items: [], total: 0, page: 1, pageSize: 20 }) as FeedResponse),
        ),
      );

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
    loadSeenIds();
    fetchData();
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30_000);
    return () => clearInterval(intervalId);
  }, [fetchData, loadSeenIds]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  function openRespond(id: string) {
    markAsSeen(id);
    setRespondingId(id);
    setMessage('');
    setModalVisible(true);
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
    const isNew = !seenIds.has(item.id) && !alreadyResponded;
    return (
      <View className="w-full max-w-[430px] mb-3">
        <Card padding={16}>
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-1 shrink">
              <View className="bg-bgSecondary px-2 py-0.5 rounded-full border border-borderLight">
                <Text className="text-xs text-textSecondary font-medium">{item.city}</Text>
              </View>
              {item.category ? (
                <View className="bg-bgSecondary px-2 py-0.5 rounded-full border border-borderLight">
                  <Text className="text-xs text-textMuted font-medium">{item.category}</Text>
                </View>
              ) : null}
              {isNew && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: Colors.bgSecondary }}>
                  <Text className="text-xs font-semibold" style={{ color: Colors.statusInfo }}>Новый</Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
          </View>
          <Text className="text-base text-textPrimary leading-[22px] mb-3" numberOfLines={4}>
            {item.description.length > 200
              ? item.description.slice(0, 200) + '...'
              : item.description}
          </Text>
          <View className="pt-2 border-t border-border mb-3">
            <Text className="text-xs text-textMuted">Откликов: {item._count.responses}</Text>
          </View>
          {alreadyResponded ? (
            <View className="rounded-lg py-2 items-center" style={{ backgroundColor: Colors.bgSecondary }}>
              <Text className="text-sm font-medium" style={{ color: Colors.statusSuccess }}>Отклик отправлен</Text>
            </View>
          ) : (
            <Button
              onPress={() => openRespond(item.id)}
              variant="primary"
              style={{ width: '100%' }}
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
        <View className="flex-1 items-center justify-center">
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

  const uniqueCategories = React.useMemo(() => {
    const cats = new Set<string>();
    for (const r of requests) {
      if (r.category) cats.add(r.category);
    }
    return Array.from(cats).sort();
  }, [requests]);

  const filteredRequests = React.useMemo(() => {
    if (!selectedCategory) return requests;
    return requests.filter((r) => r.category === selectedCategory);
  }, [requests, selectedCategory]);

  const content = renderContent();

  return (
    <View className="flex-1 bg-bgPrimary">
      {isMobile && <Header title="Запросы в моих городах" showBack />}

      {myCities.length > 0 && !loading && !error && (
        <View className="px-4 py-2 bg-bgSecondary border-b border-border items-center gap-1">
          <Text className="text-xs text-textMuted max-w-[430px] w-full">
            {'Города: '}{myCities.join(', ')}
          </Text>
          {requests.some((r) => !seenIds.has(r.id) && !respondedIds.has(r.id)) && (
            <Pressable onPress={markAllSeen} className="max-w-[430px] w-full">
              <Text className="text-xs text-brandPrimary font-medium">Отметить все прочитанными</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Category filter chips */}
      {uniqueCategories.length > 0 && !loading && !error && (
        <View className="py-2 border-b border-border bg-bgPrimary">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
          >
            <Pressable
              className={`px-3 py-1.5 rounded-full border ${!selectedCategory ? 'border-brandPrimary' : 'border-border bg-bgSecondary'}`}
              style={!selectedCategory ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
              onPress={() => setSelectedCategory(null)}
            >
              <Text className={`text-xs font-medium ${!selectedCategory ? 'text-white' : 'text-textSecondary'}`}>
                Все
              </Text>
            </Pressable>
            {uniqueCategories.map((cat) => (
              <Pressable
                key={cat}
                className={`px-3 py-1.5 rounded-full border ${selectedCategory === cat ? 'border-brandPrimary' : 'border-border bg-bgSecondary'}`}
                style={selectedCategory === cat ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text className={`text-xs font-medium ${selectedCategory === cat ? 'text-white' : 'text-textSecondary'}`}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {content ? (
        <View className="flex-1">{content}</View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, alignItems: 'center', paddingTop: 12 }}
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
              <View className="w-full max-w-[430px] gap-2 mb-4">
                {myCities.filter((c) => cityHasMore[c]).map((city) => (
                  <Pressable
                    key={city}
                    className="bg-bgCard border border-border rounded-lg py-3 items-center"
                    onPress={() => loadMoreForCity(city)}
                    disabled={loadingMoreCity === city}
                  >
                    {loadingMoreCity === city ? (
                      <ActivityIndicator size="small" color={Colors.brandPrimary} />
                    ) : (
                      <Text className="text-sm text-brandPrimary font-medium">
                        {`Ещё запросы: ${city}`}
                      </Text>
                    )}
                  </Pressable>
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
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="bg-bgCard rounded-t-2xl p-6 gap-3 self-center w-full max-w-[430px]">
            <Text className="text-lg font-semibold text-textPrimary">Ваш отклик</Text>
            <Text className="text-sm text-textMuted -mt-1">Кратко опишите, как вы можете помочь</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Здравствуйте! Я специалист по..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              className="bg-bgSecondary border border-border rounded-lg p-4 text-base text-textPrimary min-h-[100px]"
              style={{ outlineStyle: 'none', textAlignVertical: 'top' } as any}
              autoFocus
            />
            <Text className="text-xs text-textMuted text-right -mt-1">{message.length}/500</Text>
            <View className="flex-row gap-2 mt-1">
              <Button onPress={closeModal} variant="ghost" style={{ flex: 1 }}>
                Отмена
              </Button>
              <Button
                onPress={submitResponse}
                variant="primary"
                loading={submitting}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Отправить
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
