import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_SPECIALISTS } from '../../../constants/protoMockData';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= Math.round(rating) ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function SpecialistCard({ name, city, services, rating, reviews, experience, completedOrders }: {
  name: string; city: string; services: string[]; rating: number; reviews: number; experience: string; completedOrders: number;
}) {
  const seed = name.replace(/\s/g, '-').toLowerCase();
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Image source={{ uri: `https://picsum.photos/seed/${seed}/48/48` }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <View style={s.cityRow}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={s.city}>{city}</Text>
          </View>
          <View style={s.ratingRow}>
            <Stars rating={rating} />
            <Text style={s.ratingLabel}>{rating} ({reviews} отзывов)</Text>
          </View>
        </View>
      </View>
      <View style={s.chipRow}>
        {services.slice(0, 2).map((svc) => (
          <View key={svc} style={s.chip}>
            <Feather name="check" size={11} color={Colors.brandPrimary} />
            <Text style={s.chipText}>{svc}</Text>
          </View>
        ))}
        {services.length > 2 && (
          <View style={s.chip}><Text style={s.chipText}>+{services.length - 2}</Text></View>
        )}
      </View>
      <View style={s.cardMeta}>
        <View style={s.metaBlock}>
          <Feather name="award" size={12} color={Colors.textMuted} />
          <Text style={s.metaItem}>Опыт: {experience}</Text>
        </View>
        <View style={s.metaBlock}>
          <Feather name="file-text" size={12} color={Colors.textMuted} />
          <Text style={s.metaItem}>{completedOrders} заказов</Text>
        </View>
      </View>
      <Pressable style={s.cardBtn}>
        <Text style={s.cardBtnText}>Подробнее</Text>
        <Feather name="chevron-right" size={16} color={Colors.brandPrimary} />
      </Pressable>
    </View>
  );
}

function InteractiveCatalog() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_SPECIALISTS.filter((sp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      sp.name.toLowerCase().includes(q) ||
      sp.city.toLowerCase().includes(q) ||
      sp.services.some((svc) => svc.toLowerCase().includes(q))
    );
  });

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Feather name="users" size={20} color={Colors.brandPrimary} />
        <Text style={s.pageTitle}>Специалисты</Text>
      </View>
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, городу, услуге..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
      </View>
      {search && (
        <Text style={s.resultCount}>Найдено: {filtered.length} {filtered.length === 1 ? 'специалист' : 'специалистов'}</Text>
      )}
      {filtered.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="search" size={40} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Специалисты не найдены</Text>
          <Text style={s.emptyText}>Попробуйте изменить параметры поиска</Text>
        </View>
      ) : (
        filtered.map((sp) => (
          <SpecialistCard
            key={sp.id} name={sp.name} city={sp.city} services={sp.services}
            rating={sp.rating} reviews={sp.reviewCount} experience={sp.experience} completedOrders={sp.completedOrders}
          />
        ))
      )}
    </View>
  );
}

export function SpecialistsCatalogStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveCatalog />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  searchWrap: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  resultCount: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md },
  info: { flex: 1, gap: 2 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  chipText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  cardBtn: {
    height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.brandPrimary, flexDirection: 'row', gap: Spacing.xs,
  },
  cardBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
});
