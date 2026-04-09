import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { StateSection } from '../StateSection';
import { ProtoPlaceholderImage } from '../ProtoPlaceholderImage';

const BRAND = {
  primary: '#0F2447',
  action: '#1A5BA8',
  accent: '#D4A843',
  bg: '#F4F8FC',
  card: '#FFFFFF',
  textPrimary: '#0F2447',
  textSecondary: '#4A6B88',
  textMuted: '#6B8299',
  border: '#D6E2F0',
  error: '#B91C1C',
  errorBg: '#FEF2F2',
  successBg: '#F0FDF4',
  success: '#16A34A',
};

const CITIES = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Казань', 'Новосибирск', 'Краснодар'];

const FNS_MAP: Record<string, string[]> = {
  'Москва': ['ФНС №1', 'ФНС №5', 'ФНС №12', 'ФНС №18', 'ФНС №24'],
  'Санкт-Петербург': ['ФНС №2', 'ФНС №7', 'ФНС №15'],
  'Екатеринбург': ['ФНС №3', 'ФНС №9', 'ФНС №11'],
  'Казань': ['ФНС №4', 'ФНС №6'],
  'Новосибирск': ['ФНС №1', 'ФНС №8', 'ФНС №14'],
  'Краснодар': ['ФНС №2', 'ФНС №10'],
};

const SPECIALISTS = [
  { name: 'Алексей Петров', spec: 'Камеральные проверки', rating: 4.9, city: 'Москва', color: '#E8F0FE' },
  { name: 'Мария Иванова', spec: 'Налоговый аудит', rating: 4.8, city: 'Санкт-Петербург', color: '#FEF3E2' },
  { name: 'Дмитрий Козлов', spec: 'ФНС споры', rating: 4.7, city: 'Екатеринбург', color: '#E8F5E9' },
  { name: 'Елена Соколова', spec: 'Оптимизация налогов', rating: 4.9, city: 'Казань', color: '#F3E8FE' },
  { name: 'Артём Волков', spec: 'Бухгалтерский учёт', rating: 4.6, city: 'Новосибирск', color: '#FEE8E8' },
];

// --- Subcomponents ---

function Nav() {
  return (
    <View style={s.nav}>
      <View style={s.navLeft}>
        <Feather name="briefcase" size={20} color={BRAND.accent} />
        <Text style={s.logoText}>Налоговик</Text>
      </View>
      <View style={s.navLinks}>
        <Text style={s.navLink}>Специалисты</Text>
        <Text style={s.navLink}>Тарифы</Text>
        <View style={s.loginBtn}>
          <Feather name="log-in" size={14} color="#FFF" />
          <Text style={s.loginBtnText}>Войти</Text>
        </View>
      </View>
    </View>
  );
}

function Hero() {
  return (
    <View style={s.hero}>
      <Nav />
      <View style={s.heroContent}>
        <View style={s.heroIllustrationWrap}>
          <ProtoPlaceholderImage type="illustration" height={140} label="Hero illustration" borderRadius={12} />
        </View>
        <Text style={s.heroTitle}>Найдите налогового{'\n'}специалиста</Text>
        <Text style={s.heroSubtitle}>
          Квалифицированные налоговые консультанты, бухгалтеры и юристы в вашем городе
        </Text>
        <View style={s.heroCta}>
          <Pressable style={s.heroBtn}>
            <Feather name="search" size={16} color="#FFF" />
            <Text style={s.heroBtnText}>Найти специалиста</Text>
          </Pressable>
          <Pressable style={s.heroBtnOutline}>
            <Feather name="user-check" size={16} color="#FFF" />
            <Text style={s.heroBtnOutlineText}>Я специалист</Text>
          </Pressable>
        </View>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>189</Text>
            <Text style={s.statLabel}>Специалистов</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>3 400+</Text>
            <Text style={s.statLabel}>Заявок</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>4.7</Text>
            <Text style={s.statLabel}>Средняя оценка</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Features() {
  const items: { icon: 'search' | 'shield' | 'message-circle' | 'star'; title: string; desc: string }[] = [
    { icon: 'search', title: 'Умный поиск', desc: 'Найдите специалиста по городу, услуге и бюджету за минуты' },
    { icon: 'shield', title: 'Верификация', desc: 'Все специалисты проверены через базы ФНС и реестры' },
    { icon: 'message-circle', title: 'Прямая связь', desc: 'Безопасный чат со специалистом прямо на платформе' },
    { icon: 'star', title: 'Честные отзывы', desc: 'Реальные оценки и отзывы от проверенных клиентов' },
  ];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Почему Налоговик?</Text>
      <View style={s.featureGrid}>
        {items.map((item) => (
          <View key={item.title} style={s.featureCard}>
            <ProtoPlaceholderImage type="illustration" height={64} borderRadius={8} />
            <View style={s.featureIconWrap}>
              <Feather name={item.icon} size={22} color={BRAND.action} />
            </View>
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
    { num: '1', title: 'Создайте заявку', desc: 'Опишите задачу, укажите город и отделение ФНС' },
    { num: '2', title: 'Получите отклики', desc: 'Проверенные специалисты предложат свои условия' },
    { num: '3', title: 'Выберите лучшего', desc: 'Сравните рейтинг, цены и опыт' },
  ];
  return (
    <View style={[s.section, { backgroundColor: BRAND.bg }]}>
      <Text style={s.sectionTitle}>Как это работает</Text>
      <View style={s.stepsContainer}>
        {steps.map((step, i) => (
          <View key={step.num} style={s.stepRow}>
            <View style={s.stepNumCircle}>
              <Text style={s.stepNumText}>{step.num}</Text>
            </View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
            {i < steps.length - 1 && <View style={s.stepLine} />}
          </View>
        ))}
      </View>
    </View>
  );
}

function SpecialistsCarousel() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Лучшие специалисты</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.carouselContent}>
        {SPECIALISTS.map((sp) => (
          <View key={sp.name} style={s.specCard}>
            <ProtoPlaceholderImage type="avatar" height={56} />
            <Text style={s.specName}>{sp.name}</Text>
            <Text style={s.specSpec}>{sp.spec}</Text>
            <View style={s.specRatingRow}>
              <Feather name="star" size={13} color={BRAND.accent} />
              <Text style={s.specRating}>{sp.rating}</Text>
            </View>
            <View style={s.specCityRow}>
              <Feather name="map-pin" size={12} color={BRAND.textMuted} />
              <Text style={s.specCity}>{sp.city}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

interface RequestFormProps {
  prefill?: {
    city?: string;
    fns?: string;
    description?: string;
    email?: string;
    name?: string;
  };
  errors?: { email?: boolean };
  submitted?: boolean;
}

function RequestForm({ prefill, errors, submitted }: RequestFormProps) {
  const [city, setCity] = useState(prefill?.city || '');
  const [fns, setFns] = useState(prefill?.fns || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [email, setEmail] = useState(prefill?.email || '');
  const [name, setName] = useState(prefill?.name || '');

  const fnsOptions = city ? (FNS_MAP[city] || []) : [];

  if (submitted) {
    return (
      <View style={s.section}>
        <View style={s.successOverlay}>
          <View style={s.successIconCircle}>
            <Feather name="check-circle" size={40} color={BRAND.success} />
          </View>
          <Text style={s.successTitle}>Заявка отправлена</Text>
          <Text style={s.successText}>
            Код подтверждения отправлен на {email || 'your@email.com'}
          </Text>
          <Text style={s.successHint}>Проверьте вашу почту</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.section, { backgroundColor: BRAND.bg }]}>
      <Text style={s.sectionTitle}>Оставить заявку</Text>
      <View style={s.formCard}>
        {/* City */}
        <Text style={s.formLabel}>Город</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              style={[s.chip, city === c && s.chipActive]}
              onPress={() => { setCity(c); setFns(''); }}
            >
              <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* FNS offices */}
        {fnsOptions.length > 0 && (
          <View style={s.fnsBlock}>
            <Text style={s.formLabel}>Отделение ФНС</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
              {fnsOptions.map((f) => (
                <Pressable
                  key={f}
                  style={[s.chip, fns === f && s.chipActive]}
                  onPress={() => setFns(f)}
                >
                  <Text style={[s.chipText, fns === f && s.chipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        <Text style={s.formLabel}>Опишите вашу задачу</Text>
        <TextInput
          style={s.formTextArea}
          multiline
          numberOfLines={4}
          placeholder="Например: нужна помощь с камеральной проверкой за 2025 год..."
          placeholderTextColor={BRAND.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        {/* Name */}
        <Text style={s.formLabel}>Ваше имя</Text>
        <TextInput
          style={s.formInput}
          placeholder="Иван Иванов"
          placeholderTextColor={BRAND.textMuted}
          value={name}
          onChangeText={setName}
        />

        {/* Email */}
        <Text style={s.formLabel}>Email</Text>
        <TextInput
          style={[s.formInput, errors?.email && s.formInputError]}
          placeholder="your@email.com"
          placeholderTextColor={BRAND.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {errors?.email && (
          <View style={s.errorRow}>
            <Feather name="alert-circle" size={13} color={BRAND.error} />
            <Text style={s.errorText}>Введите корректный email</Text>
          </View>
        )}

        {/* Submit */}
        <Pressable style={s.submitBtn}>
          <Feather name="send" size={16} color="#FFF" />
          <Text style={s.submitBtnText}>Отправить заявку</Text>
        </Pressable>

        <View style={s.noteRow}>
          <Feather name="info" size={13} color={BRAND.textMuted} />
          <Text style={s.noteText}>После отправки вам придёт код подтверждения на email</Text>
        </View>
      </View>
    </View>
  );
}

function FooterSection() {
  return (
    <View style={s.footer}>
      <View style={s.footerTop}>
        <View style={s.footerLogoRow}>
          <Feather name="briefcase" size={18} color={BRAND.accent} />
          <Text style={s.footerLogo}>Налоговик</Text>
        </View>
        <View style={s.footerLinksRow}>
          <Text style={s.footerLink}>О сервисе</Text>
          <Text style={s.footerLink}>Специалисты</Text>
          <Text style={s.footerLink}>Тарифы</Text>
          <Text style={s.footerLink}>Контакты</Text>
        </View>
      </View>
      <View style={s.footerDivider} />
      <Text style={s.footerCopy}>2026 Налоговик. Все права защищены.</Text>
    </View>
  );
}

// --- Full Landing ---

function FullLanding(props: RequestFormProps) {
  return (
    <View style={s.page}>
      <Hero />
      <Features />
      <HowItWorks />
      <SpecialistsCarousel />
      <RequestForm {...props} />
      <FooterSection />
    </View>
  );
}

// --- Exported State Showcase ---

export function LandingStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="DEFAULT" pageId="landing">
        <FullLanding />
      </StateSection>

      <StateSection title="FORM_FILLING" pageId="landing">
        <FullLanding
          prefill={{
            city: 'Москва',
            fns: 'ФНС №5',
            description: 'Нужна помощь с камеральной проверкой за 2025 год. Получил требование из налоговой.',
          }}
        />
      </StateSection>

      <StateSection title="FORM_VALIDATION" pageId="landing">
        <FullLanding
          prefill={{
            city: 'Санкт-Петербург',
            fns: 'ФНС №7',
            description: 'Налоговый аудит ООО',
            name: 'Иван',
          }}
          errors={{ email: true }}
        />
      </StateSection>

      <StateSection title="FORM_SUCCESS" pageId="landing">
        <FullLanding
          prefill={{ email: 'ivan@example.com' }}
          submitted
        />
      </StateSection>
    </View>
  );
}

// --- Styles ---

const s = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
  },

  // Nav
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  navLink: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loginBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFF',
  },

  // Hero
  hero: {
    backgroundColor: BRAND.primary,
  },
  heroContent: {
    padding: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  heroIllustrationWrap: {
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  heroCta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: BRAND.action,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
  },
  heroBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFF',
  },
  heroBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroBtnOutlineText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // Sections
  section: {
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    color: BRAND.textPrimary,
    textAlign: 'center',
  },

  // Features
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: Spacing.sm,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#EBF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textPrimary,
  },
  featureDesc: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textSecondary,
    lineHeight: 20,
  },

  // How It Works
  stepsContainer: {
    gap: 0,
    paddingHorizontal: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
    position: 'relative',
    paddingBottom: Spacing['2xl'],
  },
  stepNumCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.action,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepNumText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
  },
  stepContent: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textPrimary,
  },
  stepDesc: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textSecondary,
    lineHeight: 20,
  },
  stepLine: {
    position: 'absolute',
    left: 19,
    top: 44,
    bottom: 0,
    width: 2,
    backgroundColor: '#D6E2F0',
  },

  // Specialists
  carouselContent: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  specCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    gap: 6,
  },
  specAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  specName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textPrimary,
    textAlign: 'center',
  },
  specSpec: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.textSecondary,
    textAlign: 'center',
  },
  specRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specRating: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textPrimary,
  },
  specCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specCity: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.textMuted,
  },

  // Request Form
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: Spacing.md,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textPrimary,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: BRAND.action,
    borderColor: BRAND.action,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.medium,
  },
  fnsBlock: {
    gap: Spacing.sm,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: BRAND.textPrimary,
    backgroundColor: '#FAFCFF',
  },
  formInputError: {
    borderColor: BRAND.error,
    borderWidth: 2,
    backgroundColor: BRAND.errorBg,
  },
  formTextArea: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: BRAND.textPrimary,
    backgroundColor: '#FAFCFF',
    textAlignVertical: 'top',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.error,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: BRAND.action,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  submitBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFF',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.textMuted,
    flex: 1,
  },

  // Success
  successOverlay: {
    alignItems: 'center',
    padding: Spacing['3xl'],
    gap: Spacing.md,
    backgroundColor: BRAND.successBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: BRAND.textPrimary,
  },
  successText: {
    fontSize: Typography.fontSize.base,
    color: BRAND.textSecondary,
    textAlign: 'center',
  },
  successHint: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textMuted,
  },

  // Footer
  footer: {
    backgroundColor: BRAND.primary,
    padding: Spacing['2xl'],
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
    color: '#FFF',
  },
  footerLinksRow: {
    gap: Spacing.sm,
    alignItems: 'flex-end',
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
