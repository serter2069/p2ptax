import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_SPECIALISTS } from '../../../constants/protoMockData';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
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
          <Text style={s.city}>{city}</Text>
          <View style={s.ratingRow}>
            <Stars rating={rating} />
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
      <Pressable style={s.cardBtn}><Text style={s.cardBtnText}>Подробнее</Text></Pressable>
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
      <Text style={s.pageTitle}>Специалисты</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Поиск по имени, городу, услуге..."
        placeholderTextColor={Colors.textMuted}
        style={s.searchInput}
      />
      {search && (
        <Text style={s.resultCount}>Найдено: {filtered.length} {filtered.length === 1 ? 'специалист' : 'специалистов'}</Text>
      )}
      {filtered.length === 0 ? (
        <View style={s.emptyWrap}>
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

function SkeletonCard() {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.border }} />
        <View style={s.info}>
          <View style={{ width: 120, height: 14, backgroundColor: Colors.border, borderRadius: 4 }} />
          <View style={{ width: 80, height: 12, backgroundColor: Colors.border, borderRadius: 4, marginTop: 4 }} />
          <View style={{ width: 100, height: 12, backgroundColor: Colors.border, borderRadius: 4, marginTop: 4 }} />
        </View>
      </View>
      <View style={s.chipRow}>
        <View style={{ width: 80, height: 20, backgroundColor: Colors.border, borderRadius: BorderRadius.full }} />
        <View style={{ width: 60, height: 20, backgroundColor: Colors.border, borderRadius: BorderRadius.full }} />
      </View>
      <View style={{ width: '60%', height: 12, backgroundColor: Colors.border, borderRadius: 4 }} />
      <View style={{ height: 38, backgroundColor: Colors.border, borderRadius: BorderRadius.md }} />
    </View>
  );
}

function EmptyCatalog() {
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Специалисты</Text>
      <TextInput
        editable={false}
        placeholder="Поиск по имени, городу, услуге..."
        placeholderTextColor={Colors.textMuted}
        style={s.searchInput}
      />
      <View style={s.emptyWrap}>
        <Feather name="search" size={40} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>Специалисты не найдены</Text>
        <Text style={s.emptyText}>Попробуйте изменить параметры поиска или вернитесь позже</Text>
      </View>
    </View>
  );
}

function LoadingCatalog() {
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Специалисты</Text>
      <TextInput
        editable={false}
        placeholder="Поиск по имени, городу, услуге..."
        placeholderTextColor={Colors.textMuted}
        style={s.searchInput}
      />
      <ActivityIndicator size="small" color={Colors.brandPrimary} style={{ alignSelf: 'center', marginVertical: Spacing.sm }} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export function SpecialistsCatalogStates() {
  return (
    <>
      <StateSection title="INTERACTIVE" maxWidth={1024}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <InteractiveCatalog />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="EMPTY" maxWidth={1024}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <EmptyCatalog />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="LOADING" maxWidth={1024}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <LoadingCatalog />
                </View>
          <ProtoTabBar activeTab="home" />
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
  info: { flex: 1, gap: 1 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  city: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
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
