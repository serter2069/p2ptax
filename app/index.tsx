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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Typography, BorderRadius, Spacing, Shadows } from '../constants/Colors';
import { api } from '../lib/api';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

const BRAND = {
  primary: '#1B2E4A',
  accent: '#0EA5E9',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  textDark: '#111827',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  bgWhite: '#FFFFFF',
  bgLight: '#F9FAFB',
  bgCard: '#F3F4F6',
  border: '#E5E7EB',
};

const CITIES = [
  'Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск',
  'Краснодар', 'Нижний Новгород', 'Самара', 'Ростов-на-Дону', 'Уфа',
  'Челябинск', 'Воронеж', 'Пермь', 'Волгоград', 'Красноярск', 'Омск',
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
  'Челябинск': ['ИФНС №3', 'ИФНС №8'],
  'Воронеж': ['ИФНС №2', 'ИФНС №5'],
  'Пермь': ['ИФНС №1', 'ИФНС №6'],
  'Волгоград': ['ИФНС №3', 'ИФНС №7'],
  'Красноярск': ['ИФНС №2', 'ИФНС №9'],
  'Омск': ['ИФНС №1', 'ИФНС №4'],
};

const SERVICE_OPTIONS = ['Камеральная проверка', 'Выездная проверка', 'Оперативный контроль', 'Не знаю'] as const;

export default function LandingScreen() {
  const router = useRouter();
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const [specialistsError, setSpecialistsError] = useState(false);
  const [stats, setStats] = useState<{ specialistsCount: number; ifnsCount: number; requestsCount: number } | null>(null);

  const [formCity, setFormCity] = useState('');
  const [formFns, setFormFns] = useState('');
  const [formService, setFormService] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    api.get<any[]>('/specialists/featured?limit=50')
      .then(setSpecialists)
      .catch(() => setSpecialistsError(true))
      .finally(() => setSpecialistsLoading(false));
    api.get<{ specialistsCount: number; ifnsCount: number; requestsCount: number }>('/stats/landing')
      .then(setStats)
      .catch(() => {});
  }, []);

  const fnsOptions = formCity ? (FNS_MAP[formCity] || []) : [];

  return (
    <SafeAreaView style={s.safe}>
      <Stack.Screen options={{ title: 'Налоговик — найдите налогового специалиста' }} />
      <Head>
        <title>Налоговик — найдите налогового специалиста</title>
        <meta name="description" content="Подбираем специалиста по вашей ИФНС и конкретной ситуации. Выездная проверка, камеральная, вычеты, споры — только тот, кто знает именно ваш вопрос." />
        <meta property="og:title" content="Налоговик — найдите налогового специалиста" />
        <meta property="og:description" content="Подбираем специалиста по вашей ИФНС и конкретной ситуации. Выездная проверка, камеральная, вычеты, споры — только тот, кто знает именно ваш вопрос." />
        <meta property="og:url" content={APP_URL} />
      </Head>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ===== Header ===== */}
        <View style={s.header}>
          <View style={s.headerInner}>
            <Pressable style={s.headerLogoRow} onPress={() => router.push('/')}>
              <Feather name="briefcase" size={20} color={BRAND.accent} />
              <Text style={s.headerLogoText}>Налоговик</Text>
            </Pressable>
            <View style={s.headerNav}>
              <Pressable onPress={() => router.push('/specialists')}>
                <Text style={s.headerNavLink}>Специалисты</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/requests')}>
                <Text style={s.headerNavLink}>Заявки</Text>
              </Pressable>
              <Text style={s.headerNavLink}>Тарифы</Text>
            </View>
            <Pressable style={s.headerLoginBtn} onPress={() => router.push('/(auth)/email')}>
              <Text style={s.headerLoginText}>Войти</Text>
            </Pressable>
          </View>
        </View>

        {/* ===== Hero ===== */}
        <View style={s.hero}>
          <View style={s.heroInner}>
            <Text style={s.heroTitle}>{'Найдите специалиста\nв вашей налоговой'}</Text>
            <Text style={s.heroSubtitle}>
              Консультанты, которые знают вашу инспекцию изнутри — камеральные и выездные проверки, оперативный контроль
            </Text>
            <View style={s.heroSearchRow}>
              <View style={s.heroSearchInputWrap}>
                <Feather name="map-pin" size={18} color={BRAND.textLight} style={{ marginLeft: 14 }} />
                <TextInput
                  style={s.heroSearchInput}
                  placeholder="Введите город..."
                  placeholderTextColor={BRAND.textLight}
                />
              </View>
              <Pressable style={s.heroSearchBtn} onPress={() => router.push('/specialists')}>
                <Feather name="search" size={18} color={BRAND.bgWhite} />
                <Text style={s.heroSearchBtnText}>Найти специалиста</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ===== How it works ===== */}
        <View style={s.section}>
          <View style={s.sectionInner}>
            <Text style={s.sectionTitle}>Как это работает</Text>
            <View style={s.stepsRow}>
              {([
                { icon: 'map-pin' as const, title: 'Укажите ваш ФНС', desc: 'Выберите город и налоговую инспекцию' },
                { icon: 'file-text' as const, title: 'Опишите задачу', desc: 'Расскажите, с чем нужна помощь — камеральная проверка, выездная или оперативный контроль' },
                { icon: 'message-circle' as const, title: 'Получите отклик', desc: 'Специалист, который работает в вашем ФНС, свяжется с вами' },
              ]).map((step, i) => (
                <View key={step.title} style={s.stepCard}>
                  <View style={s.stepNumBadge}>
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </View>
                  <View style={s.stepIconWrap}>
                    <Feather name={step.icon} size={28} color={BRAND.accent} />
                  </View>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== Services ===== */}
        <View style={[s.section, { backgroundColor: BRAND.bgLight }]}>
          <View style={s.sectionInner}>
            <Text style={s.sectionTitle}>Наши услуги</Text>
            <View style={s.servicesGrid}>
              {([
                { icon: 'search' as const, title: 'Камеральная проверка', desc: 'Сопровождение проверки деклараций. Поможем подготовить документы и пройти проверку без штрафов.' },
                { icon: 'shield' as const, title: 'Выездная проверка', desc: 'Защита интересов при выездной проверке ФНС. Подготовка, присутствие, обжалование результатов.' },
                { icon: 'eye' as const, title: 'Отдел оперативного контроля', desc: 'Консультации по вопросам оперативного контроля. Проверка контрагентов, встречные проверки.' },
              ]).map((svc) => (
                <View key={svc.title} style={s.serviceCard}>
                  <View style={s.serviceIconWrap}>
                    <Feather name={svc.icon} size={24} color={BRAND.accent} />
                  </View>
                  <Text style={s.serviceTitle}>{svc.title}</Text>
                  <Text style={s.serviceDesc}>{svc.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== Featured Specialists ===== */}
        <View style={s.section}>
          <View style={s.sectionInner}>
            <Text style={s.sectionTitle}>Специалисты на платформе</Text>

            {specialistsError && (
              <View style={s.errorBanner}>
                <Feather name="alert-circle" size={18} color={BRAND.error} />
                <Text style={s.errorBannerText}>Не удалось загрузить специалистов</Text>
                <Pressable style={s.retryBtn} onPress={() => {
                  setSpecialistsError(false);
                  setSpecialistsLoading(true);
                  api.get<any[]>('/specialists/featured?limit=50')
                    .then(setSpecialists)
                    .catch(() => setSpecialistsError(true))
                    .finally(() => setSpecialistsLoading(false));
                }}>
                  <Text style={s.retryBtnText}>Повторить</Text>
                </Pressable>
              </View>
            )}

            {!specialistsError && (
              <View style={s.specialistsGrid}>
                {(specialistsLoading
                  ? [{ seed: 'sk1' }, { seed: 'sk2' }, { seed: 'sk3' }, { seed: 'sk4' }]
                  : specialists
                ).map((sp: any) => (
                  <Pressable
                    key={sp.seed || sp.nick || sp.id}
                    style={[s.specialistCard, specialistsLoading && s.skeletonCard]}
                    onPress={!specialistsLoading && sp.nick ? () => router.push(`/specialists/${sp.nick}` as any) : undefined}
                  >
                    {specialistsLoading ? (
                      <>
                        <View style={s.skeletonAvatar} />
                        <View style={s.skeletonLine} />
                        <View style={[s.skeletonLine, { width: '60%' }]} />
                        <View style={[s.skeletonLine, { width: '80%' }]} />
                      </>
                    ) : (
                      <>
                        {sp.avatarUrl ? (
                          <Image source={{ uri: sp.avatarUrl }} style={s.specialistAvatar} />
                        ) : (
                          <View style={[s.specialistAvatar, { backgroundColor: BRAND.bgCard, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={{ fontSize: 24, fontWeight: Typography.fontWeight.bold, color: BRAND.accent }}>
                              {(sp.displayName || sp.nick || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={s.specialistName}>{sp.displayName || sp.nick || ''}</Text>
                        <View style={s.specialistChipsRow}>
                          {sp.cities && sp.cities[0] && (
                            <View style={s.chipLocation}>
                              <Feather name="map-pin" size={12} color={BRAND.accent} />
                              <Text style={s.chipLocationText}>{sp.cities[0]}</Text>
                            </View>
                          )}
                          {sp.fns && (
                            <View style={s.chipFns}>
                              <Text style={s.chipFnsText}>{sp.fns}</Text>
                            </View>
                          )}
                        </View>
                        {sp.services && sp.services.length > 0 && (
                          <View style={s.specialistServicesRow}>
                            {sp.services.map((svc: string) => (
                              <View key={svc} style={s.chipService}>
                                <Text style={s.chipServiceText}>{svc}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {sp.createdAt && (
                          <Text style={s.specialistSince}>
                            На сайте с {new Date(sp.createdAt).getFullYear()} года
                          </Text>
                        )}
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {!specialistsError && !specialistsLoading && (
              <Pressable style={s.allSpecialistsLink} onPress={() => router.push('/specialists')}>
                <Text style={s.allSpecialistsText}>Все специалисты</Text>
                <Feather name="arrow-right" size={16} color={BRAND.accent} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ===== Quick Request Form ===== */}
        <View style={[s.section, { backgroundColor: BRAND.bgLight }]}>
          <View style={s.sectionInner}>
            <Text style={s.sectionTitle}>Оставьте заявку прямо сейчас</Text>
            <Text style={s.sectionSubtitle}>Бесплатно. Специалисты откликнутся в течение дня.</Text>

            <View style={s.formCard}>
              <Text style={s.formLabel}>Город</Text>
              <View style={s.formInputWrap}>
                <Feather name="map-pin" size={16} color={BRAND.textLight} style={{ marginLeft: 12 }} />
                <TextInput
                  style={s.formInput}
                  placeholder="Начните вводить город..."
                  placeholderTextColor={BRAND.textLight}
                  value={formCity}
                  onChangeText={(v) => { setFormCity(v); setFormFns(''); }}
                />
              </View>

              {fnsOptions.length > 0 && (
                <>
                  <Text style={s.formLabel}>Отделение ФНС</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.formChipsScroll}>
                    {fnsOptions.map((f) => (
                      <Pressable
                        key={f}
                        style={[s.formChip, formFns === f && s.formChipActive]}
                        onPress={() => setFormFns(f)}
                      >
                        <Text style={[s.formChipText, formFns === f && s.formChipTextActive]}>{f}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={s.formLabel}>Услуга</Text>
              <View style={s.serviceRadioGroup}>
                {SERVICE_OPTIONS.map((svc) => (
                  <Pressable
                    key={svc}
                    style={s.serviceRadioRow}
                    onPress={() => setFormService(svc)}
                  >
                    <View style={[s.radioOuter, formService === svc && s.radioOuterActive]}>
                      {formService === svc && <View style={s.radioInner} />}
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
                placeholderTextColor={BRAND.textLight}
                value={formDescription}
                onChangeText={setFormDescription}
              />

              <Pressable style={s.formSubmitBtn}>
                <Feather name="send" size={16} color={BRAND.bgWhite} />
                <Text style={s.formSubmitText}>Отправить заявку</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ===== Stats ===== */}
        <View style={s.section}>
          <View style={s.sectionInner}>
            <Text style={s.sectionTitle}>Налоговик в цифрах</Text>
            <View style={s.statsRow}>
              {[
                { value: stats ? `${stats.specialistsCount}+` : '...', label: 'специалистов' },
                { value: stats ? String(stats.ifnsCount) : '...', label: 'городов' },
                { value: stats ? `${stats.requestsCount}+` : '...', label: 'заявок' },
              ].map((stat) => (
                <View key={stat.label} style={s.statItem}>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== Footer ===== */}
        <View style={s.footer}>
          <View style={s.footerInner}>
            <View style={s.footerTop}>
              <View style={s.footerLogoRow}>
                <Feather name="briefcase" size={18} color={BRAND.accent} />
                <Text style={s.footerLogo}>Налоговик</Text>
              </View>
              <View style={s.footerLinksRow}>
                <Pressable onPress={() => router.push('/specialists')}>
                  <Text style={s.footerLink}>Специалисты</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/requests')}>
                  <Text style={s.footerLink}>Заявки</Text>
                </Pressable>
                <Text style={s.footerLink}>Условия использования</Text>
              </View>
            </View>
            <View style={s.footerDivider} />
            <Text style={s.footerCopy}>{`${new Date().getFullYear()} Налоговик. Все права защищены.`}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bgWhite,
  },
  scroll: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: BRAND.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
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
    color: BRAND.primary,
  },
  headerNav: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  headerNavLink: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textGray,
    fontWeight: Typography.fontWeight.medium,
  },
  headerLoginBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
    borderWidth: 1,
    borderColor: BRAND.accent,
  },
  headerLoginText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.accent,
  },

  hero: {
    backgroundColor: BRAND.primary,
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
    color: BRAND.bgWhite,
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
    backgroundColor: BRAND.bgWhite,
    borderRadius: BorderRadius.btn,
    overflow: 'hidden',
  },
  heroSearchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: BRAND.textDark,
    // @ts-ignore web-only
    outlineStyle: 'none' as any,
  },
  heroSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    backgroundColor: BRAND.accent,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing.xl,
  },
  heroSearchBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.bgWhite,
  },

  section: {
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor: BRAND.bgWhite,
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
    color: BRAND.textDark,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.base,
    color: BRAND.textGray,
    textAlign: 'center',
    marginTop: -Spacing.md,
  },

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
    backgroundColor: BRAND.bgWhite,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: BRAND.bgWhite,
  },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textDark,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },

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
    backgroundColor: BRAND.bgWhite,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textDark,
  },
  serviceDesc: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textGray,
    lineHeight: 20,
  },

  specialistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  specialistCard: {
    width: 210,
    backgroundColor: BRAND.bgWhite,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  specialistAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.xs,
  },
  specialistName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textDark,
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
    backgroundColor: '#EFF6FF',
  },
  chipLocationText: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.accent,
    fontWeight: Typography.fontWeight.medium,
  },
  chipFns: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: BRAND.bgCard,
  },
  chipFnsText: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.textGray,
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
    borderColor: BRAND.border,
  },
  chipServiceText: {
    fontSize: 10,
    color: BRAND.textGray,
  },
  specialistSince: {
    fontSize: Typography.fontSize.xs,
    color: BRAND.textLight,
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
    color: BRAND.accent,
  },

  skeletonCard: {
    opacity: 0.6,
  },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.bgCard,
    marginBottom: Spacing.xs,
  },
  skeletonLine: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    backgroundColor: BRAND.bgCard,
    marginVertical: 4,
  },

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
    color: BRAND.error,
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
    backgroundColor: BRAND.error,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.bgWhite,
  },

  formCard: {
    backgroundColor: BRAND.bgWhite,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: Spacing.lg,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    ...Shadows.sm,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.textDark,
  },
  formInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: BorderRadius.input,
    backgroundColor: BRAND.bgWhite,
    overflow: 'hidden',
  },
  formInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: BRAND.textDark,
    // @ts-ignore web-only
    outlineStyle: 'none' as any,
  },
  formChipsScroll: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  formChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.bgWhite,
  },
  formChipActive: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
  },
  formChipText: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textDark,
  },
  formChipTextActive: {
    color: BRAND.bgWhite,
    fontWeight: Typography.fontWeight.medium,
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
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: BRAND.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.accent,
  },
  serviceRadioLabel: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textDark,
  },
  formTextArea: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: BRAND.textDark,
    backgroundColor: BRAND.bgWhite,
    textAlignVertical: 'top',
    // @ts-ignore web-only
    outlineStyle: 'none' as any,
  },
  formSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: BRAND.accent,
    borderRadius: BorderRadius.btn,
  },
  formSubmitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: BRAND.bgWhite,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: BRAND.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: BRAND.textGray,
  },

  footer: {
    backgroundColor: BRAND.primary,
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
    color: BRAND.bgWhite,
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
