import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../constants/Colors';
import { MOCK_CITIES, MOCK_FNS, MOCK_SERVICES } from '../constants/protoMockData';

// =====================================================================
// HELPERS
// =====================================================================

function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// =====================================================================
// Cascading City / FNS / Service picker (compact for landing form)
// =====================================================================

function LandingLocationPicker({
  city, fns, service, onCityChange, onFnsChange, onServiceChange,
}: {
  city: string; fns: string; service: string;
  onCityChange: (v: string) => void; onFnsChange: (v: string) => void; onServiceChange: (v: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);
  const fnsOptions = city ? (MOCK_FNS[city] || []) : [];

  const summary = city
    ? [city, fns, service].filter(Boolean).join(' / ')
    : '';

  return (
    <View className="gap-1">
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`min-h-[44px] flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={14} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${summary ? 'text-textPrimary' : 'text-textMuted'}`} numberOfLines={2}>
            {summary || 'Город, ФНС и услуга'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>

      {openLevel && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          {/* Step tabs */}
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => setOpenLevel('city')}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>
                {city || 'Город'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : fns ? 'text-textPrimary' : 'text-textMuted'}`}>
                {fns ? fns.replace(/^ФНС\s*/, '').substring(0, 18) : 'ФНС'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2 ${openLevel === 'service' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => fns && setOpenLevel('service')}
              disabled={!fns}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'service' ? 'text-brandPrimary' : service ? 'text-textPrimary' : 'text-textMuted'}`}>
                {service || 'Услуга'}
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
            {openLevel === 'city' && MOCK_CITIES.map((c) => (
              <Pressable
                key={c}
                className="border-b border-bgSecondary px-3 py-2.5"
                onPress={() => { onCityChange(c); onFnsChange(''); onServiceChange(''); setOpenLevel('fns'); }}
              >
                <Text className={`text-sm ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
              </Pressable>
            ))}
            {openLevel === 'fns' && fnsOptions.map((f) => (
              <Pressable
                key={f}
                className="border-b border-bgSecondary px-3 py-2.5"
                onPress={() => { onFnsChange(f); setOpenLevel('service'); }}
              >
                <Text className={`text-sm ${fns === f ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f}</Text>
              </Pressable>
            ))}
            {openLevel === 'service' && MOCK_SERVICES.map((s) => (
              <Pressable
                key={s}
                className="border-b border-bgSecondary px-3 py-2.5"
                onPress={() => { onServiceChange(s); setOpenLevel(null); }}
              >
                <Text className={`text-sm ${service === s ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// =====================================================================
// HERO — USP headline + inline request form
// =====================================================================

function HeroSection() {
  const { isDesktop } = useLayout();
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View className="bg-white px-5" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <View className="w-full self-center" style={{ maxWidth: 800 }}>
        <View className={isDesktop ? 'flex-row gap-10' : 'gap-8'}>
          {/* Left: headline */}
          <View className="flex-1 justify-center">
            <Text
              className="font-bold text-textPrimary"
              style={{ fontSize: isDesktop ? 36 : 28, lineHeight: isDesktop ? 44 : 36, marginBottom: 12 }}
            >
              Специалисты, которые знают{'\n'}вашу ФНС изнутри
            </Text>
            <Text className="text-textSecondary" style={{ fontSize: 16, lineHeight: 24, marginBottom: 20, maxWidth: 400 }}>
              Не общие юристы, а конкретные консультанты с опытом работы в конкретных налоговых инспекциях.
              Каждый специалист знает процессы, сотрудников и практику своей ФНС.
            </Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-row items-center gap-2">
                <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
                <Text className="text-sm text-textSecondary">Знают вашу инспекцию лично</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
                <Text className="text-sm text-textSecondary">Ответ в течение часа</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
                <Text className="text-sm text-textSecondary">Бесплатная первая консультация</Text>
              </View>
            </View>
          </View>

          {/* Right: inline request form */}
          <View className="rounded-2xl border border-borderLight bg-bgSecondary p-5" style={{ width: isDesktop ? 340 : '100%', ...Shadows.md }}>
            <Text className="mb-1 text-lg font-bold text-textPrimary">Разместить запрос</Text>
            <Text className="mb-4 text-sm text-textSecondary">
              Опишите вашу ситуацию — специалисты по вашей ФНС свяжутся с вами в чате
            </Text>

            {/* Unified City / FNS / Service */}
            <View className="mb-3">
              <LandingLocationPicker
                city={city} fns={fns} service={service}
                onCityChange={setCity} onFnsChange={setFns} onServiceChange={setService}
              />
            </View>

            {/* Description */}
            <View className="mb-4 gap-1">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Кратко опишите вашу ситуацию..."
                placeholderTextColor={Colors.textMuted}
                multiline
                className="min-h-[72px] rounded-xl border border-borderLight bg-white p-3 text-sm text-textPrimary"
                style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
              />
            </View>

            <Pressable className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary">
              <Feather name="send" size={16} color={Colors.white} />
              <Text className="text-base font-semibold text-white">Отправить заявку</Text>
            </Pressable>

            <Text className="mt-2 text-center text-xs text-textMuted">
              Бесплатно. Специалисты напишут вам сами.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SPECIALISTS CAROUSEL — 12 cards, horizontal scroll
// =====================================================================

const SPECIALISTS = [
  { name: 'Алексей Петров', city: 'Москва', fns: 'ФНС №46', service: 'Выездная проверка', rating: 4.9, reviews: 34, since: 2020, initials: 'АП', color: '#0284C7' },
  { name: 'Елена Морозова', city: 'Москва', fns: 'ФНС №15', service: 'Камеральная проверка', rating: 4.8, reviews: 28, since: 2021, initials: 'ЕМ', color: '#059669' },
  { name: 'Дмитрий Волков', city: 'СПб', fns: 'ФНС №1', service: 'Отдел оперативного контроля', rating: 4.9, reviews: 41, since: 2019, initials: 'ДВ', color: '#7C3AED' },
  { name: 'Ольга Смирнова', city: 'Новосибирск', fns: 'ФНС №12', service: 'Камеральная проверка', rating: 4.7, reviews: 19, since: 2022, initials: 'ОС', color: '#DC2626' },
  { name: 'Игорь Козлов', city: 'Казань', fns: 'ФНС №3', service: 'Выездная проверка', rating: 4.8, reviews: 23, since: 2021, initials: 'ИК', color: '#D97706' },
  { name: 'Анна Фёдорова', city: 'Екатеринбург', fns: 'ФНС №8', service: 'Камеральная проверка', rating: 4.6, reviews: 15, since: 2023, initials: 'АФ', color: '#0891B2' },
  { name: 'Сергей Новиков', city: 'Ростов-на-Дону', fns: 'ФНС №5', service: 'Выездная проверка', rating: 4.9, reviews: 37, since: 2020, initials: 'СН', color: '#4F46E5' },
  { name: 'Мария Кузнецова', city: 'Москва', fns: 'ФНС №7', service: 'Выездная проверка', rating: 4.7, reviews: 22, since: 2022, initials: 'МК', color: '#BE185D' },
  { name: 'Павел Тихонов', city: 'Самара', fns: 'ФНС №11', service: 'Камеральная проверка', rating: 4.8, reviews: 31, since: 2020, initials: 'ПТ', color: '#0D9488' },
  { name: 'Наталья Соколова', city: 'Москва', fns: 'ФНС №33', service: 'Отдел оперативного контроля', rating: 4.6, reviews: 17, since: 2023, initials: 'НС', color: '#9333EA' },
  { name: 'Виктор Лебедев', city: 'Краснодар', fns: 'ФНС №2', service: 'Выездная проверка', rating: 4.9, reviews: 44, since: 2019, initials: 'ВЛ', color: '#B91C1C' },
  { name: 'Татьяна Миронова', city: 'СПб', fns: 'ФНС №25', service: 'Камеральная проверка', rating: 4.7, reviews: 26, since: 2021, initials: 'ТМ', color: '#1D4ED8' },
];

function SpecialistsCarousel() {
  return (
    <View className="py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="mb-6 w-full self-center px-5" style={{ maxWidth: 800 }}>
        <Text className="mb-1 text-xs font-bold uppercase" style={{ color: Colors.brandPrimary, letterSpacing: 1.2 }}>
          Наши специалисты
        </Text>
        <Text className="text-2xl font-bold text-textPrimary">
          Работают на платформе
        </Text>
        <Text className="mt-1 text-sm text-textSecondary">
          {SPECIALISTS.length} специалистов из {new Set(SPECIALISTS.map(s => s.city)).size} городов
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        decelerationRate="fast"
        snapToInterval={232}
      >
        {SPECIALISTS.map((spec) => (
          <View
            key={spec.name}
            className="gap-3 rounded-2xl bg-white p-4"
            style={{ width: 220, ...Shadows.sm }}
          >
            {/* Avatar */}
            <View className="flex-row items-center gap-3">
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 48, height: 48, backgroundColor: spec.color + '15' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: spec.color }}>{spec.initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-textPrimary">{spec.name}</Text>
                <Text className="text-xs text-textMuted">{spec.city}</Text>
              </View>
            </View>

            {/* FNS */}
            <View className="flex-row items-center gap-1.5">
              <Feather name="home" size={12} color={Colors.brandPrimary} />
              <Text className="text-xs font-medium text-brandPrimary">{spec.fns}</Text>
            </View>

            {/* Service chip */}
            <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: Colors.brandPrimary + '12' }}>
              <Text className="text-xs font-medium" style={{ color: Colors.brandPrimary }}>{spec.service}</Text>
            </View>

            {/* Rating + since */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Feather name="star" size={12} color="#D97706" />
                <Text className="text-xs font-semibold text-textPrimary">{spec.rating}</Text>
                <Text className="text-xs text-textMuted">({spec.reviews})</Text>
              </View>
              <Text className="text-xs text-textMuted">c {spec.since} г.</Text>
            </View>

            <Pressable className="h-9 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary">
              <Text className="text-xs font-semibold text-brandPrimary">Подробнее</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// =====================================================================
// SERVICES — the 3 correct services
// =====================================================================

function ServicesSection() {
  const { isDesktop } = useLayout();

  const services: { icon: 'clipboard' | 'truck' | 'eye'; title: string; desc: string }[] = [
    { icon: 'truck', title: 'Выездная проверка', desc: 'Полное сопровождение при выездной налоговой проверке. Подготовка документов, контроль действий инспекторов, подготовка возражений на акт проверки.' },
    { icon: 'clipboard', title: 'Камеральная проверка', desc: 'Подготовка пояснений на требования ФНС, представление интересов при камеральной проверке деклараций, оспаривание доначислений.' },
    { icon: 'eye', title: 'Отдел оперативного контроля', desc: 'Представительство при взаимодействии с отделом оперативного контроля. Консультирование по оперативным мероприятиям, минимизация рисков.' },
  ];

  return (
    <View className="bg-white px-5 py-10">
      <View className="w-full self-center" style={{ maxWidth: 800 }}>
        <Text className="mb-1 text-xs font-bold uppercase" style={{ color: Colors.brandPrimary, letterSpacing: 1.2 }}>
          Направления работы
        </Text>
        <Text className="mb-6 text-2xl font-bold text-textPrimary">Чем мы помогаем</Text>

        <View className={`w-full gap-4 ${isDesktop ? 'flex-row' : ''}`}>
          {services.map((svc) => (
            <View key={svc.title} className="flex-1 gap-3 rounded-2xl border border-borderLight p-5" style={{ backgroundColor: Colors.bgSecondary }}>
              <View className="h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: Colors.brandPrimary + '12' }}>
                <Feather name={svc.icon} size={20} color={Colors.brandPrimary} />
              </View>
              <Text className="text-base font-semibold text-textPrimary">{svc.title}</Text>
              <Text className="text-sm leading-5 text-textSecondary">{svc.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// HOW IT WORKS
// =====================================================================

function HowItWorksSection() {
  const { isDesktop } = useLayout();

  const steps = [
    { icon: 'map-pin' as const, title: 'Укажите ФНС', desc: 'Выберите город и вашу налоговую инспекцию' },
    { icon: 'file-text' as const, title: 'Опишите ситуацию', desc: 'Укажите тип проверки и детали задачи' },
    { icon: 'message-circle' as const, title: 'Получите помощь', desc: 'Специалист вашей ФНС свяжется в чате' },
  ];

  return (
    <View className="px-5 py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="w-full self-center" style={{ maxWidth: 800 }}>
        <Text className="mb-1 text-xs font-bold uppercase" style={{ color: Colors.brandPrimary, letterSpacing: 1.2 }}>
          Как это работает
        </Text>
        <Text className="mb-6 text-2xl font-bold text-textPrimary">Три шага к решению</Text>

        <View className={`w-full gap-4 ${isDesktop ? 'flex-row' : ''}`}>
          {steps.map((step, i) => (
            <View key={step.title} className="flex-1 gap-3 rounded-2xl bg-white p-5" style={Shadows.sm}>
              <View className="flex-row items-center gap-3">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-brandPrimary">
                  <Text className="text-sm font-bold text-white">{i + 1}</Text>
                </View>
                <Feather name={step.icon} size={18} color={Colors.brandPrimary} />
              </View>
              <Text className="text-base font-semibold text-textPrimary">{step.title}</Text>
              <Text className="text-sm leading-5 text-textSecondary">{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// STATS + TRUST
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
      <View className={`w-full self-center ${isDesktop ? 'flex-row justify-around' : 'flex-row flex-wrap justify-center gap-6'}`} style={{ maxWidth: 800 }}>
        {stats.map((stat) => (
          <View key={stat.label} className="items-center gap-1" style={{ minWidth: 80 }}>
            <Feather name={stat.icon} size={18} color={Colors.textMuted} />
            <Text className="text-2xl font-bold text-textPrimary">{stat.value}</Text>
            <Text className="text-xs text-textMuted">{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// BOTTOM CTA
// =====================================================================

function BottomCTA() {
  const router = useRouter();

  return (
    <View className="items-center px-5 py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="w-full items-center gap-4 rounded-2xl bg-white p-8" style={{ maxWidth: 600, ...Shadows.md }}>
        <Feather name="search" size={28} color={Colors.brandPrimary} />
        <Text className="text-center text-xl font-bold text-textPrimary">Найти специалиста по вашей ФНС</Text>
        <Text className="max-w-sm text-center text-sm text-textSecondary">
          Воспользуйтесь каталогом, чтобы найти специалиста с опытом работы в вашей налоговой инспекции
        </Text>
        <Pressable
          className="h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
          style={{ maxWidth: 300 }}
          onPress={() => router.push('/specialists' as any)}
        >
          <Feather name="search" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Открыть каталог</Text>
        </Pressable>
      </View>

      <View className="mt-6 flex-row items-center gap-2">
        <Feather name="briefcase" size={14} color={Colors.textMuted} />
        <Text className="text-sm text-textMuted">Вы налоговый специалист?</Text>
        <Pressable onPress={() => router.push('/(auth)/email')}>
          <Text className="text-sm font-medium text-brandPrimary">Присоединиться</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// FOOTER
// =====================================================================

function FooterSection() {
  return (
    <View className="items-center border-t px-5 py-6" style={{ borderTopColor: Colors.borderLight, backgroundColor: '#FAFAFA' }}>
      <View className="w-full flex-row items-center justify-between" style={{ maxWidth: 800 }}>
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-lg bg-brandPrimary">
            <Feather name="shield" size={13} color={Colors.white} />
          </View>
          <Text className="text-sm font-bold text-textPrimary">P2PTax</Text>
        </View>
        <Text className="text-xs text-textMuted">2026. Все права защищены.</Text>
      </View>
    </View>
  );
}

// =====================================================================
// FULL LANDING PAGE
// =====================================================================

export default function LandingPage() {
  return (
    <ScrollView style={{ backgroundColor: Colors.white }}>
      <HeroSection />
      <SpecialistsCarousel />
      <ServicesSection />
      <HowItWorksSection />
      <StatsSection />
      <BottomCTA />
      <FooterSection />
    </ScrollView>
  );
}
