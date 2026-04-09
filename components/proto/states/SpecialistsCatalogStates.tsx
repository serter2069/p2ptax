import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_SPECIALISTS } from '../../../constants/protoMockData';

function SpecialistCard({ name, city, services, rating, reviews, experience, completedOrders }: {
  name: string; city: string; services: string[]; rating: number; reviews: number; experience: string; completedOrders: number;
}) {
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}><Text style={s.avatarText}>{name.split(' ').map(n => n[0]).join('')}</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.city}>{city}</Text>
          <View style={s.ratingRow}>
            <Text style={s.starsText}>{stars}</Text>
            <Text style={s.ratingLabel}>{rating} ({reviews})</Text>
          </View>
        </View>
      </View>
      <View style={s.chipRow}>
        {services.slice(0, 2).map((svc) => (
          <View key={svc} style={s.chip}><Text style={s.chipText}>{svc}</Text></View>
        ))}
        {services.length > 2 && (
          <View style={s.chip}><Text style={s.chipText}>+{services.length - 2}</Text></View>
        )}
      </View>
      <View style={s.cardMeta}>
        <Text style={s.metaItem}>Опыт: {experience}</Text>
        <Text style={s.metaDot}>{'·'}</Text>
        <Text style={s.metaItem}>{completedOrders} заказов</Text>
      </View>
      <View style={s.cardBtn}><Text style={s.cardBtnText}>Подробнее</Text></View>
    </View>
  );
}

export function SpecialistsCatalogStates() {
  return (
    <>
      <StateSection title="LIST">
        <View style={s.container}>
          <Text style={s.pageTitle}>Специалисты</Text>
          <TextInput
            value=""
            editable={false}
            placeholder="Поиск по имени, городу, услуге..."
            placeholderTextColor={Colors.textMuted}
            style={s.searchInput}
          />
          {MOCK_SPECIALISTS.map((sp) => (
            <SpecialistCard
              key={sp.id} name={sp.name} city={sp.city} services={sp.services}
              rating={sp.rating} reviews={sp.reviewCount} experience={sp.experience} completedOrders={sp.completedOrders}
            />
          ))}
        </View>
      </StateSection>
      <StateSection title="SEARCH">
        <View style={s.container}>
          <Text style={s.pageTitle}>Специалисты</Text>
          <TextInput
            value="Москва 3-НДФЛ"
            editable={false}
            style={s.searchInput}
          />
          <Text style={s.resultCount}>Найдено: 2 специалиста</Text>
          {MOCK_SPECIALISTS.filter(sp => sp.city === 'Москва').map((sp) => (
            <SpecialistCard
              key={sp.id} name={sp.name} city={sp.city} services={sp.services}
              rating={sp.rating} reviews={sp.reviewCount} experience={sp.experience} completedOrders={sp.completedOrders}
            />
          ))}
        </View>
      </StateSection>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <Text style={s.pageTitle}>Специалисты</Text>
          <TextInput
            value="Якутск аудит"
            editable={false}
            style={s.searchInput}
          />
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Специалисты не найдены</Text>
            <Text style={s.emptyText}>Попробуйте изменить параметры поиска</Text>
          </View>
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  searchInput: {
    height: 44, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.sm, color: Colors.textPrimary,
  },
  resultCount: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  info: { flex: 1, gap: 1 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  city: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  starsText: { fontSize: 12, color: Colors.brandPrimary },
  ratingLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  chipText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaDot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardBtn: {
    height: 38, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.brandPrimary,
  },
  cardBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
