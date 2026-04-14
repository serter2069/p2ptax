import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_SPECIALISTS } from '../../../constants/protoMockData';

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
// POPULATED state
// ---------------------------------------------------------------------------
function PopulatedState() {
  const { isDesktop } = useLayout();
  const [search, setSearch] = useState('');

  const filtered = MOCK_SPECIALISTS.filter((sp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return sp.name.toLowerCase().includes(q) || sp.city.toLowerCase().includes(q) || sp.services.some((svc) => svc.toLowerCase().includes(q));
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.topSection}>
        <Text style={s.pageTitle}>Специалисты</Text>
        <Text style={s.pageSubtitle}>{filtered.length} специалистов на платформе</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, городу, услуге..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <View style={s.filterChips}>
        <View style={[s.filterChip, s.filterChipActive]}>
          <Text style={s.filterChipTextActive}>Все</Text>
        </View>
        <View style={s.filterChip}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={s.filterChipText}>Город</Text>
        </View>
        <View style={s.filterChip}>
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text style={s.filterChipText}>Услуга</Text>
        </View>
        <View style={s.filterChip}>
          <Feather name="star" size={12} color={Colors.textMuted} />
          <Text style={s.filterChipText}>Рейтинг</Text>
        </View>
      </View>

      {/* Results */}
      {filtered.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Feather name="search" size={32} color={Colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Не найдены</Text>
          <Text style={s.emptyText}>Попробуйте изменить параметры поиска</Text>
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
      <View style={[s.searchWrap, { opacity: 0.5 }]}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <View style={[s.skelLine, { width: 200, flex: 0 }]} />
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

  // Search
  searchWrap: {
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
  searchInput: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },

  // Filter chips
  filterChips: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  filterChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterChipText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  filterChipTextActive: { fontSize: Typography.fontSize.xs, color: Colors.white, fontWeight: Typography.fontWeight.semibold },

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
