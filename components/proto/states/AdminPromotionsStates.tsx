import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

const PROMO_DATA = [
  { id: '1', code: 'WELCOME30', discount: '30%', type: 'Скидка на тариф', usages: 45, maxUsages: 100, active: true, expiry: '30.06.2026' },
  { id: '2', code: 'NEWYEAR', discount: '50%', type: 'Новогодняя акция', usages: 100, maxUsages: 100, active: false, expiry: '31.01.2026' },
  { id: '3', code: 'FRIEND10', discount: '10%', type: 'Реферальная программа', usages: 23, maxUsages: 500, active: true, expiry: '31.12.2026' },
  { id: '4', code: 'LAUNCH', discount: '100%', type: 'Бесплатный месяц', usages: 189, maxUsages: 200, active: true, expiry: '01.05.2026' },
];

function PromoCard({ code, discount, type, usages, maxUsages, active, expiry }: {
  code: string; discount: string; type: string; usages: number; maxUsages: number; active: boolean; expiry: string;
}) {
  const [toggled, setToggled] = useState(active);
  const pct = Math.round((usages / maxUsages) * 100);
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View>
          <View style={s.codeRow}>
            <Text style={s.code}>{code}</Text>
            <View style={[s.statusDot, { backgroundColor: toggled ? Colors.statusSuccess : Colors.textMuted }]} />
          </View>
          <Text style={s.type}>{type}</Text>
        </View>
        <View style={s.discountBadge}>
          <Text style={s.discountText}>{discount}</Text>
        </View>
      </View>
      <View style={s.progressRow}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={s.usageText}>{usages}/{maxUsages}</Text>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.expiry}>До {expiry}</Text>
        <View style={s.cardActions}>
          <View style={s.btnEdit}><Text style={s.btnEditText}>Изменить</Text></View>
          <Pressable style={s.btnToggle} onPress={() => setToggled(!toggled)}>
            <Text style={s.btnToggleText}>{toggled ? 'Деактивировать' : 'Активировать'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function AdminPromotionsStates() {
  return (
    <StateSection title="LIST">
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.pageTitle}>Промо-коды</Text>
          <View style={s.addBtn}><Text style={s.addBtnText}>+ Создать</Text></View>
        </View>
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statValue}>4</Text>
            <Text style={s.statLabel}>Всего</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statValue, { color: Colors.statusSuccess }]}>3</Text>
            <Text style={s.statLabel}>Активные</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>357</Text>
            <Text style={s.statLabel}>Использований</Text>
          </View>
        </View>
        {PROMO_DATA.map((p) => (
          <PromoCard key={p.id} {...p} />
        ))}
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 20, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  code: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, fontFamily: 'monospace' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  type: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  discountBadge: {
    backgroundColor: Colors.brandPrimary + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  discountText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.bgSecondary, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.brandPrimary, borderRadius: 3 },
  usageText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, minWidth: 50, textAlign: 'right' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expiry: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  btnEdit: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnEditText: { fontSize: Typography.fontSize.xs, color: Colors.textPrimary },
  btnToggle: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
  },
  btnToggleText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary },
});
