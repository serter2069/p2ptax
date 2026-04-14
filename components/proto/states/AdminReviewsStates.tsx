import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REVIEWS } from '../../../constants/protoMockData';

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function ReviewCard({ author, rating, text, date, specialistName, flagged }: {
  author: string; rating: number; text: string; date: string; specialistName: string; flagged?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[s.reviewCard, flagged && s.reviewCardFlagged]}>
      {flagged && (
        <View style={s.flagBanner}>
          <Feather name="flag" size={12} color={Colors.statusError} />
          <Text style={s.flagText}>Жалоба от пользователя</Text>
        </View>
      )}
      <View style={s.reviewHeader}>
        <View style={s.reviewLeft}>
          <Text style={s.reviewAuthor}>{author}</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Feather key={i} name="star" size={14} color={i <= rating ? Colors.statusWarning : Colors.bgSecondary} />
            ))}
          </View>
        </View>
        <View style={s.reviewRight}>
          <View style={s.specialistRow}>
            <Feather name="user" size={11} color={Colors.textMuted} />
            <Text style={s.reviewSpecialist}>{specialistName}</Text>
          </View>
          <View style={s.dateRow}>
            <Feather name="calendar" size={11} color={Colors.textMuted} />
            <Text style={s.reviewDate}>{date}</Text>
          </View>
        </View>
      </View>
      <Text style={s.reviewText} numberOfLines={expanded ? undefined : 2}>{text}</Text>
      <View style={s.reviewActions}>
        <Pressable style={s.btnExpand} onPress={() => setExpanded(!expanded)}>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textPrimary} />
          <Text style={s.btnExpandText}>{expanded ? 'Свернуть' : 'Подробнее'}</Text>
        </Pressable>
        {flagged ? (
          <Pressable style={s.btnUnflag}>
            <Feather name="flag" size={14} color={Colors.brandPrimary} />
            <Text style={s.btnUnflagText}>Снять жалобу</Text>
          </Pressable>
        ) : (
          <Pressable style={s.btnFlag}>
            <Feather name="flag" size={14} color={Colors.statusWarning} />
            <Text style={s.btnFlagText}>Отметить</Text>
          </Pressable>
        )}
        <Pressable style={s.btnDelete}>
          <Feather name="trash-2" size={14} color={Colors.statusError} />
          <Text style={s.btnDeleteText}>Удалить</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LIST (populated with stats)
// ---------------------------------------------------------------------------

function ReviewListState() {
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'Все' },
    { key: 'flagged', label: 'С жалобами' },
    { key: '5', label: '5 звёзд' },
    { key: '4', label: '4 звезды' },
    { key: 'low', label: '1-3 звезды' },
  ];

  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Отзывы</Text>
        <View style={s.avgRow}>
          <Feather name="star" size={16} color={Colors.statusWarning} />
          <Text style={s.avgText}>4.7 средний рейтинг</Text>
          <Text style={s.totalText}>· 50 отзывов</Text>
        </View>
      </View>

      <View style={s.stats}>
        {[
          { stars: 5, count: 28, pct: 56 },
          { stars: 4, count: 12, pct: 24 },
          { stars: 3, count: 6, pct: 12 },
          { stars: 2, count: 2, pct: 4 },
          { stars: 1, count: 2, pct: 4 },
        ].map((row) => (
          <View key={row.stars} style={s.statRow}>
            <View style={s.statStarsRow}>
              <Text style={s.statStarsNum}>{row.stars}</Text>
              <Feather name="star" size={12} color={Colors.statusWarning} />
            </View>
            <View style={s.statBar}><View style={[s.statBarFill, { width: `${row.pct}%` }]} /></View>
            <Text style={s.statCount}>{row.count}</Text>
          </View>
        ))}
      </View>

      <View style={s.filters}>
        {filters.map((f) => (
          <Pressable key={f.key} style={[s.filterChip, filter === f.key && s.filterActive]} onPress={() => setFilter(f.key)}>
            <Text style={[s.filterText, filter === f.key && s.filterActiveText]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Show one flagged review at top */}
      <ReviewCard
        author="Аноним"
        rating={1}
        text="Специалист не вышел на связь после оплаты. Прошло 2 недели, деньги не возвращает. Требую разбирательства."
        date="10.04.2026"
        specialistName="Игорь Новиков"
        flagged
      />

      {MOCK_REVIEWS.map((r) => (
        <ReviewCard key={r.id} author={r.author} rating={r.rating} text={r.text} date={r.date} specialistName={r.specialistName} />
      ))}

      <View style={s.paginationRow}>
        <Text style={s.paginationText}>Показано 6 из 50</Text>
        <Pressable style={s.loadMoreBtn}>
          <Text style={s.loadMoreText}>Загрузить ещё</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminReviewsStates() {
  return (
    <StateSection title="LIST">
      <ReviewListState />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },

  pageHeader: { gap: Spacing.xs },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  avgText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  totalText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  stats: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statStarsRow: { width: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  statStarsNum: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  statBar: { flex: 1, height: 8, backgroundColor: Colors.bgSecondary, borderRadius: 4 },
  statBarFill: { height: 8, backgroundColor: Colors.brandPrimary, borderRadius: 4 },
  statCount: { width: 24, fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  reviewCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  reviewCardFlagged: {
    borderColor: Colors.statusError + '40',
  },
  flagBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.statusBg.error, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.sm, alignSelf: 'flex-start',
  },
  flagText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.statusError },

  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewLeft: { gap: 4 },
  reviewRight: { alignItems: 'flex-end', gap: 4 },
  reviewAuthor: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  starsRow: { flexDirection: 'row', gap: 2 },
  specialistRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewSpecialist: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewDate: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  reviewText: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },

  reviewActions: { flexDirection: 'row', gap: Spacing.sm },
  btnExpand: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  btnExpandText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  btnFlag: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.warning, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  btnFlagText: { fontSize: Typography.fontSize.sm, color: Colors.statusWarning },
  btnUnflag: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.info, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  btnUnflagText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  btnDelete: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.error, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  btnDeleteText: { fontSize: Typography.fontSize.sm, color: Colors.statusError },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  paginationText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  loadMoreBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn, backgroundColor: Colors.bgSurface },
  loadMoreText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
});
