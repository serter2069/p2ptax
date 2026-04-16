import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { Colors, Shadows } from '../constants/Colors';
import { ifns, specialists, stats } from '../lib/api/endpoints';
import { Header } from '../components/Header';

// Fixed service list per product spec
const SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка', 'Не знаю'];

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
  cities, fnsByCity,
}: {
  city: string; fns: string; service: string;
  onCityChange: (v: string) => void; onFnsChange: (v: string) => void; onServiceChange: (v: string) => void;
  cities: string[]; fnsByCity: Record<string, string[]>;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);
  const fnsOptions = city ? (fnsByCity[city] || []) : [];

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
            {openLevel === 'city' && cities.map((c) => (
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
            {openLevel === 'service' && SERVICES.map((s) => (
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
  const [cities, setCities] = useState<string[]>([]);
  const [fnsByCity, setFnsByCity] = useState<Record<string, string[]>>({});

  useEffect(() => {
    ifns.getCities()
      .then((res) => {
        const data = (res as any).data ?? res;
        setCities(Array.isArray(data) ? data.map((c: any) => c.name ?? c) : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!city || fnsByCity[city]) return;
    ifns.getIfns({ city })
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((f: any) => f.name ?? f) : [];
        setFnsByCity((prev) => ({ ...prev, [city]: list }));
      })
      .catch(() => {});
  }, [city]);

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
                cities={cities} fnsByCity={fnsByCity}
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

            <Pressable className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary" onPress={() => router.push('/(auth)/role' as any)}>
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
// SPECIALISTS CAROUSEL — real data from API
// =====================================================================

interface FeaturedSpecialist {
  nick: string;
  displayName: string;
  avatarUrl: string | null;
  cities: string[];
  services: string[];
  badges: string[];
  experience: number | null;
  headline: string | null;
  createdAt: string;
}

// Deterministic color from nick string
function nickColor(nick: string): string {
  const palette = ['#0284C7', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0891B2', '#4F46E5', '#BE185D', '#0D9488', '#9333EA', '#B91C1C', '#1D4ED8'];
  let hash = 0;
  for (let i = 0; i < nick.length; i++) hash = nick.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(displayName: string): string {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function SpecialistCardSkeleton() {
  return (
    <View className="gap-3 rounded-2xl bg-white p-4" style={{ width: 220, ...Shadows.sm }}>
      <View className="flex-row items-center gap-3">
        <View className="rounded-full bg-bgSecondary" style={{ width: 48, height: 48 }} />
        <View className="flex-1 gap-1.5">
          <View className="h-3 rounded bg-bgSecondary" style={{ width: '80%' }} />
          <View className="h-2.5 rounded bg-bgSecondary" style={{ width: '50%' }} />
        </View>
      </View>
      <View className="h-2.5 rounded bg-bgSecondary" style={{ width: '60%' }} />
      <View className="h-6 rounded-full bg-bgSecondary" style={{ width: '70%' }} />
      <View className="h-2.5 rounded bg-bgSecondary" style={{ width: '40%' }} />
      <View className="h-9 rounded-lg bg-bgSecondary" />
    </View>
  );
}

function SpecialistsCarousel() {
  const router = useRouter();
  const [featured, setFeatured] = useState<FeaturedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    specialists.getFeatured()
      .then((res) => {
        const data = (res as any).data ?? res;
        setFeatured(Array.isArray(data) ? data : []);
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  // Hide section entirely when no data and not loading
  if (!loading && featured.length === 0) return null;

  return (
    <View className="py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="mb-6 w-full self-center px-5" style={{ maxWidth: 800 }}>
        <Text className="mb-1 text-xs font-bold uppercase" style={{ color: Colors.brandPrimary, letterSpacing: 1.2 }}>
          Наши специалисты
        </Text>
        <Text className="text-2xl font-bold text-textPrimary">
          Работают на платформе
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        decelerationRate="fast"
        snapToInterval={232}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SpecialistCardSkeleton key={i} />)
          : featured.map((spec) => {
            const color = nickColor(spec.nick);
            const inits = initials(spec.displayName);
            const city = spec.cities?.[0] ?? '';
            const service = spec.services?.[0] ?? '';
            return (
              <View
                key={spec.nick}
                className="gap-3 rounded-2xl bg-white p-4"
                style={{ width: 220, ...Shadows.sm }}
              >
                {/* Avatar */}
                <View className="flex-row items-center gap-3">
                  <View
                    className="items-center justify-center rounded-full"
                    style={{ width: 48, height: 48, backgroundColor: color + '15' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color }}>{inits}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-textPrimary" numberOfLines={1}>{spec.displayName}</Text>
                    {city ? <Text className="text-xs text-textMuted">{city}</Text> : null}
                  </View>
                </View>

                {/* Headline or service chip */}
                {spec.headline ? (
                  <Text className="text-xs text-textSecondary" numberOfLines={2}>{spec.headline}</Text>
                ) : service ? (
                  <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: Colors.brandPrimary + '12' }}>
                    <Text className="text-xs font-medium" style={{ color: Colors.brandPrimary }}>{service}</Text>
                  </View>
                ) : null}

                {/* Experience */}
                {spec.experience != null ? (
                  <Text className="text-xs text-textMuted">Опыт: {spec.experience} лет</Text>
                ) : null}

                <Pressable
                  className="h-9 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary"
                  onPress={() => router.push(`/specialists/${spec.nick}` as any)}
                >
                  <Text className="text-xs font-semibold text-brandPrimary">Подробнее</Text>
                </Pressable>
              </View>
            );
          })
        }
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
// STATS + TRUST — real data from API
// =====================================================================

interface LandingStats {
  specialistsCount: number;
  ifnsCount: number;
  requestsCount: number;
}

function StatsSection() {
  const { isDesktop } = useLayout();
  const [data, setData] = useState<LandingStats | null>(null);

  useEffect(() => {
    stats.getLandingStats()
      .then((res) => {
        const d = (res as any).data ?? res;
        setData(d && typeof d === 'object' ? d : null);
      })
      .catch(() => {});
  }, []);

  const items = [
    { value: data ? String(data.specialistsCount) : '—', label: 'специалистов', icon: 'users' as const },
    { value: data ? String(data.ifnsCount) : '—', label: 'инспекций', icon: 'map-pin' as const },
    { value: data ? String(data.requestsCount) : '—', label: 'обращений', icon: 'file-text' as const },
  ];

  return (
    <View className="bg-white px-5 py-10">
      <View className={`w-full self-center ${isDesktop ? 'flex-row justify-around' : 'flex-row flex-wrap justify-center gap-6'}`} style={{ maxWidth: 800 }}>
        {items.map((stat) => (
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
        <Pressable className="h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary" style={{ maxWidth: 300 }} onPress={() => router.push('/specialists' as any)}>
          <Feather name="search" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Открыть каталог</Text>
        </Pressable>
      </View>

      <View className="mt-6 flex-row items-center gap-2">
        <Feather name="briefcase" size={14} color={Colors.textMuted} />
        <Text className="text-sm text-textMuted">Вы налоговый специалист?</Text>
        <Pressable onPress={() => router.push('/(auth)/role' as any)}>
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
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <Header variant="guest" />
      <ScrollView style={{ backgroundColor: Colors.white }}>
        <HeroSection />
        <SpecialistsCarousel />
        <ServicesSection />
        <HowItWorksSection />
        <StatsSection />
        <BottomCTA />
        <FooterSection />
      </ScrollView>
    </View>
  );
}
