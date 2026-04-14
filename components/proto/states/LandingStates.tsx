import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { StateSection } from '../StateSection';

const CITIES = [
  'Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск',
  'Краснодар', 'Нижний Новгород', 'Самара', 'Ростов-на-Дону', 'Уфа',
];

const FNS_MAP: Record<string, string[]> = {
  'Москва': ['ИФНС №7', 'ИФНС №10', 'ИФНС №18', 'ИФНС №24', 'ИФНС №46'],
  'Санкт-Петербург': ['ИФНС №2', 'ИФНС №9', 'ИФНС №15', 'ИФНС №21'],
  'Казань': ['ИФНС №4', 'ИФНС №6', 'ИФНС №14'],
  'Екатеринбург': ['ИФНС №3', 'ИФНС №9', 'ИФНС №11'],
  'Новосибирск': ['ИФНС №1', 'ИФНС №8', 'ИФНС №14'],
  'Краснодар': ['ИФНС №2', 'ИФНС №5', 'ИФНС №10'],
  'Нижний Новгород': ['ИФНС №1', 'ИФНС №5', 'ИФНС №13'],
  'Самара': ['ИФНС №3', 'ИФНС №7'],
  'Ростов-на-Дону': ['ИФНС №2', 'ИФНС №6', 'ИФНС №11'],
  'Уфа': ['ИФНС №1', 'ИФНС №4'],
};

const SERVICE_OPTIONS = ['Камеральная проверка', 'Выездная проверка', 'Оперативный контроль', 'Не знаю'] as const;

const SPECIALISTS = [
  { name: 'Алексей Петров', city: 'Москва', fns: 'ИФНС №7', services: ['Камеральная проверка', 'Выездная проверка'], seed: 'alexei-petrov' },
  { name: 'Мария Сидорова', city: 'СПб', fns: 'ИФНС №15', services: ['Выездная проверка', 'Оперативный контроль'], seed: 'maria-sidorova' },
  { name: 'Дмитрий Козлов', city: 'Казань', fns: 'ИФНС №4', services: ['Камеральная проверка'], seed: 'dmitry-kozlov' },
  { name: 'Елена Волкова', city: 'Москва', fns: 'ИФНС №46', services: ['Камеральная проверка', 'Оперативный контроль'], seed: 'elena-volkova' },
];

function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

// --- Header ---

function PublicHeader() {
  return (
    <View style={s.header}>
      <View style={s.headerInner}>
        <View style={s.headerLogoRow}>
          <View style={s.headerLogoIcon}>
            <Feather name="shield" size={16} color={Colors.white} />
          </View>
          <Text style={s.headerLogoText}>Налоговик</Text>
        </View>
        <View style={s.headerNav}>
          <Text style={s.headerNavLink}>Специалисты</Text>
          <Text style={s.headerNavLink}>Заявки</Text>
          <Text style={s.headerNavLink}>Тарифы</Text>
        </View>
        <Pressable style={s.headerLoginBtn}>
          <Text style={s.headerLoginText}>Войти</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- Hero ---

function HeroSection() {
  const { isDesktop } = useLayout();
  return (
    <View style={s.hero}>
      <View style={s.heroInner}>
        <Text style={[s.heroTitle, isDesktop && s.heroTitleDesktop]}>
          Найдите специалиста{'\n'}в вашей налоговой
        </Text>
        <Text style={s.heroSubtitle}>
          Консультанты, которые знают вашу инспекцию изнутри
        </Text>
        <View style={[s.heroSearchRow, isDesktop && s.heroSearchRowDesktop]}>
          <View style={s.heroSearchInputWrap}>
            <Feather name="map-pin" size={18} color={Colors.textMuted} style={{ marginLeft: 14 }} />
            <TextInput
              style={s.heroSearchInput}
              placeholder="Введите город..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <Pressable style={s.heroSearchBtn}>
            <Feather name="search" size={18} color={Colors.white} />
            <Text style={s.heroSearchBtnText}>Найти</Text>
          </Pressable>
        </View>
        <View style={s.heroStats}>
          <Text style={s.heroStat}>230+ специалистов</Text>
          <View style={s.heroDot} />
          <Text style={s.heroStat}>47 городов</Text>
          <View style={s.heroDot} />
          <Text style={s.heroStat}>1 200+ заявок</Text>
        </View>
      </View>
    </View>
  );
}

// --- How It Works ---

function HowItWorksSection() {
  const { isDesktop } = useLayout();
  const steps: { icon: 'map-pin' | 'file-text' | 'message-circle'; title: string; desc: string }[] = [
    { icon: 'map-pin', title: 'Укажите ФНС', desc: 'Выберите город и налоговую инспекцию' },
    { icon: 'file-text', title: 'Опишите задачу', desc: 'Камеральная, выездная проверка или оперативный контроль' },
    { icon: 'message-circle', title: 'Получите отклик', desc: 'Специалист из вашего ФНС свяжется с вами' },
  ];
  return (
    <View style={s.section}>
      <View style={s.sectionInner}>
        <Text style={s.sectionLabel}>КАК ЭТО РАБОТАЕТ</Text>
        <Text style={s.sectionTitle}>Три простых шага</Text>
        <View style={[s.stepsRow, isDesktop && s.stepsRowDesktop]}>
          {steps.map((step, i) => (
            <View key={step.title} style={s.stepCard}>
              <View style={s.stepNumRow}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
              </View>
              <View style={s.stepIconWrap}>
                <Feather name={step.icon} size={24} color={Colors.brandPrimary} />
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

// --- Services ---

function ServicesSection() {
  const { isDesktop } = useLayout();
  const services: { icon: 'search' | 'shield' | 'eye'; title: string; desc: string }[] = [
    { icon: 'search', title: 'Камеральная проверка', desc: 'Сопровождение проверки деклараций без штрафов.' },
    { icon: 'shield', title: 'Выездная проверка', desc: 'Защита интересов при выездной проверке ФНС.' },
    { icon: 'eye', title: 'Оперативный контроль', desc: 'Проверка контрагентов, встречные проверки.' },
  ];
  return (
    <View style={[s.section, { backgroundColor: Colors.bgSecondary }]}>
      <View style={s.sectionInner}>
        <Text style={s.sectionLabel}>УСЛУГИ</Text>
        <Text style={s.sectionTitle}>Чем мы помогаем</Text>
        <View style={[s.servicesGrid, isDesktop && s.servicesGridDesktop]}>
          {services.map((svc) => (
            <View key={svc.title} style={s.serviceCard}>
              <View style={s.serviceIconWrap}>
                <Feather name={svc.icon} size={22} color={Colors.brandPrimary} />
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

// --- Featured Specialists ---

interface SpecialistsProps { loading?: boolean; error?: boolean }

function FeaturedSpecialists({ loading, error }: SpecialistsProps) {
  const { isDesktop } = useLayout();
  return (
    <View style={s.section}>
      <View style={s.sectionInner}>
        <Text style={s.sectionLabel}>СПЕЦИАЛИСТЫ</Text>
        <Text style={s.sectionTitle}>На платформе</Text>

        {error && (
          <View style={s.errorBanner}>
            <Feather name="alert-circle" size={18} color={Colors.statusError} />
            <Text style={s.errorBannerText}>Не удалось загрузить специалистов</Text>
            <Pressable style={s.retryBtn}>
              <Text style={s.retryBtnText}>Повторить</Text>
            </Pressable>
          </View>
        )}

        {!error && (
          <View style={[s.specialistsGrid, isDesktop && s.specialistsGridDesktop]}>
            {SPECIALISTS.map((sp) => (
              <View key={sp.seed} style={[s.specialistCard, loading && s.skeletonCard]}>
                {loading ? (
                  <>
                    <View style={s.skeletonAvatar} />
                    <View style={s.skeletonLine} />
                    <View style={[s.skeletonLine, { width: '60%' }]} />
                  </>
                ) : (
                  <>
                    <Image source={{ uri: `https://picsum.photos/seed/${sp.seed}/80/80` }} style={s.specialistAvatar} />
                    <Text style={s.specialistName}>{sp.name}</Text>
                    <View style={s.specialistChipsRow}>
                      <View style={s.chipLocation}>
                        <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
                        <Text style={s.chipLocationText}>{sp.city}</Text>
                      </View>
                      <View style={s.chipFns}>
                        <Text style={s.chipFnsText}>{sp.fns}</Text>
                      </View>
                    </View>
                    <View style={s.specialistServicesRow}>
                      {sp.services.map((svc) => (
                        <View key={svc} style={s.chipService}>
                          <Text style={s.chipServiceText}>{svc}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {!error && !loading && (
          <Pressable style={s.allSpecialistsLink}>
            <Text style={s.allSpecialistsText}>Все специалисты</Text>
            <Feather name="arrow-right" size={16} color={Colors.brandPrimary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// --- Quick Request Form ---

interface FormProps {
  prefillCity?: string;
  prefillFns?: string;
  prefillService?: string;
  prefillDescription?: string;
}

function QuickRequestForm({ prefillCity, prefillFns, prefillService, prefillDescription }: FormProps) {
  const [city, setCity] = useState(prefillCity || '');
  const [fns, setFns] = useState(prefillFns || '');
  const [service, setService] = useState(prefillService || '');
  const [description, setDescription] = useState(prefillDescription || '');

  const fnsOptions = city ? (FNS_MAP[city] || []) : [];

  return (
    <View style={[s.section, { backgroundColor: Colors.bgSecondary }]}>
      <View style={s.sectionInner}>
        <Text style={s.sectionLabel}>ЗАЯВКА</Text>
        <Text style={s.sectionTitle}>Оставьте заявку</Text>
        <Text style={s.sectionSubtitle}>Бесплатно. Специалисты откликнутся в течение дня.</Text>

        <View style={s.formCard}>
          <Text style={s.formLabel}>Город</Text>
          <View style={s.formInputWrap}>
            <Feather name="map-pin" size={16} color={Colors.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={s.formInput}
              placeholder="Начните вводить город..."
              placeholderTextColor={Colors.textMuted}
              value={city}
              onChangeText={(v) => { setCity(v); setFns(''); }}
            />
          </View>

          {fnsOptions.length > 0 && (
            <>
              <Text style={s.formLabel}>Отделение ФНС</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.formChipsScroll}>
                {fnsOptions.map((f) => (
                  <Pressable key={f} style={[s.formChip, fns === f && s.formChipActive]} onPress={() => setFns(f)}>
                    <Text style={[s.formChipText, fns === f && s.formChipTextActive]}>{f}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={s.formLabel}>Услуга</Text>
          <View style={s.serviceRadioGroup}>
            {SERVICE_OPTIONS.map((svc) => (
              <Pressable key={svc} style={s.serviceRadioRow} onPress={() => setService(svc)}>
                <View style={[s.radioOuter, service === svc && s.radioOuterActive]}>
                  {service === svc && <View style={s.radioInner} />}
                </View>
                <Text style={s.serviceRadioLabel}>{svc}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.formLabel}>Описание</Text>
          <TextInput
            style={s.formTextArea}
            multiline
            numberOfLines={4}
            placeholder="Опишите вашу ситуацию..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Pressable style={s.formSubmitBtn}>
            <Feather name="send" size={16} color={Colors.white} />
            <Text style={s.formSubmitText}>Отправить заявку</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --- Stats ---

function StatsSection() {
  const { isDesktop } = useLayout();
  const stats = [
    { value: '230+', label: 'специалистов', icon: 'users' as const },
    { value: '47', label: 'городов', icon: 'map-pin' as const },
    { value: '1 200+', label: 'заявок', icon: 'file-text' as const },
    { value: '4.8', label: 'средний рейтинг', icon: 'star' as const },
  ];
  return (
    <View style={s.section}>
      <View style={s.sectionInner}>
        <View style={[s.statsRow, isDesktop && s.statsRowDesktop]}>
          {stats.map((stat) => (
            <View key={stat.label} style={s.statItem}>
              <Feather name={stat.icon} size={20} color={Colors.brandPrimary} />
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// --- Footer ---

function FooterSection() {
  return (
    <View style={s.footer}>
      <View style={s.footerInner}>
        <View style={s.footerTop}>
          <View style={s.footerLogoRow}>
            <View style={s.footerLogoIcon}>
              <Feather name="shield" size={14} color={Colors.white} />
            </View>
            <Text style={s.footerLogo}>Налоговик</Text>
          </View>
          <View style={s.footerLinksRow}>
            <Text style={s.footerLink}>Специалисты</Text>
            <Text style={s.footerLink}>Заявки</Text>
            <Text style={s.footerLink}>Условия</Text>
          </View>
        </View>
        <View style={s.footerDivider} />
        <Text style={s.footerCopy}>2026 Налоговик. Все права защищены.</Text>
      </View>
    </View>
  );
}

// --- Full Landing Page ---

interface LandingPageProps {
  specialistsLoading?: boolean;
  specialistsError?: boolean;
  formPrefill?: FormProps;
}

function LandingPage({ specialistsLoading, specialistsError, formPrefill }: LandingPageProps) {
  return (
    <View style={s.page}>
      <PublicHeader />
      <HeroSection />
      <HowItWorksSection />
      <ServicesSection />
      <FeaturedSpecialists loading={specialistsLoading} error={specialistsError} />
      <QuickRequestForm {...formPrefill} />
      <StatsSection />
      <FooterSection />
    </View>
  );
}

// --- Exported State Showcase ---

export function LandingStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="POPULATED" pageId="landing">
        <LandingPage />
      </StateSection>

      <StateSection title="LOADING" pageId="landing">
        <LandingPage specialistsLoading />
      </StateSection>

      <StateSection title="ERROR" pageId="landing">
        <LandingPage specialistsError />
      </StateSection>

      <StateSection title="PREFILLED" pageId="landing">
        <LandingPage
          formPrefill={{
            prefillCity: 'Москва',
            prefillFns: 'ИФНС №7',
            prefillService: 'Камеральная проверка',
          }}
        />
      </StateSection>
    </View>
  );
}

// --- Styles ---

const s = StyleSheet.create({
  page: { backgroundColor: Colors.bgPrimary },

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
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerLogoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerNav: { flexDirection: 'row', gap: Spacing.xl },
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
    backgroundColor: Colors.textPrimary,
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
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 36,
  },
  heroTitleDesktop: {
    fontSize: Typography.fontSize.display,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    maxWidth: 500,
  },
  heroSearchRow: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    width: '100%',
    maxWidth: 480,
  },
  heroSearchRowDesktop: {
    flexDirection: 'row',
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
    height: 48,
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
    gap: Spacing.sm,
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing.xl,
  },
  heroSearchBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  heroStat: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: Typography.fontWeight.medium,
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
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
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
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
    marginTop: -Spacing.xs,
  },

  // Steps
  stepsRow: { gap: Spacing.lg, marginTop: Spacing.md },
  stepsRowDesktop: { flexDirection: 'row' },
  stepCard: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  stepNumRow: { alignItems: 'center' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  stepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  stepDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Services
  servicesGrid: { gap: Spacing.md, marginTop: Spacing.md },
  servicesGridDesktop: { flexDirection: 'row' },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  serviceDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Specialists
  specialistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  specialistsGridDesktop: { gap: Spacing.lg },
  specialistCard: {
    width: 200,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  specialistAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: Spacing.xs },
  specialistName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  specialistChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  chipLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
  },
  chipLocationText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  chipFns: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: Colors.statusBg.neutral },
  chipFnsText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  specialistServicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center', marginTop: 2 },
  chipService: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.borderLight },
  chipServiceText: { fontSize: 10, color: Colors.textSecondary },
  allSpecialistsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  allSpecialistsText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },

  // Skeleton
  skeletonCard: { opacity: 0.6 },
  skeletonAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary, marginBottom: Spacing.xs },
  skeletonLine: { width: '80%', height: 12, borderRadius: 4, backgroundColor: Colors.bgSecondary, marginVertical: 3 },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.statusBg.error,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: Spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.statusError },
  retryBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn, backgroundColor: Colors.statusError },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Form
  formCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
    ...Shadows.sm,
  },
  formLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  formInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    backgroundColor: Colors.bgPrimary,
    overflow: 'hidden',
  },
  formInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    // @ts-ignore web-only
    outlineStyle: 'none' as any,
  },
  formChipsScroll: { gap: Spacing.sm, paddingVertical: 2 },
  formChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  formChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  formChipText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  formChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.medium },
  serviceRadioGroup: { gap: Spacing.sm },
  serviceRadioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 3 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: Colors.brandPrimary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brandPrimary },
  serviceRadioLabel: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  formTextArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
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
  formSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    marginTop: Spacing.xs,
  },
  formSubmitText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing['2xl'],
  },
  statsRowDesktop: { gap: Spacing['4xl'] },
  statItem: { alignItems: 'center', gap: 4, minWidth: 80 },
  statValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  // Footer
  footer: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  footerInner: { maxWidth: 960, width: '100%', alignSelf: 'center', gap: Spacing.lg },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  footerLogoIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  footerLinksRow: { flexDirection: 'row', gap: Spacing.xl },
  footerLink: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.5)' },
  footerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  footerCopy: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
});
