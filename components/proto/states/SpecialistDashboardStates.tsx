import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function RequestCard({ title, city, budget, service, date }: {
  title: string; city: string; budget: string; service: string; date: string;
}) {
  return (
    <View style={s.card}>
      <Pressable onPress={() => navigate('public-request-detail')}>
        <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      </Pressable>
      <View style={s.cardMeta}>
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{city}</Text>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{service}</Text>
      </View>
      <View style={s.cardBottom}>
        <View style={s.budgetRow}>
          <Feather name="dollar-sign" size={14} color={Colors.brandPrimary} />
          <Text style={s.budget}>{budget}</Text>
        </View>
        <View style={s.dateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.date}>{date}</Text>
        </View>
      </View>
      <Pressable style={s.respondBtn} onPress={() => navigate('specialist-respond')}>
        <Feather name="send" size={14} color={Colors.white} />
        <Text style={s.respondBtnText}>Откликнуться</Text>
      </Pressable>
    </View>
  );
}

function PopulatedDashboard() {
  const [tab, setTab] = useState<'new' | 'inProgress' | 'completed'>('new');

  const newRequests = MOCK_REQUESTS.filter(r => r.status === 'NEW' || r.status === 'ACTIVE');
  const inProgressRequests = MOCK_REQUESTS.filter(r => r.status === 'IN_PROGRESS');
  const completedRequests = MOCK_REQUESTS.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const visibleRequests = tab === 'new' ? newRequests : tab === 'inProgress' ? inProgressRequests : completedRequests;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Добрый день, Алексей!</Text>
            <Text style={s.subGreeting}>Ваши заявки и отклики</Text>
          </View>
          <Pressable style={s.notifBtn}>
            <Feather name="bell" size={20} color={Colors.textPrimary} />
            <View style={s.notifDot} />
          </Pressable>
        </View>
      </View>

      <Image source={{ uri: 'https://picsum.photos/seed/spec-promo/800/176' }} style={s.promoBanner} resizeMode="cover" />

      <View style={s.statsRow}>
        <StatCard icon="send" label="Активные отклики" value="5" color={Colors.brandPrimary} />
        <StatCard icon="clock" label="Ожидают ответа" value="3" color={Colors.statusWarning} />
        <StatCard icon="dollar-sign" label="Заработок" value="32 500 ₽" color={Colors.statusSuccess} />
      </View>

      <View style={s.tabs}>
        <Pressable onPress={() => setTab('new')} style={[s.tabBtn, tab === 'new' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'new' ? s.tabTextActive : null]}>Новые ({newRequests.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('inProgress')} style={[s.tabBtn, tab === 'inProgress' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'inProgress' ? s.tabTextActive : null]}>В работе ({inProgressRequests.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('completed')} style={[s.tabBtn, tab === 'completed' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'completed' ? s.tabTextActive : null]}>Завершены ({completedRequests.length})</Text>
        </Pressable>
      </View>

      {visibleRequests.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="inbox" size={36} color={Colors.textMuted} />
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
    <StateSection title="POPULATED">
      <PopulatedDashboard />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  header: { gap: Spacing.xs, paddingTop: Spacing.sm },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.fontSize.base, color: Colors.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.statusError },

  promoBanner: { width: '100%', height: 88, borderRadius: BorderRadius.lg },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tabBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabBtnActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budget: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  respondBtn: {
    height: 40, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs,
    flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  respondBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  emptyWrap: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
});
