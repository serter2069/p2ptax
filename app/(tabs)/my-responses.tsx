import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { specialistPortal } from '../../lib/api/endpoints';
import { Header } from '../../components/Header';

// ---------------------------------------------------------------------------
// Types — response shape from GET /specialist/responses (post-W-1)
// ---------------------------------------------------------------------------
interface SpecialistThread {
  id: string;
  lastMessageAt?: string | null;
  createdAt: string;
  clientLastReadAt?: string | null;
  specialistLastReadAt?: string | null;
  request?: {
    id: string;
    title: string;
    description?: string | null;
    city?: string | null;
    status?: string | null;
    createdAt?: string | null;
    clientId?: string | null;
  } | null;
  participant1?: { id: string; email?: string; role?: string } | null;
  participant2?: { id: string; email?: string; role?: string } | null;
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  }>;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

function ThreadCard({ t, onOpen }: { t: SpecialistThread; onOpen: (id: string) => void }) {
  const title = t.request?.title ?? 'Заявка удалена';
  const city = t.request?.city;
  const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
  const preview = lastMsg?.content ?? '—';
  const when = formatDate(t.lastMessageAt ?? t.createdAt);

  return (
    <Pressable
      onPress={() => onOpen(t.id)}
      className="gap-2 rounded-xl border border-borderLight bg-white p-4"
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
      {city ? (
        <View className="flex-row items-center gap-2">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{city}</Text>
        </View>
      ) : null}
      <Text className="text-sm text-textSecondary" numberOfLines={2}>{preview}</Text>
      {when ? <Text className="text-xs text-textMuted">Последнее: {when}</Text> : null}
    </Pressable>
  );
}

function EmptyState({ onFindRequests }: { onFindRequests: () => void }) {
  return (
    <View className="items-center gap-3 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
        <Feather name="send" size={32} color={Colors.brandPrimary} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">Вы ещё не писали клиентам</Text>
      <Text className="max-w-[280px] text-center text-sm text-textMuted">
        Найдите подходящие заявки и напишите клиентам
      </Text>
      <Pressable
        onPress={onFindRequests}
        className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
      >
        <Feather name="search" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Просмотреть заявки</Text>
      </Pressable>
    </View>
  );
}

function LoadingState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="h-6 w-2/5 rounded-md bg-bgSecondary" />
      {[0, 1, 2].map((i) => <View key={i} className="h-28 w-full rounded-xl bg-bgSecondary" />)}
      <View className="items-center pt-4">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </ScrollView>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="items-center gap-3 py-16">
        <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: Colors.statusBg.error }}>
          <Feather name="alert-circle" size={32} color={Colors.statusError} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">Не удалось загрузить диалоги. Попробуйте снова.</Text>
        <Pressable
          onPress={onRetry}
          className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
        >
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Повторить</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function SpecialistMyDialogsScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState<SpecialistThread[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await specialistPortal.getMyThreads();
      const data = (res.data ?? []) as SpecialistThread[];
      setThreads(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View className="flex-1"><Header variant="auth" /><LoadingState /></View>;
  if (error) return <View className="flex-1"><Header variant="auth" /><ErrorState onRetry={load} /></View>;

  const list = threads ?? [];

  return (
    <View className="flex-1 bg-white">
    <Header variant="auth" />
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-center gap-2">
        <Feather name="mail" size={20} color={Colors.brandPrimary} />
        <Text className="text-xl font-bold text-textPrimary">Мои диалоги</Text>
      </View>
      {list.length === 0 ? (
        <EmptyState onFindRequests={() => router.push('/(tabs)/specialist-dashboard' as any)} />
      ) : (
        list.map((t) => (
          <ThreadCard key={t.id} t={t} onOpen={(id) => router.push(`/chat/${id}` as any)} />
        ))
      )}
    </ScrollView>
    </View>
  );
}
