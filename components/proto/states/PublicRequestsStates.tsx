import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS, MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------
function RequestFeedCard({ title, description, city, service, budget, date, responseCount }: {
  title: string; description: string; city: string; service: string; budget: string; date: string; responseCount: number;
}) {
  return (
    <Pressable style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={1}>{title}</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
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
        <Text style={s.budget}>{budget}</Text>
        <View style={s.cardMeta}>
          <Feather name="message-circle" size={12} color={Colors.textMuted} />
          <Text style={s.metaText}>{responseCount}</Text>
          <View style={s.metaDot} />
          <Text style={s.metaText}>{date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <View style={[s.card, { opacity: 0.6 }]}>
      <View style={[s.skelLine, { width: '70%', height: 16 }]} />
      <View style={[s.skelLine, { width: '100%' }]} />
      <View style={[s.skelLine, { width: '45%' }]} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={[s.skelLine, { width: 80 }]} />
        <View style={[s.skelLine, { width: 100 }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// POPULATED state
// ---------------------------------------------------------------------------
function PopulatedState() {
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterService, setFilterService] = useState('');
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
      {/* Header */}
      <View style={s.topBar}>
        <View>
          <Text style={s.pageTitle}>Заявки</Text>
          <Text style={s.pageSubtitle}>{requests.length} активных заявок</Text>
        </View>
        <Pressable onPress={() => setShowFilters(!showFilters)} style={[s.filterToggle, showFilters && s.filterToggleActive]}>
          <Feather name="sliders" size={16} color={showFilters ? Colors.white : Colors.brandPrimary} />
          <Text style={[s.filterToggleText, showFilters && s.filterToggleTextActive]}>
            {showFilters ? 'Скрыть' : 'Фильтры'}
          </Text>
        </Pressable>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={s.filterPanel}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Город</Text>
            <Pressable onPress={() => { setShowCityPicker(!showCityPicker); setShowServicePicker(false); }}>
              <View style={s.filterSelect}>
                <Text style={filterCity ? s.filterSelectValue : s.filterSelectPlaceholder}>
                  {filterCity || 'Все города'}
                </Text>
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
                    <Text style={[s.pickerText, filterCity === c && s.pickerTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Услуга</Text>
            <Pressable onPress={() => { setShowServicePicker(!showServicePicker); setShowCityPicker(false); }}>
              <View style={s.filterSelect}>
                <Text style={filterService ? s.filterSelectValue : s.filterSelectPlaceholder}>
                  {filterService || 'Все услуги'}
                </Text>
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
                    <Text style={[s.pickerText, filterService === svc.name && s.pickerTextActive]}>{svc.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {(filterCity || filterService) && (
            <Pressable onPress={() => { setFilterCity(''); setFilterService(''); }} style={s.filterResetBtn}>
              <Feather name="x" size={14} color={Colors.textMuted} />
              <Text style={s.filterResetText}>Сбросить</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* List */}
      {requests.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Feather name="inbox" size={32} color={Colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Нет заявок</Text>
          <Text style={s.emptyText}>Попробуйте изменить параметры фильтров</Text>
        </View>
      ) : (
        requests.map((r) => (
          <RequestFeedCard
            key={r.id}
            title={r.title}
            description={r.description}
            city={r.city}
            service={r.service}
            budget={r.budget}
            date={r.createdAt}
            responseCount={r.responseCount}
          />
        ))
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// EMPTY state
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Заявки</Text>
      </View>
      <View style={s.emptyWrap}>
        <View style={s.emptyIconWrap}>
          <Feather name="file-text" size={36} color={Colors.textMuted} />
        </View>
        <Text style={s.emptyTitle}>Заявок пока нет</Text>
        <Text style={s.emptyText}>Новые заявки появятся здесь, когда клиенты оставят запросы</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// LOADING state
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View>
          <View style={[s.skelLine, { width: 100, height: 18 }]} />
          <View style={[s.skelLine, { width: 140, marginTop: 6 }]} />
        </View>
        <View style={[s.skelLine, { width: 80, height: 32, borderRadius: BorderRadius.btn }]} />
      </View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ERROR state
// ---------------------------------------------------------------------------
function ErrorState() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Заявки</Text>
      </View>
      <View style={s.errorWrap}>
        <View style={s.errorIconWrap}>
          <Feather name="wifi-off" size={32} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Ошибка загрузки</Text>
        <Text style={s.errorText}>Не удалось загрузить заявки. Проверьте подключение к интернету.</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={14} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function PublicRequestsStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="POPULATED" pageId="public-requests">
        <PopulatedState />
      </StateSection>

      <StateSection title="EMPTY" pageId="public-requests">
        <EmptyState />
      </StateSection>

      <StateSection title="LOADING" pageId="public-requests">
        <LoadingState />
      </StateSection>

      <StateSection title="ERROR" pageId="public-requests">
        <ErrorState />
      </StateSection>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { padding: Spacing.xl, gap: Spacing.md },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },

  // Filter toggle
  filterToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterToggleActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterToggleText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  filterToggleTextActive: { color: Colors.white },

  // Cards
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  cardDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  cardTags: { flexDirection: 'row', gap: Spacing.sm },
  tag: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  budget: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textMuted },

  // Filters
  filterPanel: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  filterGroup: { gap: Spacing.xs },
  filterLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterSelect: {
    height: 40,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterSelectPlaceholder: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterSelectValue: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  filterResetBtn: {
    height: 36,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterResetText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Picker
  pickerList: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.card,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
    maxHeight: 200,
    ...Shadows.md,
  },
  pickerItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  pickerTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 260 },

  // Error
  errorWrap: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.statusBg.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Skeleton
  skelLine: { height: 12, borderRadius: 4, backgroundColor: Colors.bgSecondary },
});
