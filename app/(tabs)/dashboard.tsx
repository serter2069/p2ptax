import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../lib/auth/AuthContext";
import { requests, threads } from "../../lib/api/endpoints";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl border border-borderLight bg-white p-3">
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color + "15" }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-lg font-bold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-textMuted">{label}</Text>
    </View>
  );
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Новая',
    in_progress: 'В работе',
    closed: 'Закрыта',
    cancelled: 'Отменена',
  };
  return map[status] ?? status;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: Colors.brandPrimary,
    in_progress: Colors.statusWarning,
    closed: Colors.textMuted,
    cancelled: Colors.statusError,
  };
  return map[status] ?? Colors.textMuted;
}

function RequestCard({ id, title, service, fns, city, date, messageCount, status }: {
  id: string; title: string; service: string; fns?: string; city?: string; date: string;
  messageCount: number; status: string;
}) {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  return (
    <Pressable className="gap-2 rounded-xl border border-borderLight bg-white p-4" onPress={() => router.push(`/(dashboard)/my-requests/${id}` as any)}>
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + "18" }}>
          <Text className="text-xs font-semibold" style={{ color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        {service ? (
          <View className="flex-row items-center gap-1">
            <Feather name="briefcase" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">{service}</Text>
          </View>
        ) : null}
        {fns ? (
          <View className="flex-row items-center gap-1">
            <Feather name="home" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">{fns}</Text>
          </View>
        ) : null}
        {city ? (
          <View className="flex-row items-center gap-1">
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">{city}</Text>
          </View>
        ) : null}
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{date}</Text>
        </View>
        {messageCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{messageCount} сообщ.</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatThreadTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 1000 / 3600;
  if (diffH < 24) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffH < 48) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function MessagePreview({ id, initials, name, snippet, time, unread }: {
  id: string; initials: string; name: string; snippet: string; time: string; unread?: boolean;
}) {
  return (
    <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3" onPress={() => router.push(`/chat/${id}` as any)}>
      <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${unread ? "font-bold text-textPrimary" : "font-medium text-textPrimary"}`}>{name}</Text>
          <Text className="text-xs text-textMuted">{time}</Text>
        </View>
        <Text className={`text-xs ${unread ? "font-medium text-textSecondary" : "text-textMuted"}`} numberOfLines={1}>{snippet}</Text>
      </View>
      {unread && (
        <View className="h-2.5 w-2.5 rounded-full bg-brandPrimary" />
      )}
    </Pressable>
  );
}

function QuickActions() {
  return (
    <View className="flex-row gap-2">
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brandPrimary" onPress={() => router.push('/(dashboard)/my-requests/new' as any)}>
        <Feather name="plus" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Новая заявка</Text>
      </Pressable>
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white" onPress={() => router.push('/(tabs)/requests' as any)}>
        <Feather name="list" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Мои заявки</Text>
      </Pressable>
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white" onPress={() => router.push('/(tabs)/messages' as any)}>
        <Feather name="message-circle" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Сообщения</Text>
      </Pressable>
    </View>
  );
}

interface RequestItem {
  id: string;
  title: string;
  serviceType?: string;
  fnsName?: string;
  city?: string;
  createdAt: string;
  status: string;
  _count?: { threads?: number };
}

interface ThreadItem {
  id: string;
  specialist?: { firstName?: string; lastName?: string; nick?: string; [key: string]: unknown };
  client?: { firstName?: string; lastName?: string; [key: string]: unknown };
  lastMessage?: { content?: string; createdAt?: string };
  unreadCount?: number;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DashboardScreen() {
  const { user } = useAuth();

  const [reqs, setReqs] = useState<RequestItem[]>([]);
  const [reqsLoading, setReqsLoading] = useState(true);

  const [msgs, setMsgs] = useState<ThreadItem[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(true);

  useEffect(() => {
    requests.getMyRequests({ limit: 3, status: 'active' })
      .then((res: any) => {
        const data = res.data;
        setReqs(Array.isArray(data) ? data : (data.items ?? data.data ?? []));
      })
      .catch(() => setReqs([]))
      .finally(() => setReqsLoading(false));
  }, []);

  useEffect(() => {
    threads.getThreads()
      .then((res: any) => {
        const data = res.data;
        const list: ThreadItem[] = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
        setMsgs(list.slice(0, 3));
      })
      .catch(() => setMsgs([]))
      .finally(() => setMsgsLoading(false));
  }, []);

  const firstName = user?.firstName ?? user?.email?.split('@')[0] ?? 'друг';

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">{getGreeting()}, {firstName}!</Text>
          <Text className="text-sm text-textMuted">Ваши заявки и сообщения</Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-bgSurface" onPress={() => router.push('/(tabs)/messages' as any)}>
          <Feather name="bell" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <QuickActions />

      {/* Active requests */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Активные заявки</Text>
          <Pressable onPress={() => router.push('/(tabs)/requests' as any)}>
            <Text className="text-sm font-medium text-brandPrimary">Все заявки</Text>
          </Pressable>
        </View>
        {reqsLoading ? (
          <ActivityIndicator color={Colors.brandPrimary} />
        ) : reqs.length === 0 ? (
          <View className="items-center gap-3 rounded-xl border border-borderLight bg-white p-6">
            <Feather name="file-text" size={32} color={Colors.textMuted} />
            <Text className="text-sm text-textMuted">Нет активных заявок</Text>
            <Pressable
              className="h-10 flex-row items-center gap-1.5 rounded-xl bg-brandPrimary px-4"
              onPress={() => router.push('/(dashboard)/my-requests/new' as any)}
            >
              <Feather name="plus" size={16} color={Colors.white} />
              <Text className="text-sm font-semibold text-white">Создать заявку</Text>
            </Pressable>
          </View>
        ) : (
          reqs.map((req) => (
            <RequestCard
              key={req.id}
              id={req.id}
              title={req.title}
              service={req.serviceType ?? ''}
              fns={req.fnsName}
              city={req.city}
              date={formatDate(req.createdAt)}
              messageCount={req._count?.threads ?? 0}
              status={req.status}
            />
          ))
        )}
      </View>

      {/* Recent messages */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Новые сообщения</Text>
          <Pressable onPress={() => router.push('/(tabs)/messages' as any)}>
            <Text className="text-sm font-medium text-brandPrimary">Все сообщения</Text>
          </Pressable>
        </View>
        {msgsLoading ? (
          <ActivityIndicator color={Colors.brandPrimary} />
        ) : msgs.length === 0 ? (
          <View className="items-center rounded-xl border border-borderLight bg-white p-6">
            <Text className="text-sm text-textMuted">Нет сообщений</Text>
          </View>
        ) : (
          msgs.map((thread) => {
            const other = thread.specialist ?? thread.client;
            const name = other
              ? [other.firstName, other.lastName].filter(Boolean).join(' ') || other.nick || 'Специалист'
              : 'Специалист';
            const initials = getInitials(name);
            const snippet = thread.lastMessage?.content ?? '';
            const time = thread.lastMessage?.createdAt ? formatThreadTime(thread.lastMessage.createdAt) : '';
            const unread = (thread.unreadCount ?? 0) > 0;
            return (
              <MessagePreview
                key={thread.id}
                id={thread.id}
                initials={initials}
                name={name}
                snippet={snippet}
                time={time}
                unread={unread}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
