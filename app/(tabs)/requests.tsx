import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { requests as requestsApi } from '../../lib/api/endpoints';

interface ApiRequest {
  id: string;
  title: string;
  serviceCategory?: string | null;
  ifnsCode?: string | null;
  city?: string | null;
  status: string;
  createdAt: string;
  _count?: { threads?: number };
  [key: string]: unknown;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary, bg: Colors.statusBg.info },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning, bg: Colors.statusBg.warning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error },
};

function RequestCard({ id, title, service, fns, city, status, date, messageCount }: {
  id: string; title: string; service: string; fns: string; city: string; status: string; date: string; messageCount: number;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <Pressable style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm }} onPress={() => router.push(`/(dashboard)/my-requests/${id}` as any)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
        <Text style={{ flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }} numberOfLines={2}>{title}</Text>
        <View style={{ paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: st.bg }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: st.color }}>{st.label}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{service}</Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.border }}>{'·'}</Text>
        <Feather name="home" size={12} color={Colors.textMuted} />
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{fns}</Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.border }}>{'·'}</Text>
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{city}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{date}</Text>
        </View>
        {messageCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium }}>{messageCount} сообщ.</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function RequestsScreen() {
  const [tab, setTab] = useState<'active' | 'completed' | 'all'>('active');
  const [allData, setAllData] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    requestsApi.getMyRequests()
      .then((res) => {
        if (mounted) {
          const data = (res as any).data ?? res;
          setAllData(Array.isArray(data) ? data : (data.items ?? data.requests ?? []));
        }
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const activeRequests = allData.filter((r) => ['NEW', 'ACTIVE', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = allData.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const visibleRequests = tab === 'active' ? activeRequests : tab === 'completed' ? completedRequests : allData;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.brandPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md }}>
        <Feather name="alert-circle" size={28} color={Colors.statusError} />
        <Text style={{ color: Colors.statusError, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>Мои заявки</Text>
        <Pressable style={{ backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }} onPress={() => router.push('/(dashboard)/my-requests/new' as any)}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Новая</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
        {([
          { key: 'active' as const, label: `Активные (${activeRequests.length})` },
          { key: 'completed' as const, label: `Завершённые (${completedRequests.length})` },
          { key: 'all' as const, label: `Все (${allData.length})` },
        ]).map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tab === t.key ? Colors.brandPrimary : Colors.border, backgroundColor: tab === t.key ? Colors.brandPrimary : Colors.bgCard }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: tab === t.key ? Colors.white : Colors.textMuted, fontWeight: tab === t.key ? Typography.fontWeight.semibold : Typography.fontWeight.medium }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {visibleRequests.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: Spacing.md }}>
          <Feather name="inbox" size={32} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted }}>Заявок нет</Text>
        </View>
      ) : visibleRequests.map((r) => (
        <RequestCard
          key={r.id}
          id={r.id}
          title={r.title}
          service={r.serviceCategory ?? '—'}
          fns={r.ifnsCode ?? '—'}
          city={r.city ?? '—'}
          status={r.status}
          date={r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : '—'}
          messageCount={r._count?.threads ?? 0}
        />
      ))}
    </ScrollView>
  );
}
