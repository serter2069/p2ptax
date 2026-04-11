import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_PRICING_PLANS } from '../../../constants/protoMockData';

function PlanCard({ name, price, period, features, highlighted, selected, onSelect }: {
  name: string; price: string; period: string; features: string[]; highlighted: boolean; selected: boolean; onSelect: () => void;
}) {
  return (
    <Pressable onPress={onSelect} style={[s.planCard, highlighted ? s.planHighlighted : null, selected ? s.planSelected : null]}>
      {highlighted && <View style={s.popularBadge}><Text style={s.popularText}>Популярный</Text></View>}
      <Text style={[s.planName, highlighted ? s.planNameHL : null]}>{name}</Text>
      <View style={s.priceRow}>
        <Text style={[s.price, highlighted ? s.priceHL : null]}>{price}</Text>
        <Text style={s.period}>/ {period}</Text>
      </View>
      <View style={s.featureList}>
        {features.map((f) => (
          <View key={f} style={s.featureRow}>
            <Feather name="check" size={16} color={highlighted ? Colors.brandPrimary : Colors.statusSuccess} />
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}
      </View>
      <View style={[s.planBtn, (highlighted || selected) ? s.planBtnHL : null]}>
        <Text style={[s.planBtnText, (highlighted || selected) ? s.planBtnTextHL : null]}>
          {selected ? 'Выбрано' : highlighted ? 'Начать' : 'Выбрать'}
        </Text>
      </View>
    </Pressable>
  );
}

export function PricingStates() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <StateSection title="PLANS_COMPARISON" maxWidth={1024}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Тарифы</Text>
          <Text style={s.subtitle}>Выберите подходящий план для вашей работы</Text>
        </View>
        <View style={s.plans}>
          {MOCK_PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} {...plan} selected={selectedPlan === plan.id} onSelect={() => setSelectedPlan(plan.id)} />
          ))}
        </View>
        <View style={s.faq}>
          <Text style={s.faqTitle}>Частые вопросы</Text>
          {[
            { q: 'Можно ли сменить тариф?', a: 'Да, вы можете перейти на другой тариф в любой момент.' },
            { q: 'Есть ли пробный период?', a: 'Профессиональный тариф включает 14 дней бесплатного использования.' },
          ].map((item) => (
            <View key={item.q} style={s.faqItem}>
              <Text style={s.faqQ}>{item.q}</Text>
              <Text style={s.faqA}>{item.a}</Text>
            </View>
          ))}
        </View>
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing['2xl'] },
  header: { alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 24, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  plans: { gap: Spacing.md },
  planCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, position: 'relative',
  },
  planHighlighted: { borderColor: Colors.brandPrimary, borderWidth: 2 },
  popularBadge: {
    position: 'absolute', top: -12, right: Spacing.lg,
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  popularText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  planName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  planNameHL: { color: Colors.brandPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  price: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  priceHL: { color: Colors.brandPrimary },
  period: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  featureList: { gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureCheckWrap: { width: 20, alignItems: 'center' },
  featureText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  planBtn: {
    height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs,
  },
  planBtnHL: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  planBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  planBtnTextHL: { color: Colors.white },
  planSelected: { borderColor: Colors.brandPrimary, borderWidth: 2 },
  faq: { gap: Spacing.md },
  faqTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  faqItem: { gap: Spacing.xs, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary },
  faqQ: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  faqA: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, lineHeight: 20 },
});
