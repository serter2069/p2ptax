import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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
interface SpecialistItem {
  id: string;
  nick: string;
  cities: string[];
  services: string[];
  badges: string[];
  contacts: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
}

type FilterKey = 'all' | 'unverified' | 'verified';
type ScreenState = 'queue' | 'detail' | 'approved' | 'rejected';

const VERIFIED_BADGE = 'verified';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(/[\s@]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Moderation card (queue list item)
// ---------------------------------------------------------------------------
function ModerationCard({
  item,
  onApprove,
  onReject,
  onView,
}: {
  item: SpecialistItem;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}) {
  const isVerified = item.badges.includes(VERIFIED_BADGE);
  const displayName = item.nick || item.user.email;
  const city = item.cities[0] || '';

  return (
    <View className="rounded-[14px] border border-borderLight bg-white p-4 shadow-sm gap-3">
      {/* Top row: avatar + info + badge */}
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
          <Text className="text-sm font-bold text-brandPrimary">
            {getInitials(displayName)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-textPrimary">
            @{item.nick || '---'}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            {city ? (
              <>
                <Feather name="map-pin" size={11} color={Colors.textMuted} />
                <Text className="text-sm text-textMuted">{city}</Text>
              </>
            ) : null}
          </View>
        </View>
        <View
          className={`px-2 py-0.5 rounded-full ${
            isVerified ? 'bg-[#DCFCE7]' : 'bg-[#E0F2FE]'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isVerified ? 'text-statusSuccess' : 'text-brandPrimary'
            }`}
          >
            {isVerified ? 'Верифицирован' : 'На проверке'}
          </Text>
        </View>
      </View>

      {/* Services chips */}
      {item.services.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {item.services.map((svc, i) => (
            <View
              key={i}
              className="rounded-full border border-borderLight bg-bgSurface px-2 py-0.5"
            >
              <Text className="text-xs text-textSecondary">{svc}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Date row */}
      <View className="flex-row items-center gap-1">
        <Feather name="calendar" size={12} color={Colors.textMuted} />
        <Text className="flex-1 text-sm text-textMuted">
          Обновлён: {formatDate(item.updatedAt)}
        </Text>
        {!isVerified && (
          <View className="rounded-full bg-[#FEF9C3] px-2 py-0.5">
            <Text className="text-xs font-semibold text-statusWarning">Ожидает</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onView}
          className="flex-1 h-9 flex-row items-center justify-center gap-1 rounded-xl border border-borderLight"
        >
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text className="text-sm text-textPrimary">Просмотр</Text>
        </Pressable>
        <Pressable
          onPress={onApprove}
          className="h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7]"
          disabled={isVerified}
          style={isVerified ? { opacity: 0.4 } : undefined}
        >
          <Feather name="check" size={16} color={Colors.statusSuccess} />
        </Pressable>
        <Pressable
          onPress={onReject}
          className="h-9 w-9 items-center justify-center rounded-xl bg-[#FEE2E2]"
          disabled={!isVerified}
          style={!isVerified ? { opacity: 0.4 } : undefined}
        >
          <Feather name="x" size={16} color={Colors.statusError} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------
function DetailView({
  item,
  onBack,
  onApprove,
  onReject,
}: {
  item: SpecialistItem;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const isVerified = item.badges.includes(VERIFIED_BADGE);
  const displayName = item.nick || item.user.email;
  const city = item.cities[0] || '';

  return (
    <View className="gap-3">
      <Pressable onPress={onBack} className="flex-row items-center gap-1">
        <Feather name="arrow-left" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Назад к очереди</Text>
      </Pressable>

      <View className="rounded-[14px] border border-borderLight bg-white p-4 shadow-sm gap-4">
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
            <Text className="text-lg font-bold text-brandPrimary">
              {getInitials(displayName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-textPrimary">
              @{item.nick || '---'}
            </Text>
            <Text className="text-sm text-textMuted mt-0.5">
              {[city, item.user.email].filter(Boolean).join(' \u00b7 ')}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              isVerified ? 'bg-[#DCFCE7]' : 'bg-[#E0F2FE]'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isVerified ? 'text-statusSuccess' : 'text-brandPrimary'
              }`}
            >
              {isVerified ? 'Верифицирован' : 'На проверке'}
            </Text>
          </View>
        </View>

        <View className="h-px bg-borderLight" />

        {/* Cities */}
        {item.cities.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-textPrimary uppercase tracking-wide">
              Города
            </Text>
            <Text className="text-base text-textSecondary leading-[22px]">
              {item.cities.join(', ')}
            </Text>
          </View>
        )}

        {/* Services */}
        {item.services.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-textPrimary uppercase tracking-wide">
              Услуги
            </Text>
            <View className="flex-row flex-wrap gap-1">
              {item.services.map((svc, i) => (
                <View
                  key={i}
                  className="rounded-full border border-borderLight bg-bgSurface px-2 py-0.5"
                >
                  <Text className="text-xs text-textSecondary">{svc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Badges */}
        {item.badges.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-textPrimary uppercase tracking-wide">
              Знаки
            </Text>
            <View className="flex-row flex-wrap gap-1">
              {item.badges.map((b, i) => (
                <View
                  key={i}
                  className="rounded-full border border-borderLight bg-bgSurface px-2 py-0.5"
                >
                  <Text className="text-xs text-textSecondary">{b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-px bg-borderLight" />

        {/* Reject reason textarea */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-textPrimary uppercase tracking-wide">
            Причина отклонения (при отказе)
          </Text>
          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Укажите причину..."
            placeholderTextColor={Colors.textMuted}
            multiline
            className="min-h-[80px] rounded-[10px] border border-borderLight bg-bgPrimary p-3 text-base text-textPrimary"
            style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
          />
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={onApprove}
            className="flex-1 h-11 flex-row items-center justify-center gap-1 rounded-xl bg-statusSuccess"
            disabled={isVerified}
            style={isVerified ? { opacity: 0.5 } : undefined}
          >
            <Feather name="check-circle" size={16} color={Colors.white} />
            <Text className="text-base font-semibold text-white">Одобрить</Text>
          </Pressable>
          <Pressable
            onPress={onReject}
            className="flex-1 h-11 flex-row items-center justify-center gap-1 rounded-xl bg-[#FEE2E2]"
            disabled={!isVerified}
            style={!isVerified ? { opacity: 0.5 } : undefined}
          >
            <Feather name="x-circle" size={16} color={Colors.statusError} />
            <Text className="text-base font-semibold text-statusError">Отклонить</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Result screen (approved / rejected)
// ---------------------------------------------------------------------------
function ResultView({
  type,
  item,
  onBack,
}: {
  type: 'approved' | 'rejected';
  item: SpecialistItem;
  onBack: () => void;
}) {
  const isApproved = type === 'approved';
  const displayName = item.nick ? `@${item.nick}` : item.user.email;

  return (
    <View className="items-center py-6 gap-3">
      <View
        className={`h-20 w-20 items-center justify-center rounded-full ${
          isApproved ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'
        }`}
      >
        <Feather
          name={isApproved ? 'check-circle' : 'x-circle'}
          size={48}
          color={isApproved ? Colors.statusSuccess : Colors.statusError}
        />
      </View>
      <Text className="text-xl font-bold text-textPrimary">
        {isApproved ? 'Специалист одобрен' : 'Заявка отклонена'}
      </Text>
      <Text className="text-sm text-textMuted text-center max-w-[300px]">
        {displayName} получит уведомление о{' '}
        {isApproved ? 'подтверждении профиля' : 'причине отказа'}
      </Text>

      {/* Summary card */}
      <View className="w-full rounded-[14px] border border-borderLight bg-white p-4 shadow-sm gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-textMuted">Специалист</Text>
          <Text className="text-sm font-semibold text-textPrimary">{displayName}</Text>
        </View>
        <View className="h-px bg-borderLight" />
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-textMuted">Тип</Text>
          <Text className="text-sm font-semibold text-textPrimary">Верификация</Text>
        </View>
        <View className="h-px bg-borderLight" />
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-textMuted">Результат</Text>
          <View
            className={`px-2 py-0.5 rounded-full ${
              isApproved ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isApproved ? 'text-statusSuccess' : 'text-statusError'
              }`}
            >
              {isApproved ? 'Одобрено' : 'Отклонено'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onBack}
        className="h-11 items-center justify-center rounded-xl border border-brandPrimary px-6"
      >
        <Text className="text-sm font-medium text-brandPrimary">Вернуться к очереди</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyView() {
  return (
    <View className="items-center py-10 gap-3">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#DCFCE7]">
        <Feather name="check-circle" size={40} color={Colors.statusSuccess} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">Очередь пуста</Text>
      <Text className="text-sm text-textMuted text-center max-w-[280px]">
        Все заявки рассмотрены. Новые появятся автоматически.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function AdminModeration() {
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterKey>('all');
  const [screen, setScreen] = useState<ScreenState>('queue');
  const [selectedItem, setSelectedItem] = useState<SpecialistItem | null>(null);

  const fetchSpecialists = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ items: SpecialistItem[]; total: number }>(
        '/admin/specialists',
      );
      setSpecialists(data.items);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load specialists');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialists();
  }, [fetchSpecialists]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSpecialists(true);
  };

  // Filter items
  const filteredItems = specialists.filter((s) => {
    if (filter === 'verified') return s.badges.includes(VERIFIED_BADGE);
    if (filter === 'unverified') return !s.badges.includes(VERIFIED_BADGE);
    return true;
  });

  const handleApprove = async (s: SpecialistItem) => {
    setActionLoading((prev) => ({ ...prev, [s.id]: true }));
    try {
      const newBadges = [...new Set([...s.badges, VERIFIED_BADGE])];
      await api.patch(`/specialists/${s.user.id}/badges`, { badges: newBadges });
      const updated = { ...s, badges: newBadges };
      setSpecialists((prev) =>
        prev.map((item) => (item.id === s.id ? updated : item)),
      );
      setSelectedItem(updated);
      setScreen('approved');
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Не удалось одобрить профиль');
    } finally {
      setActionLoading((prev) => ({ ...prev, [s.id]: false }));
    }
  };

  const handleReject = async (s: SpecialistItem) => {
    setActionLoading((prev) => ({ ...prev, [s.id]: true }));
    try {
      const newBadges = s.badges.filter((b) => b !== VERIFIED_BADGE);
      await api.patch(`/specialists/${s.user.id}/badges`, { badges: newBadges });
      const updated = { ...s, badges: newBadges };
      setSpecialists((prev) =>
        prev.map((item) => (item.id === s.id ? updated : item)),
      );
      setSelectedItem(updated);
      setScreen('rejected');
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Не удалось отклонить профиль');
    } finally {
      setActionLoading((prev) => ({ ...prev, [s.id]: false }));
    }
  };

  const handleView = (s: SpecialistItem) => {
    setSelectedItem(s);
    setScreen('detail');
  };

  const handleBackToQueue = () => {
    setScreen('queue');
    setSelectedItem(null);
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'unverified', label: 'На проверке' },
    { key: 'verified', label: 'Верифицированные' },
  ];

  const unverifiedCount = specialists.filter(
    (s) => !s.badges.includes(VERIFIED_BADGE),
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-bgPrimary">
      <Header title="Модерация" showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View className="w-full max-w-screen-sm px-4 gap-3">
          {/* Detail / Result screens */}
          {screen === 'detail' && selectedItem && (
            <DetailView
              item={selectedItem}
              onBack={handleBackToQueue}
              onApprove={() => handleApprove(selectedItem)}
              onReject={() => handleReject(selectedItem)}
            />
          )}

          {(screen === 'approved' || screen === 'rejected') && selectedItem && (
            <ResultView
              type={screen}
              item={selectedItem}
              onBack={handleBackToQueue}
            />
          )}

          {/* Queue screen */}
          {screen === 'queue' && (
            <>
              {/* Header row */}
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-textPrimary">Модерация</Text>
                  <Text className="text-sm text-textMuted">Заявки на рассмотрение</Text>
                </View>
                <View
                  className={`min-w-[28px] h-7 items-center justify-center rounded-full px-2 ${
                    unverifiedCount === 0 ? 'bg-statusSuccess' : 'bg-statusWarning'
                  }`}
                >
                  <Text className="text-sm font-bold text-white">{unverifiedCount}</Text>
                </View>
              </View>

              {/* Filter chips */}
              <View className="flex-row flex-wrap gap-2">
                {filters.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    className={`px-3 py-2 rounded-full border ${
                      filter === f.key
                        ? 'bg-brandPrimary border-brandPrimary'
                        : 'border-borderLight'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        filter === f.key
                          ? 'text-white font-semibold'
                          : 'text-textMuted'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Content */}
              {loading ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="large" color={Colors.brandPrimary} />
                </View>
              ) : error ? (
                <Text className="text-sm text-statusError text-center py-4">{error}</Text>
              ) : filteredItems.length === 0 ? (
                <EmptyView />
              ) : (
                <View className="gap-3">
                  {filteredItems.map((item) => (
                    <View key={item.id}>
                      {actionLoading[item.id] ? (
                        <View className="rounded-[14px] border border-borderLight bg-white p-4 items-center py-6">
                          <ActivityIndicator size="small" color={Colors.brandPrimary} />
                        </View>
                      ) : (
                        <ModerationCard
                          item={item}
                          onView={() => handleView(item)}
                          onApprove={() => handleApprove(item)}
                          onReject={() => handleReject(item)}
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
