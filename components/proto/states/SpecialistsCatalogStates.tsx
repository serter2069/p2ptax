import React, { useState, useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_SPECIALISTS, MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

// ---------------------------------------------------------------------------
// Mock FNS data (tax offices by city)
// ---------------------------------------------------------------------------
const MOCK_FNS: Record<string, string[]> = {
  'Москва': ['ИФНС №1 по г. Москве', 'ИФНС №46 по г. Москве', 'МРИ ФНС №12 по г. Москве'],
  'Санкт-Петербург': ['ИФНС №15 по СПб', 'МРИ ФНС №7 по СПб'],
  'Казань': ['ИФНС по г. Казани', 'МРИ ФНС №6 по РТ'],
  'Новосибирск': ['ИФНС по г. Новосибирску', 'МРИ ФНС №16 по НСО'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={size} color={i <= Math.round(rating) ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Specialist Card
// ---------------------------------------------------------------------------
function SpecialistCard({ name, city, services, rating, reviews, experience, completedOrders }: {
  name: string; city: string; services: string[]; rating: number; reviews: number; experience: string; completedOrders: number;
}) {
  const seed = name.replace(/\s/g, '-').toLowerCase();
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Image source={{ uri: `https://picsum.photos/seed/${seed}/48/48` }} style={s.avatar} />
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <View style={s.locationRow}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={s.city}>{city}</Text>
          </View>
          <View style={s.ratingRow}>
            <Stars rating={rating} />
            <Text style={s.ratingNum}>{rating}</Text>
            <Text style={s.ratingCount}>({reviews})</Text>
          </View>
        </View>
      </View>

      <View style={s.chipRow}>
        {services.slice(0, 2).map((svc) => (
          <View key={svc} style={s.chip}>
            <Text style={s.chipText}>{svc}</Text>
          </View>
        ))}
        {services.length > 2 && (
          <View style={s.chipMore}>
            <Text style={s.chipMoreText}>+{services.length - 2}</Text>
          </View>
        )}
      </View>

      <View style={s.cardMeta}>
        <View style={s.metaBlock}>
          <Feather name="award" size={12} color={Colors.textMuted} />
          <Text style={s.metaText}>{experience}</Text>
        </View>
        <View style={s.metaDot} />
        <View style={s.metaBlock}>
          <Feather name="check-circle" size={12} color={Colors.textMuted} />
          <Text style={s.metaText}>{completedOrders} done</Text>
        </View>
      </View>

      <Pressable style={s.cardBtn}>
        <Text style={s.cardBtnText}>Подробнее</Text>
        <Feather name="chevron-right" size={16} color={Colors.brandPrimary} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <View style={[s.card, { opacity: 0.5 }]}>
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: Colors.bgSecondary }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[s.skelLine, { width: '60%', height: 14 }]} />
          <View style={[s.skelLine, { width: '40%' }]} />
          <View style={[s.skelLine, { width: '50%' }]} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
        <View style={[s.skelLine, { width: 80 }]} />
        <View style={[s.skelLine, { width: 100 }]} />
      </View>
      <View style={[s.skelLine, { width: '100%', height: 36, borderRadius: BorderRadius.btn }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dropdown selector
// ---------------------------------------------------------------------------
function DropdownSelect({ label, icon, value, options, onSelect, placeholder }: {
  label: string; icon: React.ComponentProps<typeof Feather>['name']; value: string;
  options: string[]; onSelect: (v: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.dropdownWrap}>
      <Text style={s.dropdownLabel}>{label}</Text>
      <Pressable style={[s.dropdownBtn, open && s.dropdownBtnOpen]} onPress={() => setOpen(!open)}>
        <Feather name={icon} size={14} color={value ? Colors.brandPrimary : Colors.textMuted} />
        <Text style={[s.dropdownBtnText, !value && { color: Colors.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <View style={s.dropdownList}>
          <Pressable style={s.dropdownItem} onPress={() => { onSelect(''); setOpen(false); }}>
            <Text style={[s.dropdownItemText, !value && { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold }]}>
              Все
            </Text>
          </Pressable>
          {options.map((opt) => (
            <Pressable key={opt} style={s.dropdownItem} onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={[s.dropdownItemText, value === opt && { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold }]}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// POPULATED state
// ---------------------------------------------------------------------------
function PopulatedState() {
  const { isDesktop } = useLayout();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedFns, setSelectedFns] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const fnsOptions = useMemo(() => {
    if (!selectedCity) return [];
    return MOCK_FNS[selectedCity] || [];
  }, [selectedCity]);

  const serviceNames = useMemo(() => MOCK_SERVICES.map((svc) => svc.name), []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedFns(''); // reset FNS when city changes
  };

  const filtered = useMemo(() => {
    return MOCK_SPECIALISTS.filter((sp) => {
      if (selectedCity && sp.city !== selectedCity) return false;
      if (selectedService && !sp.services.includes(selectedService)) return false;
      return true;
    });
  }, [selectedCity, selectedService]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.topSection}>
        <Text style={s.pageTitle}>Каталог специалистов</Text>
        <Text style={s.pageSubtitle}>
          {filtered.length} {filtered.length === 1 ? 'специалист' : 'специалистов'} найдено
        </Text>
      </View>

      {/* Filters: City -> FNS -> Service */}
      <View style={[s.filtersRow, isDesktop && s.filtersRowDesktop]}>
        <DropdownSelect
          label="Город"
          icon="map-pin"
          value={selectedCity}
          options={MOCK_CITIES}
          onSelect={handleCityChange}
          placeholder="Выберите город"
        />
        <DropdownSelect
          label="ФНС"
          icon="home"
          value={selectedFns}
          options={fnsOptions}
          onSelect={setSelectedFns}
          placeholder={selectedCity ? 'Выберите ФНС' : 'Сначала выберите город'}
        />
        <DropdownSelect
          label="Услуга"
          icon="briefcase"
          value={selectedService}
          options={serviceNames}
          onSelect={setSelectedService}
          placeholder="Выберите услугу"
        />
      </View>

      {/* Active filters summary */}
      {(selectedCity || selectedService) && (
        <View style={s.activeFilters}>
          {selectedCity !== '' && (
            <Pressable style={s.activeFilterChip} onPress={() => handleCityChange('')}>
              <Text style={s.activeFilterText}>{selectedCity}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          )}
          {selectedFns !== '' && (
            <Pressable style={s.activeFilterChip} onPress={() => setSelectedFns('')}>
              <Text style={s.activeFilterText}>{selectedFns}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          )}
          {selectedService !== '' && (
            <Pressable style={s.activeFilterChip} onPress={() => setSelectedService('')}>
              <Text style={s.activeFilterText}>{selectedService}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          )}
          <Pressable onPress={() => { setSelectedCity(''); setSelectedFns(''); setSelectedService(''); }}>
            <Text style={s.clearFilters}>Сбросить всё</Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Feather name="search" size={32} color={Colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Специалисты не найдены</Text>
          <Text style={s.emptyText}>Попробуйте изменить параметры фильтрации</Text>
        </View>
      ) : (
        <View style={[s.grid, isDesktop && s.gridDesktop]}>
          {filtered.map((sp) => (
            <SpecialistCard
              key={sp.id}
              name={sp.name}
              city={sp.city}
              services={sp.services}
              rating={sp.rating}
              reviews={sp.reviewCount}
              experience={sp.experience}
              completedOrders={sp.completedOrders}
            />
          ))}
        </View>
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
      <View style={s.topSection}>
        <Text style={s.pageTitle}>Специалисты</Text>
      </View>
      <View style={s.emptyWrap}>
        <View style={s.emptyIconWrap}>
          <Feather name="users" size={36} color={Colors.textMuted} />
        </View>
        <Text style={s.emptyTitle}>Специалистов пока нет</Text>
        <Text style={s.emptyText}>Мы активно привлекаем специалистов. Скоро здесь появятся лучшие налоговые консультанты.</Text>
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
      <View style={s.topSection}>
        <View style={[s.skelLine, { width: 140, height: 18 }]} />
        <View style={[s.skelLine, { width: 200, marginTop: 6 }]} />
      </View>
      <View style={[s.filtersRow, { opacity: 0.5 }]}>
        <View style={[s.skelLine, { width: '100%', height: 44 }]} />
        <View style={[s.skelLine, { width: '100%', height: 44 }]} />
        <View style={[s.skelLine, { width: '100%', height: 44 }]} />
      </View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function SpecialistsCatalogStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="POPULATED" pageId="specialists-catalog">
        <PopulatedState />
      </StateSection>

      <StateSection title="EMPTY" pageId="specialists-catalog">
        <EmptyState />
      </StateSection>

      <StateSection title="LOADING" pageId="specialists-catalog">
        <LoadingState />
      </StateSection>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { padding: Spacing.xl, gap: Spacing.md },

  // Top
  topSection: { gap: 2 },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Filters row
  filtersRow: { gap: Spacing.md },
  filtersRowDesktop: { flexDirection: 'row' },

  // Dropdown
  dropdownWrap: { flex: 1, gap: 4, zIndex: 10 },
  dropdownLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase' as const },
  dropdownBtn: {
    height: 44,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dropdownBtnOpen: { borderColor: Colors.brandPrimary },
  dropdownBtnText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  dropdownList: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card,
    marginTop: 4,
    maxHeight: 200,
    ...Shadows.sm,
  },
  dropdownItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  dropdownItemText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },

  // Active filters
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  activeFilterText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  clearFilters: { fontSize: Typography.fontSize.xs, color: Colors.statusError, fontWeight: Typography.fontWeight.medium },

  // Grid
  grid: { gap: Spacing.md },
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },

  // Card
  card: {
    flex: 1,
    minWidth: 280,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgSecondary },
  info: { flex: 1, gap: 2 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingNum: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  ratingCount: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  chipText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  chipMore: {
    backgroundColor: Colors.statusBg.neutral,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  chipMoreText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },

  // Meta
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textMuted },

  // Card button
  cardBtn: {
    height: 40,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  cardBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },

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

  // Skeleton
  skelLine: { height: 12, borderRadius: 4, backgroundColor: Colors.bgSecondary },
});
