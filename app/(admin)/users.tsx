import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
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

interface UserItem {
  id: string;
  email: string;
  role: 'CLIENT' | 'SPECIALIST';
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  specialistProfile: { nick: string; cities: string[]; services: string[] } | null;
}

type RoleFilter = 'all' | 'CLIENT' | 'SPECIALIST';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getInitials(email: string, nick?: string | null): string {
  if (nick) return nick.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function getUserDisplayName(user: UserItem): string {
  if (user.specialistProfile?.nick) return `@${user.specialistProfile.nick}`;
  return user.email.split('@')[0];
}

function getUserCity(user: UserItem): string {
  if (user.specialistProfile?.cities?.length) return user.specialistProfile.cities[0];
  return '—';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonBlock({ width, height, rounded }: { width: string | number; height: number; rounded?: string }) {
  return (
    <View
      className={`bg-sky-50 opacity-70 ${rounded || 'rounded-md'}`}
      style={{ width: width as any, height }}
    />
  );
}

function UserRow({
  user,
  onPress,
}: {
  user: UserItem;
  onPress: () => void;
}) {
  const name = getUserDisplayName(user);
  const city = getUserCity(user);
  const initials = getInitials(user.email, user.specialistProfile?.nick);

  return (
    <Pressable
      className="flex-row items-center gap-3 py-3 px-2 bg-white rounded-[14px] border border-sky-200 shadow-sm"
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-full bg-sky-50 items-center justify-center border border-sky-200">
        <Text className="text-[13px] font-bold text-sky-600">{initials}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-slate-900">{name}</Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Feather name="mail" size={11} color={Colors.textMuted} />
          <Text className="text-[13px] text-slate-400">{user.email}</Text>
        </View>
      </View>
      <View className="items-end gap-1">
        <View
          className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
            user.role === 'SPECIALIST' ? 'bg-green-100' : 'bg-sky-50'
          }`}
        >
          <Feather
            name={user.role === 'SPECIALIST' ? 'briefcase' : 'user'}
            size={11}
            color={user.role === 'SPECIALIST' ? Colors.statusSuccess : Colors.brandPrimary}
          />
          <Text
            className={`text-[11px] font-semibold ${
              user.role === 'SPECIALIST' ? 'text-green-700' : 'text-sky-600'
            }`}
          >
            {user.role === 'SPECIALIST' ? 'Специалист' : 'Клиент'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={11} color={Colors.textMuted} />
          <Text className="text-[13px] text-slate-400">{city}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function UserDetailCard({
  user,
  onBack,
  onBlock,
  blocking,
}: {
  user: UserItem;
  onBack: () => void;
  onBlock: () => void;
  blocking: boolean;
}) {
  const name = getUserDisplayName(user);
  const initials = getInitials(user.email, user.specialistProfile?.nick);
  const city = getUserCity(user);

  return (
    <View className="gap-3">
      <Pressable className="flex-row items-center gap-1" onPress={onBack}>
        <Feather name="arrow-left" size={16} color={Colors.brandPrimary} />
        <Text className="text-[13px] font-medium text-sky-600">Назад к списку</Text>
      </Pressable>

      <View className="bg-white rounded-[14px] border border-sky-200 p-4 gap-4 shadow-sm">
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 rounded-full bg-sky-50 items-center justify-center border border-sky-200">
            <Text className="text-[18px] font-bold text-sky-600">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[18px] font-semibold text-slate-900">{name}</Text>
            <Text className="text-[13px] text-slate-400 mt-0.5">{user.email}</Text>
          </View>
          <View
            className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
              user.role === 'SPECIALIST' ? 'bg-green-100' : 'bg-sky-50'
            }`}
          >
            <Feather
              name={user.role === 'SPECIALIST' ? 'briefcase' : 'user'}
              size={11}
              color={user.role === 'SPECIALIST' ? Colors.statusSuccess : Colors.brandPrimary}
            />
            <Text
              className={`text-[11px] font-semibold ${
                user.role === 'SPECIALIST' ? 'text-green-700' : 'text-sky-600'
              }`}
            >
              {user.role === 'SPECIALIST' ? 'Специалист' : 'Клиент'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-sky-200" />

        {/* Detail grid */}
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-slate-400">Город</Text>
            <Text className="text-[13px] font-medium text-slate-900">{city}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-slate-400">Регистрация</Text>
            <Text className="text-[13px] font-medium text-slate-900">{formatDate(user.createdAt)}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-slate-400">Последний вход</Text>
            <Text className="text-[13px] font-medium text-slate-900">{formatDate(user.lastLoginAt)}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-slate-400">Статус</Text>
            <View
              className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                user.isBlocked ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  user.isBlocked ? 'text-red-600' : 'text-green-700'
                }`}
              >
                {user.isBlocked ? 'Заблокирован' : 'Активен'}
              </Text>
            </View>
          </View>
          {user.specialistProfile && (
            <View className="flex-row justify-between items-center">
              <Text className="text-[13px] text-slate-400">Услуги</Text>
              <Text className="text-[13px] font-medium text-slate-900" numberOfLines={1}>
                {user.specialistProfile.services?.join(', ') || '—'}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-sky-200" />

        {/* Actions */}
        <View className="flex-row gap-2">
          <Pressable
            className={`flex-1 h-10 rounded-[12px] flex-row items-center justify-center gap-1 ${
              user.isBlocked ? 'border border-sky-600' : 'bg-red-50'
            }`}
            onPress={onBlock}
            disabled={blocking}
          >
            {blocking ? (
              <ActivityIndicator size="small" color={user.isBlocked ? Colors.brandPrimary : Colors.statusError} />
            ) : (
              <>
                <Feather
                  name={user.isBlocked ? 'check-circle' : 'slash'}
                  size={14}
                  color={user.isBlocked ? Colors.brandPrimary : Colors.statusError}
                />
                <Text
                  className={`text-[13px] font-medium ${
                    user.isBlocked ? 'text-sky-600' : 'text-red-600'
                  }`}
                >
                  {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async (role: RoleFilter, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const roleParam = role === 'all' ? '' : `?role=${role}`;
      const data = await api.get<{ items: UserItem[]; total: number }>(`/admin/users${roleParam}`);
      setUsers(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(filter); }, [fetchUsers, filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(filter, true);
  };

  const handleBlock = async (user: UserItem) => {
    if (blockingId) return;
    const nextBlocked = !user.isBlocked;
    const label = nextBlocked ? 'заблокировать' : 'разблокировать';
    Alert.alert(
      nextBlocked ? 'Блокировка' : 'Разблокировка',
      `${label.charAt(0).toUpperCase() + label.slice(1)} пользователя ${user.email}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: nextBlocked ? 'Заблокировать' : 'Разблокировать',
          style: nextBlocked ? 'destructive' : 'default',
          onPress: async () => {
            setBlockingId(user.id);
            try {
              await api.patch(`/admin/users/${user.id}`, { isBlocked: nextBlocked });
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: nextBlocked } : u));
              if (selectedUser?.id === user.id) {
                setSelectedUser(prev => prev ? { ...prev, isBlocked: nextBlocked } : null);
              }
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message ?? 'Не удалось обновить статус');
            } finally {
              setBlockingId(null);
            }
          },
        },
      ],
    );
  };

  // Client-side search filter
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.specialistProfile?.nick?.toLowerCase().includes(q) ?? false)
    );
  });

  // Count by role from loaded data
  const clientCount = users.filter(u => u.role === 'CLIENT').length;
  const specialistCount = users.filter(u => u.role === 'SPECIALIST').length;

  // ---------------------------------------------------------------------------
  // Detail view
  // ---------------------------------------------------------------------------

  if (selectedUser) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header title="Пользователи" showBack onBackPress={() => setSelectedUser(null)} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[430px] px-5">
            <UserDetailCard
              user={selectedUser}
              onBack={() => setSelectedUser(null)}
              onBlock={() => handleBlock(selectedUser)}
              blocking={blockingId === selectedUser.id}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // List view
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Пользователи" showBack />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View className="w-full max-w-[430px] px-5 gap-3">
          {/* Page header */}
          <View className="gap-1">
            <Text className="text-[20px] font-bold text-slate-900">Пользователи</Text>
            <Text className="text-[13px] text-slate-400">{total} зарегистрированных</Text>
          </View>

          {/* Search bar */}
          <View className="flex-row items-center gap-2 h-11 bg-white border border-sky-200 rounded-[10px] px-3 shadow-sm">
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск по имени, email..."
              placeholderTextColor={Colors.textMuted}
              className="flex-1 text-[15px] text-slate-900"
              style={{ paddingVertical: 0, outlineStyle: 'none' } as any}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Filter chips */}
          <View className="flex-row gap-2 flex-wrap">
            <Pressable
              className={`px-3 py-2 rounded-full border ${
                filter === 'all'
                  ? 'bg-sky-600 border-sky-600'
                  : 'border-sky-200'
              }`}
              onPress={() => setFilter('all')}
            >
              <Text
                className={`text-[13px] ${
                  filter === 'all' ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Все ({total})
              </Text>
            </Pressable>
            <Pressable
              className={`px-3 py-2 rounded-full border ${
                filter === 'CLIENT'
                  ? 'bg-sky-600 border-sky-600'
                  : 'border-sky-200'
              }`}
              onPress={() => setFilter('CLIENT')}
            >
              <Text
                className={`text-[13px] ${
                  filter === 'CLIENT' ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Клиенты ({clientCount})
              </Text>
            </Pressable>
            <Pressable
              className={`px-3 py-2 rounded-full border ${
                filter === 'SPECIALIST'
                  ? 'bg-sky-600 border-sky-600'
                  : 'border-sky-200'
              }`}
              onPress={() => setFilter('SPECIALIST')}
            >
              <Text
                className={`text-[13px] ${
                  filter === 'SPECIALIST' ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Специалисты ({specialistCount})
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View className="gap-3">
              <SkeletonBlock width="100%" height={44} rounded="rounded-[14px]" />
              <View className="flex-row gap-2">
                <SkeletonBlock width={80} height={32} rounded="rounded-full" />
                <SkeletonBlock width={100} height={32} rounded="rounded-full" />
                <SkeletonBlock width={110} height={32} rounded="rounded-full" />
              </View>
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonBlock key={i} width="100%" height={64} rounded="rounded-[14px]" />
              ))}
              <View className="items-center pt-3">
                <ActivityIndicator size="small" color={Colors.brandPrimary} />
              </View>
            </View>
          ) : error ? (
            <Text className="text-[13px] text-red-600 text-center py-4">{error}</Text>
          ) : filtered.length === 0 ? (
            <View className="items-center py-8 gap-2">
              <View className="w-[72px] h-[72px] rounded-full bg-sky-50 items-center justify-center border border-sky-200">
                <Feather name="search" size={36} color={Colors.textMuted} />
              </View>
              <Text className="text-[18px] font-semibold text-slate-900">Ничего не найдено</Text>
              <Text className="text-[15px] text-slate-400 text-center">
                Попробуйте изменить поисковый запрос или фильтры
              </Text>
            </View>
          ) : (
            <>
              <View className="gap-2">
                {filtered.map((u) => (
                  <UserRow key={u.id} user={u} onPress={() => setSelectedUser(u)} />
                ))}
              </View>

              <View className="flex-row justify-between items-center pt-2">
                <Text className="text-[13px] text-slate-400">
                  Показано {filtered.length} из {total}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
