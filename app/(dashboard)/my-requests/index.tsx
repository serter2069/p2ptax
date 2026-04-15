import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useBreakpoints } from '../../../hooks/useBreakpoints';
import { useAuth } from '../../../stores/authStore';

interface SpecialistProfile {
  nick?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ResponseItem {
  id: string;
  comment: string;
  specialist: { id: string; email: string; specialistProfile?: SpecialistProfile | null };
  createdAt: string;
}

interface RequestItem {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  status: string;
  createdAt: string;
  _count: { responses: number };
  responses: ResponseItem[];
}

type Tab = 'active' | 'closed';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} в ${hours}:${mins}`;
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, numColumns } = useBreakpoints();
  const isClient = user?.role === 'CLIENT';
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('active');

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<RequestItem[]>('/requests/my');
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить запросы.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function handleRefresh() {
    setRefreshing(true);
    fetchRequests(true);
  }

  const ACTIVE_STATUSES = ['OPEN', 'NEW', 'IN_PROGRESS', 'CLOSING_SOON'];
  const filtered = items.filter((r) =>
    tab === 'active'
      ? ACTIVE_STATUSES.includes(r.status)
      : !ACTIVE_STATUSES.includes(r.status),
  );

  function getStatusConfig(status: string) {
    switch (status) {
      case 'OPEN':
        return { label: 'Открыт', bg: Colors.statusBg.info, color: Colors.brandPrimary };
      case 'NEW':
        return { label: 'Новая', bg: Colors.statusBg.info, color: Colors.brandPrimary };
      case 'IN_PROGRESS':
        return { label: 'В работе', bg: Colors.statusBg.warning, color: Colors.statusWarning };
      case 'CLOSING_SOON':
        return { label: 'Скоро закроется', bg: Colors.statusBg.warning, color: Colors.statusWarning };
      case 'CANCELLED':
        return { label: 'Отменена', bg: Colors.statusBg.error, color: Colors.statusError };
      default:
        return { label: 'Закрыт', bg: '#FEF3C7', color: Colors.textMuted };
    }
  }

  function renderItem({ item }: { item: RequestItem }) {
    const statusCfg = getStatusConfig(item.status);
    const title = item.description.length > 60
      ? item.description.slice(0, 60) + '...'
      : item.description;
    const responseCount = item._count.responses;

    return (
      <Pressable
        className={isMobile ? 'w-full max-w-[430px] mt-3' : 'flex-1 mt-3'}
        onPress={() => router.push(`/(dashboard)/my-requests/${item.id}`)}
      >
        <Card padding={16}>
          {/* Title */}
          <Text className="text-base font-semibold text-textPrimary mb-2 leading-[22px]" numberOfLines={2}>
            {title}
          </Text>

          {/* City + date row */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="bg-bgSecondary px-2 py-0.5 rounded-full border border-borderLight">
              <Text className="text-xs text-textSecondary font-medium">{item.city}</Text>
            </View>
            <Text className="text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
          </View>

          {/* Budget + Category */}
          {(item.budget != null || item.category) ? (
            <View className="flex-row items-center gap-2 mb-2">
              {item.category ? (
                <View className="bg-bgSecondary px-2 py-0.5 rounded-full border border-borderLight">
                  <Text className="text-xs text-brandPrimary font-medium">{item.category}</Text>
                </View>
              ) : null}
              {item.budget != null ? (
                <Text className="text-xs text-textSecondary font-medium">{item.budget.toLocaleString('ru-RU')} &#8381;</Text>
              ) : null}
            </View>
          ) : null}

          {/* Footer */}
          <View className="flex-row justify-between items-center pt-2 border-t border-border">
            <Pressable
              className="py-0.5"
              onPress={() => router.push(`/(dashboard)/my-requests/${item.id}`)}
            >
              <Text className="text-sm text-brandPrimary font-medium">
                {responseCount > 0
                  ? `Смотреть отклики (${responseCount})`
                  : 'Нет откликов'}
              </Text>
            </Pressable>
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusCfg.bg }}>
              <Text className="text-xs font-medium" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      {isMobile && <Header title="Мои запросы" showBack={isMobile} />}

      {/* Tabs */}
      <View className={`flex-row px-4 pt-3 pb-2 gap-2 self-center w-full ${isMobile ? 'max-w-[430px]' : 'max-w-[500px] self-start'}`}>
        <Pressable
          className={`flex-1 h-10 rounded-lg items-center justify-center border ${tab === 'active' ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
          style={tab === 'active' ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
          onPress={() => setTab('active')}
        >
          <Text className={`text-sm font-medium ${tab === 'active' ? 'text-white font-semibold' : 'text-textMuted'}`}>
            Активные
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 h-10 rounded-lg items-center justify-center border ${tab === 'closed' ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
          style={tab === 'closed' ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
          onPress={() => setTab('closed')}
        >
          <Text className={`text-sm font-medium ${tab === 'closed' ? 'text-white font-semibold' : 'text-textMuted'}`}>
            Закрытые
          </Text>
        </Pressable>
      </View>

      <FlatList
        key={numColumns}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={numColumns}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          alignItems: isMobile ? 'center' : 'stretch',
        }}
        columnWrapperStyle={numColumns > 1 ? { gap: 12, marginBottom: 12 } : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View className="pt-10 items-center">
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchRequests()}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title={tab === 'active' ? 'Нет активных запросов' : 'Нет закрытых запросов'}
              subtitle={tab === 'active' && isClient ? 'Создайте свой первый запрос' : undefined}
              ctaLabel={tab === 'active' && isClient ? 'Создать запрос' : undefined}
              onCtaPress={tab === 'active' && isClient ? () => router.push('/(dashboard)/my-requests/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          !loading && filtered.length > 0 && isClient ? (
            <View className={`w-full pt-5 ${isMobile ? 'max-w-[430px]' : 'max-w-[250px]'}`}>
              <Button
                onPress={() => router.push('/(dashboard)/my-requests/new')}
                variant="primary"
                style={{ width: '100%' }}
              >
                Создать запрос
              </Button>
            </View>
          ) : null
        }
      />
    </View>
  );
}
