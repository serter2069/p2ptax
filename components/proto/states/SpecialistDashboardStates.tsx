import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';
import { ProtoPlaceholderImage } from '../ProtoPlaceholderImage';

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
      <Pressable style={s.respondBtn}><Text style={s.respondBtnText}>Откликнуться</Text></Pressable>
    </View>
  );
}

function InteractiveDashboard() {
  const [tab, setTab] = useState<'new' | 'inProgress' | 'completed'>('new');

  const newRequests = MOCK_REQUESTS.filter(r => r.status === 'NEW' || r.status === 'ACTIVE');
  const inProgressRequests = MOCK_REQUESTS.filter(r => r.status === 'IN_PROGRESS');
  const completedRequests = MOCK_REQUESTS.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const visibleRequests = tab === 'new' ? newRequests : tab === 'inProgress' ? inProgressRequests : completedRequests;

  return (
    <View style={s.container}>
      <Text style={s.greeting}>Добрый день, Алексей!</Text>
      <ProtoPlaceholderImage type="banner" height={88} label="Promo banner" borderRadius={10} />
      <View style={s.statsRow}>
        <Pressable onPress={() => setTab('new')} style={s.stat}>
          <Text style={[s.statValue, { color: Colors.brandPrimary }]}>{newRequests.length}</Text>
          <Text style={s.statLabel}>Новые</Text>
        </Pressable>
        <Pressable onPress={() => setTab('inProgress')} style={s.stat}>
          <Text style={[s.statValue, { color: '#D97706' }]}>{inProgressRequests.length}</Text>
          <Text style={s.statLabel}>В работе</Text>
        </Pressable>
        <Pressable onPress={() => setTab('completed')} style={s.stat}>
          <Text style={[s.statValue, { color: Colors.statusSuccess }]}>{completedRequests.length}</Text>
          <Text style={s.statLabel}>Завершены</Text>
        </Pressable>
      </View>
      <View style={s.tabs}>
        <Pressable onPress={() => setTab('new')} style={[s.tabBtn, tab === 'new' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'new' ? s.tabTextActive : null]}>Новые</Text>
        </Pressable>
        <Pressable onPress={() => setTab('inProgress')} style={[s.tabBtn, tab === 'inProgress' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'inProgress' ? s.tabTextActive : null]}>В работе</Text>
        </Pressable>
        <Pressable onPress={() => setTab('completed')} style={[s.tabBtn, tab === 'completed' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'completed' ? s.tabTextActive : null]}>Завершены</Text>
        </Pressable>
      </View>
      {visibleRequests.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>Нет заявок в этой категории</Text>
        </View>
      ) : (
        visibleRequests.map((r) => (
          <RequestCard key={r.id} title={r.title} city={r.city} budget={r.budget} service={r.service} date={r.createdAt} />
        ))
      )}
    </View>
  );
}

export function SpecialistDashboardStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveDashboard />
    </StateSection>
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
  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tabBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabBtnActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: '#FFF', fontWeight: Typography.fontWeight.semibold },
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
});
