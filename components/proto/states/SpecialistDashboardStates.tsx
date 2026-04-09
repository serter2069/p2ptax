import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

function RequestCard({ title, city, budget, service, date }: {
  title: string; city: string; budget: string; service: string; date: string;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      <View style={s.cardMeta}>
        <Text style={s.metaItem}>{city}</Text>
        <Text style={s.dot}>{'·'}</Text>
        <Text style={s.metaItem}>{service}</Text>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.budget}>{budget}</Text>
        <Text style={s.date}>{date}</Text>
      </View>
      <View style={s.respondBtn}><Text style={s.respondBtnText}>Откликнуться</Text></View>
    </View>
  );
}

export function SpecialistDashboardStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <Text style={s.greeting}>Добрый день, Алексей!</Text>
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={s.statValue}>0</Text><Text style={s.statLabel}>Новые</Text></View>
            <View style={s.stat}><Text style={s.statValue}>0</Text><Text style={s.statLabel}>В работе</Text></View>
            <View style={s.stat}><Text style={s.statValue}>0</Text><Text style={s.statLabel}>Завершены</Text></View>
          </View>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет заявок в вашем городе</Text>
            <Text style={s.emptyText}>Когда клиенты создадут заявки в Санкт-Петербурге, вы увидите их здесь</Text>
          </View>
        </View>
      </StateSection>
      <StateSection title="WITH_REQUESTS">
        <View style={s.container}>
          <Text style={s.greeting}>Добрый день, Алексей!</Text>
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={[s.statValue, { color: Colors.brandPrimary }]}>5</Text><Text style={s.statLabel}>Новые</Text></View>
            <View style={s.stat}><Text style={[s.statValue, { color: '#D97706' }]}>2</Text><Text style={s.statLabel}>В работе</Text></View>
            <View style={s.stat}><Text style={[s.statValue, { color: Colors.statusSuccess }]}>18</Text><Text style={s.statLabel}>Завершены</Text></View>
          </View>
          <Text style={s.sectionTitle}>Заявки в вашем городе</Text>
          {MOCK_REQUESTS.filter(r => r.status === 'NEW' || r.status === 'ACTIVE').map((r) => (
            <RequestCard key={r.id} title={r.title} city={r.city} budget={r.budget} service={r.service} date={r.createdAt} />
          ))}
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  greeting: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statValue: { fontSize: 22, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budget: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  date: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  respondBtn: {
    height: 38, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs,
  },
  respondBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  emptyWrap: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
