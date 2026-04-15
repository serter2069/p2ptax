import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { useBreakpoints } from '../../hooks/useBreakpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ResponseStatus = 'sent' | 'viewed' | 'accepted' | 'deactivated';
type FilterKey = 'all' | 'active' | 'deactivated';

interface ResponseItem {
  id: string;
  comment: string;
  price: number;
  deadline: string;
  status: ResponseStatus;
  createdAt: string;
  request: {
    id: string;
    title?: string;
    description: string;
    city: string;
    status: string;
    createdAt: string;
    clientId: string;
  };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<ResponseStatus, { label: string; bgClass: string; textClass: string; icon: string }> = {
  sent: { label: 'Отправлен', bgClass: 'bg-blue-50', textClass: 'text-statusInfo', icon: 'send' },
  viewed: { label: 'Просмотрен', bgClass: 'bg-amber-50', textClass: 'text-statusWarning', icon: 'eye' },
  accepted: { label: 'Принят', bgClass: 'bg-green-50', textClass: 'text-statusSuccess', icon: 'check-circle' },
  deactivated: { label: 'Деактивирован', bgClass: 'bg-red-50', textClass: 'text-statusError', icon: 'x-circle' },
};

const STATUS_ICON_COLORS: Record<ResponseStatus, string> = {
  sent: Colors.statusInfo,
  viewed: Colors.statusWarning,
  accepted: Colors.statusSuccess,
  deactivated: Colors.statusError,
};

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'deactivated', label: 'Деактивированные' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function filterResponses(items: ResponseItem[], tab: FilterKey): ResponseItem[] {
  if (tab === 'active') return items.filter((r) => r.status !== 'deactivated');
  if (tab === 'deactivated') return items.filter((r) => r.status === 'deactivated');
  return items;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' \u20BD';
}

function pluralResponses(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отклик`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} отклика`;
  return `${n} откликов`;
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: ResponseStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View className={`ml-auto flex-row items-center gap-1 rounded-full px-2 py-0.5 ${cfg.bgClass}`}>
      <Feather name={cfg.icon as any} size={12} color={STATUS_ICON_COLORS[status]} />
      <Text className={`text-xs font-medium ${cfg.textClass}`}>{cfg.label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Filter Chips
// ---------------------------------------------------------------------------
function FilterChips({ active, onChange }: { active: FilterKey; onChange: (f: FilterKey) => void }) {
  return (
    <View className="flex-row gap-2">
      {FILTER_TABS.map((f) => (
        <Pressable
          key={f.key}
          onPress={() => onChange(f.key)}
          className={`h-9 items-center justify-center rounded-full border px-4 ${
            active === f.key
              ? 'border-brandPrimary bg-brandPrimary'
              : 'border-border bg-white'
          }`}
        >
          <Text
            className={`text-sm ${
              active === f.key ? 'font-semibold text-white' : 'font-medium text-textMuted'
            }`}
          >
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Response Card
// ---------------------------------------------------------------------------
function ResponseCard({
  item,
  onNavigate,
  onDeactivate,
}: {
  item: ResponseItem;
  onNavigate: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  const isAccepted = item.status === 'accepted';
  const canDeactivate = item.status === 'sent' || item.status === 'viewed';

  return (
    <Pressable onPress={() => onNavigate(item.request.id)}>
      <View className="gap-2 rounded-xl border border-borderLight bg-white p-4 shadow-sm">
        {/* Title */}
        <Text className="text-base font-semibold text-textPrimary" numberOfLines={2}>
          {item.request.title || item.request.description}
        </Text>

        {/* Meta: city */}
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{item.request.city}</Text>
        </View>

        {/* Info row: price, deadline, status */}
        <View className="mt-0.5 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
            <Text className="text-base font-semibold text-textPrimary">{formatPrice(item.price)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text className="text-base font-semibold text-textPrimary">{formatDate(item.deadline)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Response date */}
        <View className="flex-row items-center gap-1">
          <Feather name="clock" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">Отклик: {formatDate(item.createdAt)}</Text>
        </View>

        {/* Actions */}
        <View className="mt-0.5 flex-row gap-2">
          {canDeactivate && (
            <Pressable
              className="h-9 flex-row items-center gap-1.5 rounded-lg border px-3"
              style={{ borderColor: Colors.statusError, backgroundColor: Colors.statusBg.error }}
              onPress={(e) => { e.stopPropagation(); onDeactivate(item.id); }}
            >
              <Feather name="x-circle" size={16} color={Colors.statusError} />
              <Text className="text-sm font-medium" style={{ color: Colors.statusError }}>Деактивировать</Text>
            </Pressable>
          )}
          {isAccepted && (
            <Pressable
              className="h-9 flex-row items-center gap-1.5 rounded-lg bg-brandPrimary px-4 shadow-sm"
              onPress={() => onNavigate(item.request.id)}
            >
              <Feather name="message-circle" size={16} color={Colors.white} />
              <Text className="text-sm font-semibold text-white">Перейти в чат</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <View className="gap-4 p-4">
      <View className="flex-row items-center gap-2">
        <View className="h-5 w-5 rounded bg-bgSurface" />
        <View className="flex-1 gap-1">
          <View className="h-5 w-1/2 rounded bg-bgSurface" />
          <View className="h-3.5 w-1/3 rounded bg-bgSurface" />
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="h-9 w-14 rounded-full bg-bgSurface" />
        <View className="h-9 w-20 rounded-full bg-bgSurface" />
        <View className="h-9 w-28 rounded-full bg-bgSurface" />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} className="h-40 w-full rounded-xl bg-bgSurface" />
      ))}
      <View className="items-center pt-2">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyResponsesState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View className="items-center gap-3 py-12">
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Feather name="send" size={40} color={Colors.brandPrimary} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">
        Вы ещё не откликались на заявки
      </Text>
      <Text className="max-w-[280px] text-center text-sm text-textMuted">
        Найдите подходящие заявки и предложите свои услуги клиентам
      </Text>
      <Pressable
        className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-8 shadow-sm"
        onPress={onBrowse}
      >
        <Feather name="search" size={16} color={Colors.white} />
        <Text className="text-base font-semibold text-white">Посмотреть заявки</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty Filter State
// ---------------------------------------------------------------------------
function EmptyFilterState() {
  return (
    <View className="items-center gap-2 py-12">
      <Feather name="filter" size={36} color={Colors.textMuted} />
      <Text className="text-base text-textMuted">Нет откликов в этой категории</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function MyResponsesTab() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  const [items, setItems] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<ResponseItem[]>('/requests/my-responses');
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить отклики.');
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
    fetchData(true);
  }

  function handleNavigate(requestId: string) {
    router.push(`/requests/${requestId}` as any);
  }

  async function handleDeactivate(responseId: string) {
    const doDeactivate = async () => {
      try {
        await api.patch(`/responses/${responseId}`, { status: 'deactivated' });
        setItems((prev) =>
          prev.map((r) => (r.id === responseId ? { ...r, status: 'deactivated' as ResponseStatus } : r)),
        );
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Не удалось деактивировать отклик.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Ошибка', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Деактивировать отклик?')) {
        await doDeactivate();
      }
    } else {
      Alert.alert('Деактивировать отклик?', 'Это действие нельзя отменить.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Деактивировать', style: 'destructive', onPress: doDeactivate },
      ]);
    }
  }

  const filtered = filterResponses(items, filter);

  // Loading
  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          maxWidth: isMobile ? undefined : 700,
          alignSelf: isMobile ? undefined : 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        {/* Error */}
        {error && items.length === 0 ? (
          <View className="items-center gap-3 py-12">
            <Feather name="wifi-off" size={48} color={Colors.textMuted} />
            <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
            <Text className="max-w-[280px] text-center text-sm text-textMuted">{error}</Text>
            <Pressable
              className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
              onPress={() => fetchData()}
            >
              <Text className="text-sm font-semibold text-white">Повторить</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          /* Empty — no responses */
          <>
            <View className="flex-row items-center gap-2">
              <Feather name="mail" size={20} color={Colors.brandPrimary} />
              <Text className="text-xl font-bold text-textPrimary">Мои отклики</Text>
            </View>
            <EmptyResponsesState onBrowse={() => router.push('/(tabs)/feed' as any)} />
          </>
        ) : (
          /* Populated */
          <>
            {/* Header */}
            <View className="flex-row items-center gap-2">
              <Feather name="mail" size={20} color={Colors.brandPrimary} />
              <View className="flex-1">
                <Text className="text-xl font-bold text-textPrimary">Мои отклики</Text>
                <Text className="text-base text-textMuted">{pluralResponses(items.length)}</Text>
              </View>
            </View>

            {/* Filters */}
            <FilterChips active={filter} onChange={setFilter} />

            {/* List or empty filter */}
            {filtered.length === 0 ? (
              <EmptyFilterState />
            ) : (
              <View className="gap-3">
                {filtered.map((item) => (
                  <ResponseCard
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigate}
                    onDeactivate={handleDeactivate}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
