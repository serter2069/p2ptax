import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants/Colors';
import { StateSection } from '../StateSection';

// =====================================================================
// HELPERS
// =====================================================================

function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// =====================================================================
// DECORATIVE ELEMENTS
// =====================================================================

function FloatingCircle({ color, size, top, left, right }: {
  color: string; size: number; top?: number; left?: number; right?: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.15,
        top,
        left,
        right,
      }}
    />
  );
}

// =====================================================================
// HERO — light, welcoming, two CTAs
// =====================================================================

function HeroSection() {
  const { isDesktop } = useLayout();

  return (
    <View className="relative overflow-hidden bg-white px-5 pb-12 pt-10" style={{ paddingTop: 40, paddingBottom: 48 }}>
      {/* Decorative background shapes */}
      <FloatingCircle color="#0284C7" size={200} top={-60} right={-40} />
      <FloatingCircle color="#22C55E" size={120} top={80} left={-30} />
      <FloatingCircle color="#F59E0B" size={80} top={20} right={60} />

      <View className="z-10 w-full items-center self-center" style={{ maxWidth: 720 }}>
        {/* Badge */}
        <View
          className="mb-4 flex-row items-center gap-2 rounded-full px-4 py-1.5"
          style={{ backgroundColor: '#E0F2FE' }}
        >
          <Text style={{ fontSize: 18 }}>&#x1F50D;</Text>
          <Text
            className="font-semibold"
            style={{ fontSize: Typography.fontSize.sm, color: Colors.brandPrimary }}
          >
            Налоговые специалисты рядом
          </Text>
        </View>

        {/* Headline */}
        <Text
          className="text-center font-bold text-textPrimary"
          style={{
            fontSize: isDesktop ? Typography.fontSize.jumbo : Typography.fontSize['3xl'],
            lineHeight: isDesktop ? 56 : 38,
            marginBottom: Spacing.md,
          }}
        >
          Найдите специалиста{'\n'}в вашей налоговой
        </Text>

        {/* Subtitle */}
        <Text
          className="text-center text-textSecondary"
          style={{
            fontSize: Typography.fontSize.base,
            lineHeight: 24,
            maxWidth: 480,
            marginBottom: Spacing['2xl'],
          }}
        >
          Консультанты, которые знают вашу инспекцию изнутри. Бесплатно подберем лучшего.
        </Text>

        {/* Two CTA buttons */}
        <View
          className={`w-full items-center gap-3 ${isDesktop ? 'flex-row justify-center' : ''}`}
          style={{ maxWidth: 420 }}
        >
          <Pressable
            className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
            style={{ height: 52, flex: isDesktop ? 1 : undefined, maxWidth: isDesktop ? 200 : undefined }}
          >
            <Feather name="search" size={18} color={Colors.white} />
            <Text className="font-semibold text-white" style={{ fontSize: Typography.fontSize.base }}>
              Найти специалиста
            </Text>
          </Pressable>

          <Pressable
            className="w-full flex-row items-center justify-center gap-2 rounded-xl border"
            style={{
              height: 52,
              borderColor: Colors.brandPrimary,
              backgroundColor: Colors.white,
              flex: isDesktop ? 1 : undefined,
              maxWidth: isDesktop ? 200 : undefined,
            }}
          >
            <Feather name="briefcase" size={18} color={Colors.brandPrimary} />
            <Text className="font-semibold" style={{ fontSize: Typography.fontSize.base, color: Colors.brandPrimary }}>
              Я специалист
            </Text>
          </Pressable>
        </View>

        {/* Quick stats */}
        <View className="mt-6 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Text style={{ fontSize: 14 }}>&#x2B50;</Text>
            <Text className="font-semibold text-textPrimary" style={{ fontSize: Typography.fontSize.sm }}>
              230+
            </Text>
            <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.sm }}>
              специалистов
            </Text>
          </View>
          <View style={{ width: 1, height: 16, backgroundColor: Colors.border }} />
          <View className="flex-row items-center gap-1">
            <Text style={{ fontSize: 14 }}>&#x1F4CD;</Text>
            <Text className="font-semibold text-textPrimary" style={{ fontSize: Typography.fontSize.sm }}>
              47
            </Text>
            <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.sm }}>
              городов
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// HOW IT WORKS — 3 steps with colorful icon circles
// =====================================================================

function HowItWorksSection() {
  const { isDesktop } = useLayout();

  const steps: { emoji: string; bg: string; title: string; desc: string }[] = [
    { emoji: '\uD83D\uDCCD', bg: '#DBEAFE', title: 'Укажите ФНС', desc: 'Выберите город и налоговую инспекцию' },
    { emoji: '\uD83D\uDCDD', bg: '#D1FAE5', title: 'Опишите задачу', desc: 'Тип проверки или консультации' },
    { emoji: '\uD83D\uDCAC', bg: '#FEF3C7', title: 'Получите отклик', desc: 'Специалист свяжется в течение дня' },
  ];

  return (
    <View className="bg-white px-5 py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="w-full items-center self-center" style={{ maxWidth: 720 }}>
        <Text
          className="mb-1 text-center font-bold uppercase"
          style={{ fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, letterSpacing: 1.2 }}
        >
          Как это работает
        </Text>
        <Text
          className="mb-6 text-center font-bold text-textPrimary"
          style={{ fontSize: Typography.fontSize['2xl'] }}
        >
          Три простых шага
        </Text>

        <View className={`w-full gap-4 ${isDesktop ? 'flex-row' : ''}`}>
          {steps.map((step, i) => (
            <View
              key={step.title}
              className="flex-1 items-center gap-3 rounded-2xl bg-white p-6"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Step number */}
              <View
                className="items-center justify-center rounded-full bg-brandPrimary"
                style={{ width: 28, height: 28 }}
              >
                <Text className="font-bold text-white" style={{ fontSize: Typography.fontSize.sm }}>
                  {i + 1}
                </Text>
              </View>

              {/* Icon circle */}
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 56, height: 56, backgroundColor: step.bg }}
              >
                <Text style={{ fontSize: 26 }}>{step.emoji}</Text>
              </View>

              <Text
                className="text-center font-semibold text-textPrimary"
                style={{ fontSize: Typography.fontSize.md }}
              >
                {step.title}
              </Text>
              <Text
                className="text-center text-textSecondary"
                style={{ fontSize: Typography.fontSize.sm, lineHeight: 20 }}
              >
                {step.desc}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// POPULAR SERVICES — colored chips
// =====================================================================

function PopularServicesSection() {
  const services = [
    { label: 'Камеральная проверка', emoji: '\uD83D\uDD0D', bg: '#E0F2FE' },
    { label: 'Выездная проверка', emoji: '\uD83D\uDEE1\uFE0F', bg: '#D1FAE5' },
    { label: 'Отдел оперативного контроля', emoji: '\uD83D\uDC41\uFE0F', bg: '#FEF3C7' },
    { label: 'Не знаю', emoji: '\u2753', bg: '#EDE9FE' },
  ];

  return (
    <View className="bg-white px-5 py-10">
      <View className="w-full items-center self-center" style={{ maxWidth: 720 }}>
        <Text
          className="mb-1 text-center font-bold uppercase"
          style={{ fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, letterSpacing: 1.2 }}
        >
          Услуги
        </Text>
        <Text
          className="mb-6 text-center font-bold text-textPrimary"
          style={{ fontSize: Typography.fontSize['2xl'] }}
        >
          Популярные услуги
        </Text>

        <View className="flex-row flex-wrap justify-center gap-3">
          {services.map((svc) => (
            <Pressable
              key={svc.label}
              className="flex-row items-center gap-2 rounded-full px-4 py-2.5"
              style={{ backgroundColor: svc.bg }}
            >
              <Text style={{ fontSize: 16 }}>{svc.emoji}</Text>
              <Text
                className="font-medium text-textPrimary"
                style={{ fontSize: Typography.fontSize.sm }}
              >
                {svc.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// STATS — compact row with accent icons
// =====================================================================

function StatsSection() {
  const { isDesktop } = useLayout();

  const stats = [
    { value: '230+', label: 'специалистов', icon: 'users' as const, color: '#0284C7' },
    { value: '47', label: 'городов', icon: 'map-pin' as const, color: '#22C55E' },
    { value: '1 200+', label: 'заявок', icon: 'file-text' as const, color: '#F59E0B' },
    { value: '4.8', label: 'рейтинг', icon: 'star' as const, color: '#A855F7' },
  ];

  return (
    <View className="px-5 py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View
        className={`w-full self-center ${isDesktop ? 'flex-row justify-around' : 'flex-row flex-wrap justify-center gap-6'}`}
        style={{ maxWidth: 720 }}
      >
        {stats.map((stat) => (
          <View key={stat.label} className="items-center gap-1" style={{ minWidth: 80 }}>
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 44, height: 44, backgroundColor: stat.color + '15' }}
            >
              <Feather name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text
              className="font-bold text-textPrimary"
              style={{ fontSize: Typography.fontSize['2xl'] }}
            >
              {stat.value}
            </Text>
            <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.xs }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// CTA BOTTOM — cheerful call-to-action
// =====================================================================

function CtaBottomSection() {
  return (
    <View className="items-center bg-white px-5 py-12">
      <View
        className="relative w-full items-center overflow-hidden rounded-2xl px-6 py-10"
        style={{ maxWidth: 720, backgroundColor: '#0284C7' }}
      >
        {/* Decorative circles */}
        <FloatingCircle color="#FFFFFF" size={160} top={-40} right={-30} />
        <FloatingCircle color="#FFFFFF" size={100} top={60} left={-20} />

        <Text style={{ fontSize: 36, marginBottom: 8 }}>&#x1F680;</Text>
        <Text
          className="z-10 text-center font-bold text-white"
          style={{ fontSize: Typography.fontSize['2xl'], marginBottom: Spacing.sm }}
        >
          Готовы начать?
        </Text>
        <Text
          className="z-10 mb-6 text-center"
          style={{ fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.8)', maxWidth: 400 }}
        >
          Зарегистрируйтесь бесплатно и найдите специалиста уже сегодня
        </Text>

        <View className="z-10 flex-row gap-3">
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl bg-white px-6"
            style={{ height: 48 }}
          >
            <Text className="font-semibold" style={{ fontSize: Typography.fontSize.base, color: Colors.brandPrimary }}>
              Начать поиск
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FOOTER — minimal, light
// =====================================================================

function FooterSection() {
  return (
    <View className="items-center border-t px-5 py-8" style={{ borderTopColor: Colors.borderLight, backgroundColor: '#FAFAFA' }}>
      <View
        className="w-full flex-row items-center justify-between"
        style={{ maxWidth: 720 }}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="items-center justify-center rounded-lg bg-brandPrimary"
            style={{ width: 24, height: 24 }}
          >
            <Feather name="shield" size={13} color={Colors.white} />
          </View>
          <Text className="font-bold text-textPrimary" style={{ fontSize: Typography.fontSize.sm }}>
            Налоговик
          </Text>
        </View>
        <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.xs }}>
          2026. Все права защищены.
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// FULL LANDING PAGE
// =====================================================================

function LandingPage() {
  return (
    <View style={{ backgroundColor: Colors.white }}>
      <HeroSection />
      <HowItWorksSection />
      <PopularServicesSection />
      <StatsSection />
      <CtaBottomSection />
      <FooterSection />
    </View>
  );
}

// =====================================================================
// EXPORTED — single state
// =====================================================================

export function LandingStates() {
  return (
    <StateSection title="LANDING" pageId="landing">
      <LandingPage />
    </StateSection>
  );
}
