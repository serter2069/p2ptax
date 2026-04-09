import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess },
  IN_PROGRESS: { label: 'В работе', color: '#D97706' },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted },
  CANCELLED: { label: 'Отменена', color: Colors.statusError },
};

function RequestCard({ title, service, city, status, date, responses }: {
  title: string; service: string; city: string; status: string; date: string; responses: number;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
        <View style={[s.badge, { backgroundColor: st.color + '20' }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <View style={s.meta}>
        <Text style={s.metaItem}>{service}</Text>
        <Text style={s.metaDot}>{'·'}</Text>
        <Text style={s.metaItem}>{city}</Text>
      </View>
      <View style={s.cardFooter}>
        <Text style={s.date}>{date}</Text>
        {responses > 0 && <Text style={s.responses}>{responses} откликов</Text>}
      </View>
    </View>
  );
}

export function MyRequestsStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Мои заявки</Text>
            <View style={s.addBtn}><Text style={s.addBtnText}>+ Новая</Text></View>
          </View>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет заявок</Text>
            <Text style={s.emptyText}>Создайте заявку, чтобы получить предложения от специалистов</Text>
          </View>
        </View>
      </StateSection>
      <StateSection title="LIST">
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Мои заявки</Text>
            <View style={s.addBtn}><Text style={s.addBtnText}>+ Новая</Text></View>
          </View>
          {MOCK_REQUESTS.map((r) => (
            <RequestCard
              key={r.id} title={r.title} service={r.service}
              city={r.city} status={r.status} date={r.createdAt} responses={r.responseCount}
            />
          ))}
        </View>
      </StateSection>
      <StateSection title="LOADING">
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Мои заявки</Text>
          </View>
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          </View>
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaDot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  responses: { fontSize: Typography.fontSize.xs, color: Colors.statusSuccess, fontWeight: Typography.fontWeight.medium },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  loadingWrap: { alignItems: 'center', padding: Spacing['4xl'] },
});
