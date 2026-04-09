import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function Hero() {
  return (
    <View style={s.hero}>
      <View style={s.heroNav}>
        <Text style={s.logoText}>Налоговик</Text>
        <View style={s.navLinks}>
          <Text style={s.navLink}>Специалисты</Text>
          <Text style={s.navLink}>Тарифы</Text>
          <View style={s.loginBtn}><Text style={s.loginBtnText}>Войти</Text></View>
        </View>
      </View>
      <View style={s.heroContent}>
        <Text style={s.heroTitle}>Найдите налогового{'\n'}специалиста</Text>
        <Text style={s.heroSubtitle}>
          Сервис для поиска квалифицированных налоговых консультантов, бухгалтеров и юристов в вашем городе
        </Text>
        <View style={s.heroCta}>
          <View style={s.heroBtn}><Text style={s.heroBtnText}>Найти специалиста</Text></View>
          <View style={s.heroBtnSecondary}><Text style={s.heroBtnSecondaryText}>Я специалист</Text></View>
        </View>
        <View style={s.heroStats}>
          <View style={s.heroStat}><Text style={s.heroStatValue}>189</Text><Text style={s.heroStatLabel}>Специалистов</Text></View>
          <View style={s.heroStat}><Text style={s.heroStatValue}>3 400+</Text><Text style={s.heroStatLabel}>Заявок</Text></View>
          <View style={s.heroStat}><Text style={s.heroStatValue}>4.7</Text><Text style={s.heroStatLabel}>Средняя оценка</Text></View>
        </View>
      </View>
    </View>
  );
}

function Features() {
  const items = [
    { icon: '🔍', title: 'Поиск', desc: 'Найдите специалиста по городу, услуге и бюджету' },
    { icon: '✓', title: 'Верификация', desc: 'Все специалисты проверены через ФНС' },
    { icon: '💬', title: 'Связь', desc: 'Безопасный чат прямо на платформе' },
    { icon: '⭐', title: 'Отзывы', desc: 'Реальные отзывы от клиентов' },
  ];
  return (
    <View style={s.features}>
      <Text style={s.sectionTitle}>Почему Налоговик?</Text>
      <View style={s.featureGrid}>
        {items.map((item) => (
          <View key={item.title} style={s.featureCard}>
            <Text style={s.featureIcon}>{item.icon}</Text>
            <Text style={s.featureTitle}>{item.title}</Text>
            <Text style={s.featureDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HowItWorks() {
  const steps = [
    { num: '1', title: 'Создайте заявку', desc: 'Опишите задачу, укажите город и бюджет' },
    { num: '2', title: 'Получите отклики', desc: 'Специалисты предложат свои услуги' },
    { num: '3', title: 'Выберите лучшего', desc: 'Сравните цены, отзывы и опыт' },
  ];
  return (
    <View style={s.howItWorks}>
      <Text style={s.sectionTitle}>Как это работает</Text>
      <View style={s.stepsRow}>
        {steps.map((step) => (
          <View key={step.num} style={s.step}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{step.num}</Text></View>
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepDesc}>{step.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PricingBlock() {
  return (
    <View style={s.pricingBlock}>
      <Text style={s.sectionTitle}>Начните бесплатно</Text>
      <Text style={s.pricingSubtitle}>Для клиентов — всегда бесплатно. Для специалистов — от 0 ₽/мес.</Text>
      <View style={s.pricingCta}>
        <View style={s.heroBtn}><Text style={s.heroBtnText}>Попробовать бесплатно</Text></View>
      </View>
    </View>
  );
}

export function LandingStates() {
  return (
    <>
      <StateSection title="HERO" maxWidth={800}>
        <Hero />
      </StateSection>
      <StateSection title="FEATURES" maxWidth={800}>
        <Features />
      </StateSection>
      <StateSection title="HOW_IT_WORKS" maxWidth={800}>
        <HowItWorks />
      </StateSection>
      <StateSection title="PRICING_BLOCK" maxWidth={800}>
        <PricingBlock />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: '#0F2447' },
  heroNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  logoText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: '#FFF' },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  navLink: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  loginBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  loginBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: '#FFF' },
  heroContent: { padding: Spacing['2xl'], paddingTop: Spacing['3xl'], paddingBottom: Spacing['4xl'], gap: Spacing.lg },
  heroTitle: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: '#FFF', lineHeight: 36 },
  heroSubtitle: { fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.75)', lineHeight: 24 },
  heroCta: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  heroBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'],
  },
  heroBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  heroBtnSecondary: {
    height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'], borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBtnSecondaryText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: '#FFF' },
  heroStats: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: '#FFF' },
  heroStatLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  features: { padding: Spacing['2xl'], gap: Spacing.lg, backgroundColor: Colors.bgPrimary },
  sectionTitle: { fontSize: 22, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  featureCard: {
    width: '47%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  featureIcon: { fontSize: 28 },
  featureTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  featureDesc: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, lineHeight: 20 },
  howItWorks: { padding: Spacing['2xl'], gap: Spacing.lg, backgroundColor: Colors.bgSecondary },
  stepsRow: { gap: Spacing.lg },
  step: { flexDirection: 'column', alignItems: 'center', gap: Spacing.sm },
  stepNum: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: '#FFF' },
  stepTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  stepDesc: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  pricingBlock: {
    padding: Spacing['2xl'], gap: Spacing.md, backgroundColor: Colors.bgPrimary, alignItems: 'center',
  },
  pricingSubtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
  pricingCta: { marginTop: Spacing.sm },
});
