import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/Colors';
import { MOCK_PRICING_PLANS } from '../constants/protoMockData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// ---------------------------------------------------------------------------
// Plan Card
// ---------------------------------------------------------------------------
function PlanCard({ name, price, period, features, highlighted, selected, onSelect }: {
  name: string; price: string; period: string; features: string[];
  highlighted: boolean; selected: boolean; onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[
        s.planCard,
        highlighted && s.planHighlighted,
        selected && !highlighted && s.planSelected,
      ]}
    >
      {highlighted && (
        <View style={s.popularBadge}>
          <Text style={s.popularText}>Популярный</Text>
        </View>
      )}

      <Text style={[s.planName, highlighted && s.planNameHL]}>{name}</Text>

      <View style={s.priceRow}>
        <Text style={[s.price, highlighted && s.priceHL]}>{price}</Text>
        <Text style={s.period}>/ {period}</Text>
      </View>

      <View style={s.divider} />

      <View style={s.featureList}>
        {features.map((f) => (
          <View key={f} style={s.featureRow}>
            <View style={[s.featureCheck, highlighted && s.featureCheckHL]}>
              <Feather name="check" size={12} color={highlighted ? Colors.brandPrimary : Colors.statusSuccess} />
            </View>
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[
          s.planBtn,
          (highlighted || selected) && s.planBtnHL,
        ]}
      >
        <Text style={[s.planBtnText, (highlighted || selected) && s.planBtnTextHL]}>
          {selected ? 'Выбрано' : highlighted ? 'Начать' : 'Выбрать'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// DEFAULT state
// ---------------------------------------------------------------------------
function DefaultState() {
  const { isDesktop } = useLayout();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.sectionLabel}>ТАРИФЫ</Text>
        <Text style={s.title}>Выберите подходящий план</Text>
        <Text style={s.subtitle}>Начните бесплатно, обновите когда будете готовы</Text>
      </View>

      {/* Billing toggle */}
      <View style={s.billingToggle}>
        <Pressable
          style={[s.billingBtn, billing === 'monthly' && s.billingBtnActive]}
          onPress={() => setBilling('monthly')}
        >
          <Text style={[s.billingBtnText, billing === 'monthly' && s.billingBtnTextActive]}>Ежемесячно</Text>
        </Pressable>
        <Pressable
          style={[s.billingBtn, billing === 'annual' && s.billingBtnActive]}
          onPress={() => setBilling('annual')}
        >
          <Text style={[s.billingBtnText, billing === 'annual' && s.billingBtnTextActive]}>Ежегодно</Text>
          <View style={s.discountBadge}>
            <Text style={s.discountText}>-20%</Text>
          </View>
        </Pressable>
      </View>

      {/* Plans */}
      <View style={[s.plans, isDesktop && s.plansDesktop]}>
        {MOCK_PRICING_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            {...plan}
            selected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id)}
          />
        ))}
      </View>

      {/* Feature comparison */}
      <View style={s.comparison}>
        <Text style={s.comparisonTitle}>Сравнение функций</Text>
        <View style={s.compTable}>
          {[
            { feature: 'Количество заявок', free: 'До 3/мес', pro: 'Безлимит', biz: 'Безлимит' },
            { feature: 'Поиск специалистов', free: 'Базовый', pro: 'Расширенный', biz: 'Расширенный' },
            { feature: 'Чат', free: 'Да', pro: 'Да', biz: 'Да' },
            { feature: 'Приоритет в выдаче', free: '--', pro: 'Да', biz: 'Да' },
            { feature: 'Аналитика', free: '--', pro: 'Да', biz: 'Да' },
            { feature: 'Команда', free: '--', pro: '--', biz: 'До 5 чел.' },
            { feature: 'API доступ', free: '--', pro: '--', biz: 'Да' },
          ].map((row, i) => (
            <View key={row.feature} style={[s.compRow, i % 2 === 0 && s.compRowAlt]}>
              <Text style={s.compFeature}>{row.feature}</Text>
              <Text style={s.compCell}>{row.free}</Text>
              <Text style={[s.compCell, s.compCellHL]}>{row.pro}</Text>
              <Text style={s.compCell}>{row.biz}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FAQ */}
      <View style={s.faq}>
        <Text style={s.faqTitle}>Частые вопросы</Text>
        {[
          { q: 'Можно ли сменить тариф?', a: 'Да, вы можете перейти на другой тариф в любой момент.' },
          { q: 'Есть ли пробный период?', a: 'Профессиональный тариф включает 14 дней бесплатного использования.' },
          { q: 'Как отменить подписку?', a: 'Отменить можно в настройках профиля. Средства за текущий период не возвращаются.' },
        ].map((item) => (
          <View key={item.q} style={s.faqItem}>
            <Text style={s.faqQ}>{item.q}</Text>
            <Text style={s.faqA}>{item.a}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PricingPage() {
  return <DefaultState />;
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { padding: Spacing.xl, gap: Spacing['2xl'] },

  // Header
  header: { alignItems: 'center', gap: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Billing toggle
  billingToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.btn,
    padding: 3,
    gap: 2,
  },
  billingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn - 2,
  },
  billingBtnActive: { backgroundColor: Colors.bgCard, ...Shadows.sm },
  billingBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  billingBtnTextActive: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold },
  discountBadge: { backgroundColor: Colors.statusBg.success, paddingHorizontal: 6, paddingVertical: 1, borderRadius: BorderRadius.sm },
  discountText: { fontSize: 10, fontWeight: Typography.fontWeight.bold, color: Colors.statusSuccess },

  // Plans
  plans: { gap: Spacing.md },
  plansDesktop: { flexDirection: 'row' },
  planCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    position: 'relative',
    ...Shadows.sm,
  },
  planHighlighted: { borderColor: Colors.brandPrimary, borderWidth: 2 },
  planSelected: { borderColor: Colors.brandPrimary, borderWidth: 2 },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  popularText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  planName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  planNameHL: { color: Colors.brandPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  price: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  priceHL: { color: Colors.brandPrimary },
  period: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  featureList: { gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.statusBg.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheckHL: { backgroundColor: Colors.bgSecondary },
  featureText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, flex: 1 },
  planBtn: {
    height: 44,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  planBtnHL: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  planBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  planBtnTextHL: { color: Colors.white },

  // Feature comparison
  comparison: { gap: Spacing.md },
  comparisonTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  compTable: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  compRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  compRowAlt: { backgroundColor: Colors.bgSecondary },
  compFeature: { flex: 2, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium },
  compCell: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  compCellHL: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },

  // FAQ
  faq: { gap: Spacing.md },
  faqTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  faqItem: {
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  faqQ: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  faqA: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, lineHeight: 20 },

  // Skeleton
  skelLine: { height: 12, borderRadius: 4, backgroundColor: Colors.bgSecondary },
});
