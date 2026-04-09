import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

function RequestFeedCard({ title, description, city, service, budget, date }: {
  title: string; description: string; city: string; service: string; budget: string; date: string;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardDesc} numberOfLines={2}>{description}</Text>
      <View style={s.cardTags}>
        <View style={s.tag}><Text style={s.tagText}>{city}</Text></View>
        <View style={s.tag}><Text style={s.tagText}>{service}</Text></View>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.budget}>{budget}</Text>
        <Text style={s.date}>{date}</Text>
      </View>
    </View>
  );
}

function FilterPanel() {
  return (
    <View style={s.filterPanel}>
      <Text style={s.filterTitle}>Фильтры</Text>
      <View style={s.filterGroup}>
        <Text style={s.filterLabel}>Город</Text>
        <View style={s.filterSelect}><Text style={s.filterSelectText}>Все города</Text></View>
      </View>
      <View style={s.filterGroup}>
        <Text style={s.filterLabel}>Услуга</Text>
        <View style={s.filterSelect}><Text style={s.filterSelectText}>Все услуги</Text></View>
      </View>
      <View style={s.filterGroup}>
        <Text style={s.filterLabel}>Бюджет до</Text>
        <TextInput value="" editable={false} placeholder="Макс. сумма" placeholderTextColor={Colors.textMuted} style={s.filterInput} />
      </View>
      <View style={s.filterBtn}><Text style={s.filterBtnText}>Применить</Text></View>
    </View>
  );
}

export function PublicRequestsStates() {
  return (
    <>
      <StateSection title="FEED">
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Заявки</Text>
            <View style={s.filterToggle}><Text style={s.filterToggleText}>Фильтры</Text></View>
          </View>
          {MOCK_REQUESTS.filter(r => r.status !== 'CANCELLED').map((r) => (
            <RequestFeedCard key={r.id} title={r.title} description={r.description} city={r.city} service={r.service} budget={r.budget} date={r.createdAt} />
          ))}
        </View>
      </StateSection>
      <StateSection title="FILTERS_OPEN">
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Заявки</Text>
          </View>
          <FilterPanel />
          {MOCK_REQUESTS.slice(0, 2).map((r) => (
            <RequestFeedCard key={r.id} title={r.title} description={r.description} city={r.city} service={r.service} budget={r.budget} date={r.createdAt} />
          ))}
        </View>
      </StateSection>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Заявки</Text>
            <View style={s.filterToggle}><Text style={s.filterToggleText}>Фильтры</Text></View>
          </View>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет заявок по вашим фильтрам</Text>
            <Text style={s.emptyText}>Попробуйте изменить параметры поиска</Text>
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
  filterToggle: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterToggleText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  cardTags: { flexDirection: 'row', gap: Spacing.sm },
  tag: { backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  tagText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  budget: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  date: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  filterPanel: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  filterTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  filterGroup: { gap: Spacing.xs },
  filterLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.textMuted },
  filterSelect: {
    height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, justifyContent: 'center',
  },
  filterSelectText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  filterInput: {
    height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, fontSize: Typography.fontSize.sm, color: Colors.textPrimary,
  },
  filterBtn: {
    height: 40, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
