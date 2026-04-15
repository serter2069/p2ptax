import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { MOCK_REQUESTS } from '../../constants/protoMockData';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary, bg: Colors.statusBg.info },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning, bg: Colors.statusBg.warning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error },
};

function RequestCard({ title, service, fns, city, status, date, messageCount }: {
  title: string; service: string; fns: string; city: string; status: string; date: string; messageCount: number;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <Pressable style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm }}>
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
  const activeRequests = MOCK_REQUESTS.filter((r) => ['NEW', 'ACTIVE', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = MOCK_REQUESTS.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const allRequests = MOCK_REQUESTS;
  const visibleRequests = tab === 'active' ? activeRequests : tab === 'completed' ? completedRequests : allRequests;

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>Мои заявки</Text>
        <Pressable style={{ backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Новая</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
        {([
          { key: 'active' as const, label: `Активные (${activeRequests.length})` },
          { key: 'completed' as const, label: `Завершённые (${completedRequests.length})` },
          { key: 'all' as const, label: `Все (${allRequests.length})` },
        ]).map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tab === t.key ? Colors.brandPrimary : Colors.border, backgroundColor: tab === t.key ? Colors.brandPrimary : Colors.bgCard }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: tab === t.key ? Colors.white : Colors.textMuted, fontWeight: tab === t.key ? Typography.fontWeight.semibold : Typography.fontWeight.medium }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {visibleRequests.map((r) => (
        <RequestCard key={r.id} title={r.title} service={r.service} fns={r.fns} city={r.city} status={r.status} date={r.createdAt} messageCount={r.messageCount} />
      ))}
    </View>
  );
}
