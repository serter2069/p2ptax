import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted },
  CANCELLED: { label: 'Отменена', color: Colors.statusError },
};

function RequestCard({ title, service, city, status, date, responses }: {
  title: string; service: string; city: string; status: string; date: string; responses: number;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <Pressable style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
        <View style={[s.badge, { backgroundColor: st.color + '20' }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <View style={s.meta}>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{service}</Text>
        <Text style={s.metaDot}>{'·'}</Text>
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{city}</Text>
      </View>
      <View style={s.cardFooter}>
        <View style={s.dateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.date}>{date}</Text>
        </View>
        {responses > 0 && (
          <View style={s.responsesBadge}>
            <Feather name="message-circle" size={12} color={Colors.statusSuccess} />
            <Text style={s.responses}>{responses} откликов</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

function InteractiveList() {
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const activeRequests = MOCK_REQUESTS.filter((r) => ['NEW', 'ACTIVE', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = MOCK_REQUESTS.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const visibleRequests = tab === 'active' ? activeRequests : completedRequests;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Мои заявки</Text>
        <Pressable style={s.addBtn}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.addBtnText}>Новая</Text>
        </Pressable>
      </View>
      <View style={s.tabs}>
        <Pressable onPress={() => setTab('active')} style={[s.tab, tab === 'active' ? s.tabActive : null]}>
          <Text style={[s.tabText, tab === 'active' ? s.tabTextActive : null]}>Активные ({activeRequests.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('completed')} style={[s.tab, tab === 'completed' ? s.tabActive : null]}>
          <Text style={[s.tabText, tab === 'completed' ? s.tabTextActive : null]}>Завершённые ({completedRequests.length})</Text>
        </Pressable>
      </View>
      {visibleRequests.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="file-text" size={40} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Нет заявок</Text>
          <Text style={s.emptyText}>В этой категории пока нет заявок</Text>
        </View>
      ) : (
        visibleRequests.map((r) => (
          <RequestCard
            key={r.id} title={r.title} service={r.service}
            city={r.city} status={r.status} date={r.createdAt} responses={r.responseCount}
          />
        ))
      )}
    </View>
  );
}

export function MyRequestsStates() {
  return (
    <StateSection title="INTERACTIVE_TABS">
      <InteractiveList />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  addBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tab: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  metaDot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  responsesBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  responses: { fontSize: Typography.fontSize.sm, color: Colors.statusSuccess, fontWeight: Typography.fontWeight.medium },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
});
