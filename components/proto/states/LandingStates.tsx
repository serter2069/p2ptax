import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../../../constants/Colors';
import { StateSection } from '../StateSection';

// =====================================================================
// HELPERS
// =====================================================================

function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// =====================================================================
// HERO — professional, direct USP
// =====================================================================

function HeroSection() {
  const { isDesktop } = useLayout();

  return (
    <View className="bg-white px-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <View className="w-full self-center" style={{ maxWidth: 720 }}>
        {/* Headline */}
        <Text
          className="font-bold text-textPrimary"
          style={{
            fontSize: isDesktop ? Typography.fontSize.jumbo : Typography.fontSize['3xl'],
            lineHeight: isDesktop ? 56 : 38,
            marginBottom: Spacing.md,
          }}
        >
          Не общие юристы,{'\n'}а специалисты по вашей ФНС
        </Text>

        {/* Subtitle */}
        <Text
          className="text-textSecondary"
          style={{
            fontSize: Typography.fontSize.base,
            lineHeight: 24,
            maxWidth: 520,
            marginBottom: Spacing['3xl'],
          }}
        >
          Консультанты, которые знают конкретную инспекцию изнутри: её процессы, сотрудников и практику. Подберём специалиста под вашу ФНС.
        </Text>

        {/* Two CTA buttons */}
        <View
          className={`gap-3 ${isDesktop ? 'flex-row' : ''}`}
          style={{ maxWidth: 420 }}
        >
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
            style={{ height: 52, paddingHorizontal: 24 }}
          >
            <Feather name="send" size={18} color={Colors.white} />
            <Text className="font-semibold text-white" style={{ fontSize: Typography.fontSize.base }}>
              Оставить заявку
            </Text>
          </Pressable>

          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl border"
            style={{
              height: 52,
              paddingHorizontal: 24,
              borderColor: Colors.border,
              backgroundColor: Colors.white,
            }}
          >
            <Feather name="search" size={18} color={Colors.brandPrimary} />
            <Text className="font-semibold" style={{ fontSize: Typography.fontSize.base, color: Colors.brandPrimary }}>
              Найти специалиста
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// HOW IT WORKS — 3 steps with Feather icons
// =====================================================================

function HowItWorksSection() {
  const { isDesktop } = useLayout();

  const steps: { icon: 'map-pin' | 'file-text' | 'message-circle'; title: string; desc: string }[] = [
    { icon: 'map-pin', title: 'Укажите ФНС', desc: 'Выберите город и налоговую инспекцию' },
    { icon: 'file-text', title: 'Опишите задачу', desc: 'Тип проверки или вопрос по налогам' },
    { icon: 'message-circle', title: 'Получите отклик', desc: 'Специалист свяжется в течение дня' },
  ];

  return (
    <View className="px-5 py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="w-full self-center" style={{ maxWidth: 720 }}>
        <Text
          className="mb-1 font-bold uppercase"
          style={{ fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, letterSpacing: 1.2 }}
        >
          Как это работает
        </Text>
        <Text
          className="mb-6 font-bold text-textPrimary"
          style={{ fontSize: Typography.fontSize['2xl'] }}
        >
          Три шага к решению
        </Text>

        <View className={`w-full gap-4 ${isDesktop ? 'flex-row' : ''}`}>
          {steps.map((step, i) => (
            <View
              key={step.title}
              className="flex-1 gap-3 rounded-2xl bg-white p-6"
              style={Shadows.sm}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="items-center justify-center rounded-full bg-brandPrimary"
                  style={{ width: 28, height: 28 }}
                >
                  <Text className="font-bold text-white" style={{ fontSize: Typography.fontSize.sm }}>
                    {i + 1}
                  </Text>
                </View>
                <Feather name={step.icon} size={20} color={Colors.brandPrimary} />
              </View>

              <Text
                className="font-semibold text-textPrimary"
                style={{ fontSize: Typography.fontSize.md }}
              >
                {step.title}
              </Text>
              <Text
                className="text-textSecondary"
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
// SERVICES — the 3 correct services
// =====================================================================

function ServicesSection() {
  const { isDesktop } = useLayout();

  const services: { icon: 'clipboard' | 'truck' | 'eye'; title: string; desc: string }[] = [
    {
      icon: 'clipboard',
      title: 'Камеральная проверка',
      desc: 'Сопровождение при камеральной проверке деклараций. Подготовка пояснений и документов для инспекции.',
    },
    {
      icon: 'truck',
      title: 'Выездная проверка',
      desc: 'Защита интересов при выездной налоговой проверке. Контроль действий инспекторов, подготовка возражений.',
    },
    {
      icon: 'eye',
      title: 'Отдел оперативного контроля',
      desc: 'Представительство при взаимодействии с отделом оперативного контроля ФНС. Минимизация рисков.',
    },
  ];

  return (
    <View className="bg-white px-5 py-10">
      <View className="w-full self-center" style={{ maxWidth: 720 }}>
        <Text
          className="mb-1 font-bold uppercase"
          style={{ fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, letterSpacing: 1.2 }}
        >
          Услуги
        </Text>
        <Text
          className="mb-6 font-bold text-textPrimary"
          style={{ fontSize: Typography.fontSize['2xl'] }}
        >
          Наши направления
        </Text>

        <View className={`w-full gap-4 ${isDesktop ? 'flex-row' : ''}`}>
          {services.map((svc) => (
            <View
              key={svc.title}
              className="flex-1 gap-3 rounded-2xl p-5"
              style={{ backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderLight }}
            >
              <View
                className="items-center justify-center rounded-lg"
                style={{ width: 40, height: 40, backgroundColor: Colors.brandPrimary + '12' }}
              >
                <Feather name={svc.icon} size={20} color={Colors.brandPrimary} />
              </View>
              <Text
                className="font-semibold text-textPrimary"
                style={{ fontSize: Typography.fontSize.md }}
              >
                {svc.title}
              </Text>
              <Text
                className="text-textSecondary"
                style={{ fontSize: Typography.fontSize.sm, lineHeight: 20 }}
              >
                {svc.desc}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SPECIALISTS — mini cards as social proof
// =====================================================================

function SpecialistsSection() {
  const { isDesktop } = useLayout();

  const specialists = [
    { name: 'Алексей К.', city: 'Москва', fns: 'ИФНС №28', rating: 4.9, reviews: 34 },
    { name: 'Елена М.', city: 'Санкт-Петербург', fns: 'ИФНС №15', rating: 4.8, reviews: 21 },
    { name: 'Дмитрий В.', city: 'Новосибирск', fns: 'ИФНС №3', rating: 4.7, reviews: 18 },
  ];

  return (
    <View className="px-5 py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="w-full self-center" style={{ maxWidth: 720 }}>
        <Text
          className="mb-1 font-bold uppercase"
          style={{ fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, letterSpacing: 1.2 }}
        >
          Специалисты
        </Text>
        <Text
          className="mb-6 font-bold text-textPrimary"
          style={{ fontSize: Typography.fontSize['2xl'] }}
        >
          Работают на платформе
        </Text>

        <View className={`w-full gap-4 ${isDesktop ? 'flex-row' : ''}`}>
          {specialists.map((spec) => (
            <View
              key={spec.name}
              className="flex-1 gap-2 rounded-2xl bg-white p-5"
              style={Shadows.sm}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="items-center justify-center rounded-full"
                  style={{ width: 40, height: 40, backgroundColor: Colors.bgSecondary }}
                >
                  <Feather name="user" size={18} color={Colors.brandPrimary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-textPrimary" style={{ fontSize: Typography.fontSize.base }}>
                    {spec.name}
                  </Text>
                  <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.xs }}>
                    {spec.city}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <Feather name="map-pin" size={13} color={Colors.textMuted} />
                <Text className="text-textSecondary" style={{ fontSize: Typography.fontSize.sm }}>
                  {spec.fns}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Feather name="star" size={13} color="#D97706" />
                <Text className="font-medium text-textPrimary" style={{ fontSize: Typography.fontSize.sm }}>
                  {spec.rating}
                </Text>
                <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.xs }}>
                  ({spec.reviews} отзывов)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// STATS — compact row
// =====================================================================

function StatsSection() {
  const { isDesktop } = useLayout();

  const stats = [
    { value: '230+', label: 'специалистов', icon: 'users' as const },
    { value: '47', label: 'городов', icon: 'map-pin' as const },
    { value: '1 200+', label: 'обращений', icon: 'file-text' as const },
    { value: '4.8', label: 'средний рейтинг', icon: 'star' as const },
  ];

  return (
    <View className="bg-white px-5 py-10">
      <View
        className={`w-full self-center ${isDesktop ? 'flex-row justify-around' : 'flex-row flex-wrap justify-center gap-6'}`}
        style={{ maxWidth: 720 }}
      >
        {stats.map((stat) => (
          <View key={stat.label} className="items-center gap-1" style={{ minWidth: 80 }}>
            <Feather name={stat.icon} size={20} color={Colors.textMuted} />
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
// SPECIALIST LINK — small secondary link
// =====================================================================

function SpecialistLinkSection() {
  return (
    <View className="items-center bg-white px-5 pb-10">
      <View className="flex-row items-center gap-2">
        <Feather name="briefcase" size={14} color={Colors.textMuted} />
        <Text className="text-textMuted" style={{ fontSize: Typography.fontSize.sm }}>
          Вы налоговый специалист?
        </Text>
        <Pressable>
          <Text className="font-medium" style={{ fontSize: Typography.fontSize.sm, color: Colors.brandPrimary }}>
            Я специалист
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// FOOTER — minimal
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
            P2PTax
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
      <ServicesSection />
      <SpecialistsSection />
      <StatsSection />
      <SpecialistLinkSection />
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
