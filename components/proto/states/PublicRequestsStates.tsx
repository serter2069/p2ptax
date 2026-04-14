import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS, MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

function RequestFeedCard({ title, description, city, service, budget, date }: {
  title: string; description: string; city: string; service: string; budget: string; date: string;
}) {
  return (
    <Pressable style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardDesc} numberOfLines={2}>{description}</Text>
      <View style={s.cardTags}>
        <View style={s.tag}>
          <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
          <Text style={s.tagText}>{city}</Text>
        </View>
        <View style={s.tag}>
          <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
          <Text style={s.tagText}>{service}</Text>
        </View>
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
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

function InteractiveRequests() {
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const requests = MOCK_REQUESTS.filter((r) => {
    if (r.status === 'CANCELLED') return false;
    if (filterCity && r.city !== filterCity) return false;
    if (filterService && r.service !== filterService) return false;
    return true;
  });

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Заявки</Text>
        <Pressable onPress={() => setShowFilters(!showFilters)} style={s.filterToggle}>
          <Feather name="sliders" size={16} color={Colors.brandPrimary} />
          <Text style={s.filterToggleText}>{showFilters ? 'Скрыть' : 'Фильтры'}</Text>
        </Pressable>
      </View>
      {showFilters && (
        <View style={s.filterPanel}>
          <Text style={s.filterTitle}>Фильтры</Text>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Город</Text>
            <Pressable onPress={() => { setShowCityPicker(!showCityPicker); setShowServicePicker(false); }}>
              <View style={s.filterSelect}>
                <Text style={s.filterSelectText}>{filterCity || 'Все города'}</Text>
                <Feather name="chevron-down" size={14} color={Colors.textMuted} />
              </View>
            </Pressable>
            {showCityPicker && (
              <View style={s.pickerList}>
                <Pressable onPress={() => { setFilterCity(''); setShowCityPicker(false); }} style={s.pickerItem}>
                  <Text style={s.pickerText}>Все города</Text>
                </Pressable>
                {MOCK_CITIES.map((c) => (
                  <Pressable key={c} onPress={() => { setFilterCity(c); setShowCityPicker(false); }} style={s.pickerItem}>
                    <Text style={[s.pickerText, filterCity === c ? s.pickerTextActive : null]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Услуга</Text>
            <Pressable onPress={() => { setShowServicePicker(!showServicePicker); setShowCityPicker(false); }}>
              <View style={s.filterSelect}>
                <Text style={s.filterSelectText}>{filterService || 'Все услуги'}</Text>
                <Feather name="chevron-down" size={14} color={Colors.textMuted} />
              </View>
            </Pressable>
            {showServicePicker && (
              <View style={s.pickerList}>
                <Pressable onPress={() => { setFilterService(''); setShowServicePicker(false); }} style={s.pickerItem}>
                  <Text style={s.pickerText}>Все услуги</Text>
                </Pressable>
                {MOCK_SERVICES.map((svc) => (
                  <Pressable key={svc.id} onPress={() => { setFilterService(svc.name); setShowServicePicker(false); }} style={s.pickerItem}>
                    <Text style={[s.pickerText, filterService === svc.name ? s.pickerTextActive : null]}>{svc.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <Pressable onPress={() => { setFilterCity(''); setFilterService(''); setFilterBudget(''); }} style={s.filterResetBtn}>
            <Feather name="x" size={14} color={Colors.textMuted} />
            <Text style={s.filterResetText}>Сбросить фильтры</Text>
          </Pressable>
        </View>
      )}
      {requests.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="inbox" size={40} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Нет заявок по вашим фильтрам</Text>
          <Text style={s.emptyText}>Попробуйте изменить параметры поиска</Text>
        </View>
      ) : (
        requests.map((r) => (
          <RequestFeedCard key={r.id} title={r.title} description={r.description} city={r.city} service={r.service} budget={r.budget} date={r.createdAt} />
        ))
      )}
    </View>
  );
}

export function PublicRequestsStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveRequests />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  filterToggle: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  filterToggleText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardDesc: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  cardTags: { flexDirection: 'row', gap: Spacing.sm },
  tag: {
    backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tagText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  budget: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterPanel: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  filterTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  filterGroup: { gap: Spacing.xs },
  filterLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textMuted },
  filterSelect: {
    height: 40, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  filterSelectText: { fontSize: Typography.fontSize.base, color: Colors.textSecondary },
  filterResetBtn: {
    height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: Spacing.xs,
  },
  filterResetText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  pickerList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card,
    backgroundColor: Colors.bgCard, overflow: 'hidden', maxHeight: 200, ...Shadows.sm,
  },
  pickerItem: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  pickerText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  pickerTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
});
