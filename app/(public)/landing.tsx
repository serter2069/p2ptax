import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { api } from '../../lib/api';
import { IfnsSearch } from '../../components/IfnsSearch';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

const SERVICE_OPTIONS = [
  'Камеральная проверка',
  'Выездная проверка',
  'Отдел оперативного контроля',
  'Не знаю',
] as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useIsDesktop() {
  const { width } = useWindowDimensions();
  return width >= 768;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  return (
    <View style={s.header}>
      <View style={s.headerInner}>
        <Pressable style={s.headerLogoRow} onPress={() => router.push('/')}>
          <Feather name="briefcase" size={20} color={Colors.brandPrimary} />
          <Text style={s.headerLogoText}>Налоговик</Text>
        </Pressable>
        {isDesktop && (
          <View style={s.headerNav}>
            <Pressable onPress={() => router.push('/specialists')}>
              <Text style={s.headerNavLink}>Специалисты</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/requests')}>
              <Text style={s.headerNavLink}>Заявки</Text>
            </Pressable>
          </View>
        )}
        <Pressable style={s.headerLoginBtn} onPress={() => router.push('/(auth)/email')}>
          <Text style={s.headerLoginText}>Войти</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  return (
    <View style={s.hero}>
      <View style={s.heroInner}>
        <Text style={[s.heroTitle, !isDesktop && { fontSize: 28, lineHeight: 36 }]}>
          {'Найдите специалиста\nпо налогам'}
        </Text>
        <Text style={s.heroSubtitle}>
          Консультанты, которые знают вашу инспекцию изнутри — камеральные и выездные проверки, оперативный контроль
        </Text>
        <View style={[s.heroSearchRow, !isDesktop && { flexDirection: 'column' }]}>
          <View style={s.heroSearchInputWrap}>
            <Feather name="map-pin" size={18} color={Colors.textMuted} style={{ marginLeft: 14 }} />
            <TextInput
              style={s.heroSearchInput}
              placeholder="Введите город..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <Pressable style={s.heroSearchBtn} onPress={() => router.push('/specialists')}>
            <Feather name="search" size={18} color={Colors.white} />
            <Text style={s.heroSearchBtnText}>Найти специалиста</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------

function StatsBar({ stats }: { stats: LandingStats | null }) {
  const isDesktop = useIsDesktop();

  const items = [
    { value: stats ? `${stats.specialistsCount}+` : '...', label: 'специалистов', icon: 'users' as const },
    { value: stats ? String(stats.ifnsCount) : '...', label: 'отделений ФНС', icon: 'home' as const },
    { value: stats ? `${stats.requestsCount}+` : '...', label: 'заявок', icon: 'file-text' as const },
  ];

  return (
    <View style={s.statsBar}>
      <View style={[s.statsBarInner, !isDesktop && { gap: 16 }]}>
        {items.map((stat) => (
          <View key={stat.label} style={s.statItem}>
            <Feather name={stat.icon} size={18} color={Colors.brandPrimary} />
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

function HowItWorksSection() {
  const isDesktop = useIsDesktop();

  const steps = [
    { icon: 'map-pin' as const, num: '1', title: 'Укажите вашу ФНС', desc: 'Выберите город и налоговую инспекцию' },
    { icon: 'file-text' as const, num: '2', title: 'Опишите задачу', desc: 'Расскажите, с чем нужна помощь' },
    { icon: 'message-circle' as const, num: '3', title: 'Получите отклик', desc: 'Специалист из вашей ФНС свяжется с вами' },
  ];

  return (
    <View style={s.section}>
      <View style={s.sectionInner}>
        <Text style={s.sectionTitle}>Как это работает</Text>
        <View style={[s.stepsRow, !isDesktop && { flexDirection: 'column' }]}>
          {steps.map((step) => (
            <View key={step.title} style={s.stepCard}>
              <View style={s.stepNumBadge}>
                <Text style={s.stepNumText}>{step.num}</Text>
              </View>
              <View style={s.stepIconWrap}>
                <Feather name={step.icon} size={28} color={Colors.brandPrimary} />
              </View>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

function ServicesSection() {
  const isDesktop = useIsDesktop();

  const services = [
    { icon: 'search' as const, title: 'Камеральная проверка', desc: 'Сопровождение проверки деклараций. Поможем подготовить документы и пройти проверку без штрафов.' },
    { icon: 'shield' as const, title: 'Выездная проверка', desc: 'Защита интересов при выездной проверке ФНС. Подготовка, присутствие, обжалование результатов.' },
    { icon: 'eye' as const, title: 'Отдел оперативного контроля', desc: 'Консультации по оперативному контролю. Проверка контрагентов, встречные проверки.' },
  ];

  return (
    <View style={[s.section, { backgroundColor: Colors.bgSecondary }]}>
      <View style={s.sectionInner}>
        <Text style={s.sectionTitle}>Наши услуги</Text>
        <View style={[s.servicesGrid, !isDesktop && { flexDirection: 'column' }]}>
          {services.map((svc) => (
            <View key={svc.title} style={s.serviceCard}>
              <View style={s.serviceIconWrap}>
                <Feather name={svc.icon} size={24} color={Colors.brandPrimary} />
              </View>
              <Text style={s.serviceTitle}>{svc.title}</Text>
              <Text style={s.serviceDesc}>{svc.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Featured Specialists Carousel
// ---------------------------------------------------------------------------

function SpecialistCard({ sp }: { sp: Specialist }) {
  const router = useRouter();

  return (
    <Pressable
      style={s.specialistCard}
      onPress={sp.nick ? () => router.push(`/specialists/${sp.nick}` as any) : undefined}
    >
      {sp.avatarUrl ? (
        <Image source={{ uri: sp.avatarUrl }} style={s.specialistAvatar} />
      ) : (
        <View style={[s.specialistAvatar, s.specialistAvatarPlaceholder]}>
          <Text style={s.specialistAvatarLetter}>
            {(sp.displayName || sp.nick || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={s.specialistName} numberOfLines={1}>{sp.displayName || sp.nick || ''}</Text>
      <View style={s.specialistChipsRow}>
        {sp.cities?.[0] && (
          <View style={s.chipLocation}>
            <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
            <Text style={s.chipLocationText}>{sp.cities[0]}</Text>
          </View>
        )}
      </View>
      {sp.services && sp.services.length > 0 && (
        <View style={s.specialistServicesRow}>
          {sp.services.slice(0, 2).map((svc) => (
            <View key={svc} style={s.chipService}>
              <Text style={s.chipServiceText} numberOfLines={1}>{svc}</Text>
            </View>
          ))}
        </View>
      )}
      {sp.createdAt && (
        <Text style={s.specialistSince}>
          На платформе с {new Date(sp.createdAt).getFullYear()} г.
        </Text>
      )}
    </Pressable>
  );
}

function SpecialistsSection({
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
    <View style={s.section}>
      <View style={s.sectionInner}>
        <Text style={s.sectionTitle}>Специалисты на платформе</Text>

        {error && (
          <View style={s.errorBanner}>
            <Feather name="alert-circle" size={18} color={Colors.statusError} />
            <Text style={s.errorBannerText}>Не удалось загрузить специалистов</Text>
            <Pressable style={s.retryBtn} onPress={onRetry}>
              <Text style={s.retryBtnText}>Повторить</Text>
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
            contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
            decelerationRate="fast"
            snapToInterval={224}
          >
            {specialists.map((sp) => (
              <SpecialistCard key={sp.nick || sp.displayName} sp={sp} />
            ))}
          </ScrollView>
        )}

        {!error && !loading && specialists.length > 0 && (
          <Pressable style={s.allSpecialistsLink} onPress={() => router.push('/specialists')}>
            <Text style={s.allSpecialistsText}>Все специалисты</Text>
            <Feather name="arrow-right" size={16} color={Colors.brandPrimary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quick Request Form
// ---------------------------------------------------------------------------

function QuickRequestSection() {
  const router = useRouter();
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
        // Not authenticated — save form and redirect to auth
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

  if (submitted) {
    return (
      <View style={[s.section, { backgroundColor: Colors.bgSecondary }]}>
        <View style={s.sectionInner}>
          <View style={s.formSuccessWrap}>
            <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
            <Text style={s.formSuccessTitle}>Заявка отправлена</Text>
            <Text style={s.formSuccessText}>Специалисты свяжутся с вами в ближайшее время.</Text>
            <Pressable style={s.formBtn} onPress={() => router.push('/(auth)/email')}>
              <Text style={s.formBtnText}>Войти и отслеживать</Text>
            </Pressable>
            <Pressable onPress={() => { setSubmitted(false); setDescription(''); setServiceType(''); setSelectedIfns(null); }}>
              <Text style={s.formLinkText}>Подать новую заявку</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.section, { backgroundColor: Colors.bgSecondary }]}>
      <View style={s.sectionInner}>
        <Text style={s.sectionTitle}>Оставьте заявку прямо сейчас</Text>
        <Text style={s.sectionSubtitle}>Бесплатно. Специалисты откликнутся в течение дня.</Text>

        <View style={s.formCard}>
          <Text style={s.formLabel}>Тип услуги</Text>
          <View style={s.serviceRadioGroup}>
            {SERVICE_OPTIONS.map((svc) => (
              <Pressable key={svc} style={s.serviceRadioRow} onPress={() => setServiceType(svc)}>
                <View style={[s.radioOuter, serviceType === svc && s.radioOuterActive]}>
                  {serviceType === svc && <View style={s.radioInner} />}
                </View>
                <Text style={s.serviceRadioLabel}>{svc}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.formLabel}>Опишите ситуацию</Text>
          <TextInput
            style={s.formTextArea}
            multiline
            numberOfLines={4}
            placeholder="Что произошло? С чем нужна помощь?"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />

          <Text style={s.formLabel}>ИФНС (необязательно)</Text>
          <IfnsSearch
            selected={selectedIfns}
            onSelect={setSelectedIfns}
            placeholder="Номер или название ИФНС..."
          />

          {error ? <Text style={s.formError}>{error}</Text> : null}

          <Pressable
            style={[s.formBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Feather name="send" size={16} color={Colors.white} />
            <Text style={s.formBtnText}>
              {submitting ? 'Отправка...' : 'Разместить запрос'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  const router = useRouter();

  return (
    <View style={s.footer}>
      <View style={s.footerInner}>
        <View style={s.footerTop}>
          <View style={s.footerLogoRow}>
            <Feather name="briefcase" size={18} color={Colors.brandPrimary} />
            <Text style={s.footerLogo}>Налоговик</Text>
          </View>
          <View style={s.footerLinksRow}>
            <Pressable onPress={() => router.push('/specialists')}>
              <Text style={s.footerLink}>Специалисты</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/requests')}>
              <Text style={s.footerLink}>Заявки</Text>
            </Pressable>
          </View>
        </View>
        <View style={s.footerDivider} />
        <Text style={s.footerCopy}>{new Date().getFullYear()} Налоговик. Все права защищены.</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Landing Screen
// ---------------------------------------------------------------------------

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
    <SafeAreaView style={s.safe}>
      <Head>
        <title>Налоговик — найдите налогового специалиста</title>
        <meta name="description" content="Подбираем специалиста по вашей ИФНС и конкретной ситуации. Выездная проверка, камеральная, вычеты, споры — только тот, кто знает именно ваш вопрос." />
        <meta property="og:title" content="Налоговик — найдите налогового специалиста" />
        <meta property="og:description" content="Подбираем специалиста по вашей ИФНС и конкретной ситуации." />
        <meta property="og:url" content={APP_URL} />
      </Head>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Header />
        <HeroSection />
        <StatsBar stats={stats} />
        <HowItWorksSection />
        <ServicesSection />
        <SpecialistsSection
          specialists={specialists}
          loading={specialistsLoading}
          error={specialistsError}
          onRetry={loadSpecialists}
        />
        <QuickRequestSection />
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BRAND_DARK = '#1B2E4A';

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: BRAND_DARK,
  },
  headerNav: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  headerNavLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  headerLoginBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  headerLoginText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },

  // Hero
  hero: {
    backgroundColor: BRAND_DARK,
    paddingVertical: Spacing['4xl'],
  },
  heroInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroTitle: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },
  heroSearchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 560,
  },
  heroSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.btn,
    overflow: 'hidden',
  },
  heroSearchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    // @ts-ignore web-only
    outlineStyle: 'none' as any,
  },
  heroSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing.xl,
  },
  heroSearchBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // Stats Bar
  statsBar: {
    backgroundColor: Colors.bgPrimary,
    paddingVertical: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statsBarInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: BRAND_DARK,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Sections
  section: {
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.bgPrimary,
  },
  sectionInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing.md,
  },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  stepCard: {
    flex: 1,
    minWidth: 240,
    maxWidth: 300,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  serviceCard: {
    flex: 1,
    minWidth: 260,
    maxWidth: 320,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  serviceDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Specialist cards
  specialistCard: {
    width: 210,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  specialistAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.xs,
  },
  specialistAvatarPlaceholder: {
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialistAvatarLetter: {
    fontSize: 22,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  specialistName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  specialistChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  chipLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
  },
  chipLocationText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  specialistServicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginTop: 2,
  },
  chipService: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipServiceText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  specialistSince: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  allSpecialistsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  allSpecialistsText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
    backgroundColor: Colors.statusError,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // Form
  formCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.lg,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    ...Shadows.sm,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  serviceRadioGroup: {
    gap: Spacing.sm,
  },
  serviceRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.brandPrimary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brandPrimary,
  },
  serviceRadioLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  formTextArea: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
    textAlignVertical: 'top',
    // @ts-ignore web-only
    outlineStyle: 'none' as any,
  },
  formError: {
    color: Colors.statusError,
    fontSize: Typography.fontSize.sm,
  },
  formBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
  },
  formBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  formSuccessWrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 48,
  },
  formSuccessTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  formSuccessText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
  },
  formLinkText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Footer
  footer: {
    backgroundColor: BRAND_DARK,
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  footerInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerLogo: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  footerLinksRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  footerLink: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footerCopy: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
