import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_REQUESTS, MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

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
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Бюджет до</Text>
            <TextInput
              value={filterBudget}
              onChangeText={setFilterBudget}
              placeholder="Макс. сумма"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={s.filterInput}
            />
          </View>
          <Pressable onPress={() => { setFilterCity(''); setFilterService(''); setFilterBudget(''); }} style={s.filterResetBtn}>
            <Text style={s.filterResetText}>Сбросить фильтры</Text>
          </Pressable>
        </View>
      )}
      {requests.length === 0 ? (
        <View style={s.emptyWrap}>
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

function EmptyRequests() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Заявки</Text>
        <View style={s.filterToggle}>
          <Text style={s.filterToggleText}>Фильтры</Text>
        </View>
      </View>
      <View style={s.emptyStateWrap}>
        <Feather name="inbox" size={48} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>Заявок пока нет</Text>
        <Text style={s.emptyText}>Новые заявки от клиентов появятся здесь</Text>
      </View>
    </View>
  );
}

function LoadingRequests() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Заявки</Text>
        <View style={s.filterToggle}>
          <Text style={s.filterToggleText}>Фильтры</Text>
        </View>
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={s.card}>
          <View style={[s.skeleton, { width: '60%', height: 16, borderRadius: BorderRadius.sm }]} />
          <View style={[s.skeleton, { width: '90%', height: 14, borderRadius: BorderRadius.sm }]} />
          <View style={s.cardTags}>
            <View style={[s.skeleton, { width: 60, height: 20, borderRadius: BorderRadius.full }]} />
            <View style={[s.skeleton, { width: 80, height: 20, borderRadius: BorderRadius.full }]} />
          </View>
          <View style={s.cardBottom}>
            <View style={[s.skeleton, { width: 70, height: 14, borderRadius: BorderRadius.sm }]} />
            <View style={[s.skeleton, { width: 50, height: 12, borderRadius: BorderRadius.sm }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PublicRequestsStates() {
  return (
    <>
      <StateSection title="INTERACTIVE">
        <InteractiveRequests />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyRequests />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingRequests />
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
  filterResetBtn: {
    height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  filterResetText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  pickerList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, overflow: 'hidden', maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  pickerText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  pickerTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  emptyStateWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.md },
  skeleton: { backgroundColor: Colors.bgSecondary },
});
