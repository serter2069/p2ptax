import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_REVIEWS } from '../../../constants/protoMockData';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

function ReviewRow({ author, rating, text, date, specialistName }: {
  author: string; rating: number; text: string; date: string; specialistName: string;
}) {
  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <View style={s.reviewLeft}>
          <Text style={s.reviewAuthor}>{author}</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Feather key={i} name="star" size={12} color={i <= rating ? Colors.brandPrimary : Colors.bgSecondary} />
            ))}
          </View>
        </View>
        <View style={s.reviewRight}>
          <Text style={s.reviewSpecialist}>О: {specialistName}</Text>
          <Text style={s.reviewDate}>{date}</Text>
        </View>
      </View>
      <Text style={s.reviewText}>{text}</Text>
      <View style={s.reviewActions}>
        <View style={s.btnView}><Text style={s.btnViewText}>Подробнее</Text></View>
        <View style={s.btnDelete}><Text style={s.btnDeleteText}>Удалить</Text></View>
      </View>
    </View>
  );
}

export function AdminReviewsStates() {
  return (
    <StateSection title="LIST" maxWidth={800}>
      <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
        <ProtoHeader variant="auth" />
        <View style={{ flex: 1 }}>

      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.pageTitle}>Отзывы</Text>
          <Text style={s.subtitle}>Средний рейтинг: 4.7</Text>
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
                <Feather name="star" size={10} color={Colors.brandPrimary} />
              </View>
              <View style={s.statBar}><View style={[s.statBarFill, { width: `${row.pct}%` }]} /></View>
              <Text style={s.statCount}>{row.count}</Text>
            </View>
          ))}
        </View>
        {MOCK_REVIEWS.map((r) => (
          <ReviewRow key={r.id} author={r.author} rating={r.rating} text={r.text} date={r.date} specialistName={r.specialistName} />
        ))}
      </View>
            </View>
        <ProtoTabBar activeTab="home" />
      </View>
</StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  header: { gap: Spacing.xs },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  stats: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statStarsRow: { width: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  statStarsNum: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  statBar: { flex: 1, height: 8, backgroundColor: Colors.bgSecondary, borderRadius: 4 },
  statBarFill: { height: 8, backgroundColor: Colors.brandPrimary, borderRadius: 4 },
  statCount: { width: 24, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  reviewCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewLeft: { gap: 2 },
  reviewRight: { alignItems: 'flex-end', gap: 2 },
  reviewAuthor: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewSpecialist: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  reviewDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  reviewText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  reviewActions: { flexDirection: 'row', gap: Spacing.sm },
  btnView: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnViewText: { fontSize: Typography.fontSize.xs, color: Colors.textPrimary },
  btnDelete: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.error,
  },
  btnDeleteText: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
});
