import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors, Shadows } from '../../constants/Colors';
import { api } from '../../lib/api';
import { IfnsSearch } from '../../components/IfnsSearch';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

const SERVICE_OPTIONS = [
  'Камеральная проверка',
  'Выездная проверка',
  'Отдел оперативного контроля',
  'Не знаю',
] as const;

// =====================================================================
// HELPERS
// =====================================================================

function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// =====================================================================
// Types
// =====================================================================

interface Specialist {
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  cities: string[];
  services: string[];
  badges: string[];
  experience: string | null;
  headline: string | null;
  createdAt: string;
}

interface LandingStats {
  specialistsCount: number;
  ifnsCount: number;
  requestsCount: number;
}

// =====================================================================
// HEADER
// =====================================================================

function Header() {
  const router = useRouter();
  const { isDesktop } = useLayout();

  return (
    <View className="border-b border-borderLight bg-white">
      <View className="w-full flex-row items-center justify-between self-center px-5 py-3" style={{ maxWidth: 800 }}>
        <Pressable className="flex-row items-center gap-2" onPress={() => router.push('/')}>
          <View className="h-6 w-6 items-center justify-center rounded-lg bg-brandPrimary">
            <Feather name="shield" size={13} color={Colors.white} />
          </View>
          <Text className="text-lg font-bold text-textPrimary">P2PTax</Text>
        </Pressable>
        {isDesktop && (
          <View className="flex-row gap-5">
            <Pressable onPress={() => router.push('/specialists')}>
              <Text className="text-sm font-medium text-textSecondary">Специалисты</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/requests')}>
              <Text className="text-sm font-medium text-textSecondary">Заявки</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          className="rounded-lg border border-brandPrimary px-4 py-2"
          onPress={() => router.push('/(auth)/email')}
        >
          <Text className="text-sm font-semibold text-brandPrimary">Войти</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// HERO — USP headline + inline request form
// =====================================================================

function HeroSection() {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const [description, setDescription] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!serviceType) {
      setError('Выберите тип услуги');
      return;
    }
    if (description.trim().length < 3) {
      setError('Описание слишком короткое');
      return;
    }
    setError('');
    const data: Record<string, string> = {
      description: description.trim().slice(0, 500),
      serviceType,
      city: selectedIfns?.city?.name || '',
    };
    if (selectedIfns) {
      data.ifnsId = selectedIfns.id;
      data.ifnsName = selectedIfns.name;
    }

    setSubmitting(true);
    try {
      await api.post('/requests/quick', data);
      setSubmitted(true);
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          const { secureStorage } = await import('../../stores/storage');
          await secureStorage.setItem('p2ptax_pending_request', JSON.stringify(data));
        } catch {}
        router.push('/(auth)/email');
        return;
      }
      setError(e?.message || 'Не удалось отправить заявку');
    } finally {
      setSubmitting(false);
    }
  };

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
          <View
            className="rounded-2xl border border-borderLight bg-bgSecondary p-5"
            style={{ width: isDesktop ? 340 : '100%', ...Shadows.md }}
          >
            {submitted ? (
              <View className="items-center gap-3 py-4">
                <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
                <Text className="text-lg font-semibold text-textPrimary">Заявка отправлена</Text>
                <Text className="text-center text-sm text-textSecondary">
                  Специалисты свяжутся с вами в ближайшее время.
                </Text>
                <Pressable
                  className="h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
                  onPress={() => router.push('/(auth)/email')}
                >
                  <Text className="text-base font-semibold text-white">Войти и отслеживать</Text>
                </Pressable>
                <Pressable onPress={() => { setSubmitted(false); setDescription(''); setServiceType(''); setSelectedIfns(null); }}>
                  <Text className="text-sm font-medium text-brandPrimary">Подать новую заявку</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="mb-1 text-lg font-bold text-textPrimary">Разместить запрос</Text>
                <Text className="mb-4 text-sm text-textSecondary">
                  Опишите вашу ситуацию — специалисты по вашей ФНС свяжутся с вами в чате
                </Text>

                {/* Service type picker */}
                <View className="mb-3 gap-1">
                  <Text className="mb-1 text-xs font-semibold text-textPrimary">Тип услуги</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((svc) => (
                      <Pressable
                        key={svc}
                        className={`rounded-full border px-3 py-1.5 ${serviceType === svc ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}
                        onPress={() => setServiceType(svc)}
                      >
                        <Text className={`text-xs font-medium ${serviceType === svc ? 'text-white' : 'text-textPrimary'}`}>
                          {svc}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* IFNS search */}
                <View className="mb-3 gap-1">
                  <Text className="mb-1 text-xs font-semibold text-textPrimary">ИФНС (необязательно)</Text>
                  <IfnsSearch
                    selected={selectedIfns}
                    onSelect={setSelectedIfns}
                    placeholder="Номер или название ИФНС..."
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
                    maxLength={500}
                    className="min-h-[72px] rounded-xl border border-borderLight bg-white p-3 text-sm text-textPrimary"
                    style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
                  />
                </View>

                {error ? <Text className="mb-2 text-xs" style={{ color: Colors.statusError }}>{error}</Text> : null}

                <Pressable
                  className={`h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary ${submitting ? 'opacity-60' : ''}`}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Feather name="send" size={16} color={Colors.white} />
                  <Text className="text-base font-semibold text-white">
                    {submitting ? 'Отправка...' : 'Отправить заявку'}
                  </Text>
                </Pressable>

                <Text className="mt-2 text-center text-xs text-textMuted">
                  Бесплатно. Специалисты напишут вам сами.
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SPECIALISTS CAROUSEL — real API data
// =====================================================================

const AVATAR_COLORS = ['#0284C7', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0891B2', '#4F46E5', '#BE185D', '#0D9488', '#9333EA', '#B91C1C', '#1D4ED8'];

function SpecialistsCarousel({
  specialists,
  loading,
  error,
  onRetry,
}: {
  specialists: Specialist[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const router = useRouter();

  return (
    <View className="py-10" style={{ backgroundColor: Colors.bgSecondary }}>
      <View className="mb-6 w-full self-center px-5" style={{ maxWidth: 800 }}>
        <Text className="mb-1 text-xs font-bold uppercase" style={{ color: Colors.brandPrimary, letterSpacing: 1.2 }}>
          Наши специалисты
        </Text>
        <Text className="text-2xl font-bold text-textPrimary">
          Работают на платформе
        </Text>
        {!loading && !error && specialists.length > 0 && (
          <Text className="mt-1 text-sm text-textSecondary">
            {specialists.length} специалистов из {new Set(specialists.flatMap(s => s.cities || [])).size} городов
          </Text>
        )}
      </View>

      {error && (
        <View className="mx-5 flex-row items-center gap-3 rounded-xl p-4" style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
          <Feather name="alert-circle" size={18} color={Colors.statusError} />
          <Text className="flex-1 text-sm" style={{ color: Colors.statusError }}>Не удалось загрузить специалистов</Text>
          <Pressable className="rounded-lg px-3 py-1.5" style={{ backgroundColor: Colors.statusError }} onPress={onRetry}>
            <Text className="text-sm font-semibold text-white">Повторить</Text>
          </Pressable>
        </View>
      )}

      {!error && loading && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      )}

      {!error && !loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          decelerationRate="fast"
          snapToInterval={232}
        >
          {specialists.map((spec, idx) => {
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const name = spec.displayName || spec.nick || '?';
            const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const city = spec.cities?.[0] || '';
            const service = spec.services?.[0] || '';

            return (
              <Pressable
                key={spec.nick || idx}
                className="gap-3 rounded-2xl bg-white p-4"
                style={{ width: 220, ...Shadows.sm }}
                onPress={spec.nick ? () => router.push(`/specialists/${spec.nick}` as any) : undefined}
              >
                {/* Avatar */}
                <View className="flex-row items-center gap-3">
                  {spec.avatarUrl ? (
                    <Image source={{ uri: spec.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                  ) : (
                    <View
                      className="items-center justify-center rounded-full"
                      style={{ width: 48, height: 48, backgroundColor: color + '15' }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color }}>{initials}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-textPrimary" numberOfLines={1}>{name}</Text>
                    {city ? <Text className="text-xs text-textMuted">{city}</Text> : null}
                  </View>
                </View>

                {/* Service chip */}
                {service ? (
                  <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: Colors.brandPrimary + '12' }}>
                    <Text className="text-xs font-medium" style={{ color: Colors.brandPrimary }}>{service}</Text>
                  </View>
                ) : null}

                {/* Since */}
                {spec.createdAt && (
                  <Text className="text-xs text-textMuted">
                    На платформе с {new Date(spec.createdAt).getFullYear()} г.
                  </Text>
                )}

                <Pressable
                  className="h-9 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary"
                  onPress={spec.nick ? () => router.push(`/specialists/${spec.nick}` as any) : undefined}
                >
                  <Text className="text-xs font-semibold text-brandPrimary">Подробнее</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {!error && !loading && specialists.length > 0 && (
        <Pressable
          className="mt-4 flex-row items-center justify-center gap-1.5"
          onPress={() => router.push('/specialists')}
        >
          <Text className="text-sm font-semibold text-brandPrimary">Все специалисты</Text>
          <Feather name="arrow-right" size={14} color={Colors.brandPrimary} />
        </Pressable>
      )}
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

function StatsSection({ stats }: { stats: LandingStats | null }) {
  const { isDesktop } = useLayout();

  const items = [
    { value: stats ? `${stats.specialistsCount}+` : '...', label: 'специалистов', icon: 'users' as const },
    { value: stats ? String(stats.ifnsCount) : '...', label: 'отделений ФНС', icon: 'map-pin' as const },
    { value: stats ? `${stats.requestsCount}+` : '...', label: 'обращений', icon: 'file-text' as const },
    { value: '4.8', label: 'средний рейтинг', icon: 'star' as const },
  ];

  return (
    <View className="bg-white px-5 py-10">
      <View
        className={`w-full self-center ${isDesktop ? 'flex-row justify-around' : 'flex-row flex-wrap justify-center gap-6'}`}
        style={{ maxWidth: 800 }}
      >
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
        <Pressable
          className="h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
          style={{ maxWidth: 300 }}
          onPress={() => router.push('/specialists')}
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
        <Text className="text-xs text-textMuted">{new Date().getFullYear()}. Все права защищены.</Text>
      </View>
    </View>
  );
}

// =====================================================================
// FULL LANDING PAGE
// =====================================================================

export default function LandingScreen() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const [specialistsError, setSpecialistsError] = useState(false);
  const [stats, setStats] = useState<LandingStats | null>(null);

  const loadSpecialists = () => {
    setSpecialistsError(false);
    setSpecialistsLoading(true);
    api.get<Specialist[]>('/specialists/featured?limit=12')
      .then(setSpecialists)
      .catch(() => setSpecialistsError(true))
      .finally(() => setSpecialistsLoading(false));
  };

  useEffect(() => {
    loadSpecialists();
    api.get<LandingStats>('/stats/landing')
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <Head>
        <title>P2PTax — специалисты, которые знают вашу ФНС</title>
        <meta name="description" content="Не общие юристы, а конкретные консультанты с опытом работы в конкретных налоговых инспекциях. Выездная проверка, камеральная, оперативный контроль." />
        <meta property="og:title" content="P2PTax — специалисты, которые знают вашу ФНС" />
        <meta property="og:description" content="Конкретные консультанты с опытом работы в конкретных налоговых инспекциях." />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:type" content="website" />
      </Head>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Header />
        <HeroSection />
        <SpecialistsCarousel
          specialists={specialists}
          loading={specialistsLoading}
          error={specialistsError}
          onRetry={loadSpecialists}
        />
        <ServicesSection />
        <HowItWorksSection />
        <StatsSection stats={stats} />
        <BottomCTA />
        <FooterSection />
      </ScrollView>
    </SafeAreaView>
  );
}
