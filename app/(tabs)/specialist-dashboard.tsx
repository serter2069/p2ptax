import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { specialistPortal } from '../../lib/api/endpoints';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';

interface FeedItem {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  ifnsCode?: string | null;
  serviceCategory?: string | null;
  createdAt: string;
  client?: { firstName?: string | null; lastName?: string | null } | null;
  [key: string]: unknown;
}

function RequestCard({ r, onWrite }: { r: FeedItem; onWrite: (r: FeedItem) => void }) {
  const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : '—';
  const authorName = r.client
    ? [r.client.firstName, r.client.lastName].filter(Boolean).join(' ') || '—'
    : '—';

  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{r.title}</Text>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>

      <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{r.description ?? ''}</Text>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.city ?? '—'}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="home" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.ifnsCode ?? '—'}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.serviceCategory ?? '—'}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="user" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{authorName}</Text>
        </View>
      </View>

      <View className="mt-1 flex-row gap-2">
        <Pressable
          onPress={() => onWrite(r)}
          className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary"
        >
          <Feather name="send" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Написать</Text>
        </Pressable>
        <Pressable className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight px-4">
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text className="text-sm font-medium text-textPrimary">Подробнее</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SpecialistDashboardScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [writeTarget, setWriteTarget] = useState<WriteConfirmModalRequest | null>(null);
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    specialistPortal.getFeed()
      .then((res) => {
        if (mounted) {
          const data = (res as any).data ?? res;
          setFeedData(Array.isArray(data) ? data : (data.items ?? data.requests ?? []));
        }
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = search
    ? feedData.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.serviceCategory ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.city ?? '').toLowerCase().includes(search.toLowerCase()))
    : feedData;

  const handleWrite = (r: FeedItem) => {
    setWriteTarget({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      city: r.city ?? '',
      service: r.serviceCategory ?? '',
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.brandPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Feather name="alert-circle" size={28} color={Colors.statusError} />
        <Text style={{ color: Colors.statusError, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (feedData.length === 0) {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        <View className="items-center gap-3 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
            <Feather name="inbox" size={32} color={Colors.brandPrimary} />
          </View>
          <Text className="text-lg font-semibold text-textPrimary">Новых заявок пока нет</Text>
          <Text className="max-w-[280px] text-center text-sm text-textMuted">
            Настройте город и ФНС в настройках, чтобы видеть больше заявок
          </Text>
          <Pressable className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary px-6">
            <Feather name="settings" size={16} color={Colors.brandPrimary} />
            <Text className="text-sm font-semibold text-brandPrimary">Настройки</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        <Text className="text-sm text-textMuted">{feedData.length} заявок в вашем регионе</Text>
      </View>

      {/* Search */}
      <View className="flex-row items-center gap-2 rounded-xl border border-borderLight bg-white px-3">
        <Feather name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по заявкам..."
          placeholderTextColor={Colors.textMuted}
          className="h-11 flex-1 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Results */}
      {filtered.length > 0 ? (
        <View className="gap-3">
          {filtered.map((r) => <RequestCard key={r.id} r={r} onWrite={handleWrite} />)}
        </View>
      ) : (
        <View className="items-center gap-2 py-8">
          <Feather name="search" size={32} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">Ничего не найдено</Text>
        </View>
      )}

      <WriteConfirmModal
        visible={writeTarget !== null}
        request={writeTarget}
        onClose={() => setWriteTarget(null)}
        onSuccess={(threadId) => {
          setWriteTarget(null);
          router.push(`/chat/${threadId}` as any);
        }}
      />
    </ScrollView>
  );
}
