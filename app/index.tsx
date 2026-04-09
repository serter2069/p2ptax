import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Typography, BorderRadius, Colors, Spacing } from '../constants/Colors';
import { secureStorage } from '../stores/storage';
import { api } from '../lib/api';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { LandingHeader } from '../components/LandingHeader';
import { Button } from '../components/Button';
import { IfnsSearch } from '../components/IfnsSearch';

// ---- Components ----

const SERVICE_TYPES = [
  'Декларация 3-НДФЛ',
  'Спор с ФНС',
  'Налоговый вычет',
  'Оптимизация налогов',
  'Регистрация бизнеса',
  'Другое',
];

const TASK_SERVICE_TYPE_MAP: Record<string, string> = {
  'Декларация 3-НДФЛ': 'declaration',
  'Спор с налоговой инспекцией': 'dispute',
  'Оптимизация налогообложения': 'optimization',
  'Регистрация ИП или ООО': 'registration',
  'Налоговый вычет': 'deduction',
  'Проверка налоговых рисков': 'risk_check',
};

function QuickRequestForm() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Restore saved form data after auth redirect
  useEffect(() => {
    secureStorage.getItem('p2ptax_pending_request').then(saved => {
      if (saved) {
        try {
          const { description: d, serviceType: s } = JSON.parse(saved);
          if (d) setDescription(d);
          if (s) setServiceType(s);
        } catch {}
      }
    });
  }, []);

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
    const pending: Record<string, string> = {
      description: description.trim().slice(0, 500),
      serviceType,
      city: selectedIfns?.city?.name || '',
    };
    if (selectedIfns) {
      pending.ifnsId = selectedIfns.id;
      pending.ifnsName = selectedIfns.name;
    }
    await secureStorage.setItem('p2ptax_pending_request', JSON.stringify(pending));
    setSubmitted(true);
  };

  function handleNewRequest() {
    setDescription('');
    setSelectedIfns(null);
    setServiceType('');
    setError('');
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <View style={qrf.container}>
        <View style={qrf.successContainer}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.statusSuccess} />
          <Text style={qrf.successTitle}>Заявка отправлена!</Text>
          <Text style={qrf.successText}>Специалисты свяжутся с вами в ближайшее время.</Text>
          <View style={qrf.successButtons}>
            <TouchableOpacity style={qrf.btn} onPress={() => router.push('/(auth)/email')} activeOpacity={0.85}>
              <Text style={qrf.btnText}>Войти и отслеживать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[qrf.btn, qrf.btnSecondary]} onPress={handleNewRequest} activeOpacity={0.85}>
              <Text style={[qrf.btnText, qrf.btnTextSecondary]}>Подать новую заявку</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={qrf.container}>
      <Text style={qrf.title}>Быстрый запрос</Text>

      <Text style={qrf.label}>Тип услуги</Text>
      <View style={qrf.cityRow}>
        {SERVICE_TYPES.map((st) => (
          <TouchableOpacity
            key={st}
            style={[qrf.cityChip, serviceType === st && qrf.cityChipSelected]}
            onPress={() => setServiceType(st)}
          >
            <Text style={[qrf.cityChipText, serviceType === st && qrf.cityChipTextSelected]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={qrf.label}>Описание</Text>
      <TextInput
        testID="quick-request-description"
        style={qrf.input}
        placeholder="Нужна помощь с налоговой декларацией..."
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      <Text style={qrf.label}>Налоговая инспекция (необязательно)</Text>
      <IfnsSearch
        selected={selectedIfns}
        onSelect={setSelectedIfns}
        placeholder="Введите номер или название ИФНС..."
      />

      {error ? <Text style={qrf.error}>{error}</Text> : null}
      <TouchableOpacity testID="quick-request-submit" style={qrf.btn} onPress={handleSubmit} activeOpacity={0.85}>
        <Text style={qrf.btnText}>Найти специалиста →</Text>
      </TouchableOpacity>
    </View>
  );
}

const qrf = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.base,
  },
  cityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
    minHeight: 44,
    justifyContent: 'center',
  },
  cityChipSelected: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  cityChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  cityChipTextSelected: {
    color: Colors.white,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  customCityInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.sm,
  },
  error: {
    color: Colors.statusError,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  btn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  btnText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
  btnTextSecondary: {
    color: Colors.brandPrimary,
  },
  successContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successButtons: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});


// ---- Skeleton Components ----

function SkeletonPulse({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

function SkeletonCard({ width, height }: { width: number | string; height: number }) {
  return (
    <SkeletonPulse>
      <View style={{ width: width as any, height, backgroundColor: Colors.textMuted, borderRadius: 8 }} />
    </SkeletonPulse>
  );
}

function SkeletonChip() {
  return (
    <SkeletonPulse>
      <View style={{ width: 80, height: 32, backgroundColor: Colors.textMuted, borderRadius: 16 }} />
    </SkeletonPulse>
  );
}

// ---- Main ----

export default function LandingScreen() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [heroImageError, setHeroImageError] = React.useState(false);
  const [featuredSpecialists, setFeaturedSpecialists] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  useEffect(() => {
    api.get<any[]>('/specialists/featured?limit=8').then(setFeaturedSpecialists).catch((err) => console.warn('Landing section failed (featured specialists):', err)).finally(() => setIsLoadingSpecialists(false));
    api.get<any[]>('/requests/recent?limit=5').then(setRecentRequests).catch((err) => console.warn('Landing section failed (recent requests):', err)).finally(() => setIsLoadingRequests(false));
  }, []);

  const isWide = !isMobile;
  const sectionMaxWidth: number | '100%' = isDesktop ? 1200 : isTablet ? 900 : '100%';
  const sectionPadding = isMobile ? 20 : 40;

  const innerStyle = {
    maxWidth: sectionMaxWidth as any,
    paddingHorizontal: sectionPadding,
    width: '100%' as const,
    alignSelf: 'center' as const,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Налоговик — найдите налогового специалиста' }} />
      <Head>
        <title>Налоговик — найдите налогового специалиста</title>
        <meta name="description" content="Налоговые консультанты и юристы в вашем городе. Опишите задачу бесплатно и получите предложения от проверенных специалистов." />
        <meta property="og:title" content="Налоговик — найдите налогового специалиста" />
        <meta property="og:description" content="Налоговые консультанты и юристы в вашем городе. Опишите задачу бесплатно и получите предложения от проверенных специалистов." />
        <meta property="og:url" content={APP_URL} />
      </Head>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Navigation Header ===== */}
        <LandingHeader />

        {/* ===== SECTION 1: Hero ===== */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroContent,
              innerStyle,
              isWide && styles.heroContentWide,
            ]}
          >
            <View style={[styles.heroLeft, isWide && styles.heroLeftWide]}>
              <Text
                style={[styles.heroTitle, isWide && styles.heroTitleWide]}
                accessibilityRole="header"
                aria-level={1}
              >
                {'\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0441 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u043E\u0439?\n\u041D\u0430\u0439\u0434\u0451\u043C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430 \u0437\u0430 1 \u0447\u0430\u0441'}
              </Text>
              <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
                {'\u042E\u0440\u0438\u0441\u0442\u044B \u0438 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0435 \u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u043D\u0442\u044B \u0432 \u0432\u0430\u0448\u0435\u043C \u0433\u043E\u0440\u043E\u0434\u0435. \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0439\u0442\u0065 \u0437\u0430\u043F\u0440\u043E\u0441 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u2014 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043E\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0445 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432'}
              </Text>

              <View style={[styles.heroCtas, isWide && styles.heroCtasWide]}>
                <Button
                  onPress={() => router.push('/specialists')}
                  variant="primary"
                  style={!isWide ? { width: '100%', minHeight: 52 } : { minWidth: 220, maxWidth: 260 }}
                >{'\u041D\u0430\u0439\u0442\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430'}</Button>
                <Button
                  onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                  variant="outline"
                  style={!isWide ? { alignSelf: 'center' } : { minWidth: 200, maxWidth: 260 }}
                >{'\u042F \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442'}</Button>
              </View>
            </View>

            {isWide ? (
              <View style={[styles.heroRight, styles.heroRightWide]}>
                {heroImageError ? (
                  <View style={[styles.heroImage, styles.heroImageWide, styles.heroImageFallback]} />
                ) : (
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80' }}
                    style={[styles.heroImage, styles.heroImageWide]}
                    resizeMode="cover"
                    onError={() => setHeroImageError(true)}
                    accessibilityLabel="Налоговый консультант за работой"
                  />
                )}
              </View>
            ) : (
              <View style={styles.heroRight}>
                {heroImageError ? (
                  <View style={[styles.heroImage, styles.heroImageFallback]} />
                ) : (
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80' }}
                    style={styles.heroImage}
                    resizeMode="cover"
                    onError={() => setHeroImageError(true)}
                    accessibilityLabel="Налоговый консультант за работой"
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* ===== Quick Request Form Section ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgSecondary, paddingVertical: 48 }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <QuickRequestForm />
          </View>
        </View>

        {/* ===== SECTION 2: Early launch banner ===== */}
        <View style={styles.statsSection}>
          <View style={[styles.statsInner, innerStyle]}>
            <View style={styles.launchBanner}>
              <Text style={styles.launchBannerText}>
                {'Первые специалисты уже на платформе \u2014 присоединяйтесь!'}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/specialists')}
                activeOpacity={0.8}
                style={styles.launchBannerBtn}
              >
                <Text style={styles.launchBannerBtnLabel}>{'\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== SECTION 2b: Featured Specialists ===== */}
        {isLoadingSpecialists && (
          <View style={[styles.section, { backgroundColor: Colors.bgPrimary, paddingVertical: 40 }]}>
            <View style={[styles.sectionInner, innerStyle]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, flexDirection: 'row' }}>
                <SkeletonCard width={160} height={100} />
                <SkeletonCard width={160} height={100} />
                <SkeletonCard width={160} height={100} />
              </ScrollView>
            </View>
          </View>
        )}
        {!isLoadingSpecialists && featuredSpecialists.length > 0 && (
          <View style={[styles.section, { backgroundColor: Colors.bgPrimary }]}>
            <View style={[styles.sectionInner, innerStyle]}>
              <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u044B'}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dyn.specialistsRow}
              >
                {featuredSpecialists.map((s: any) => (
                  <TouchableOpacity
                    key={s.id}
                    style={dyn.specialistCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/specialists/${s.nick}` as any)}
                  >
                    <Text style={dyn.specialistName} numberOfLines={1}>{s.name || s.nick}</Text>
                    {s.city ? <Text style={dyn.specialistCity} numberOfLines={1}>{s.city}</Text> : null}
                    {s.specialization ? (
                      <View style={dyn.specialistChip}>
                        <Text style={dyn.specialistChipText} numberOfLines={1}>{s.specialization}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {isMobile && featuredSpecialists.length > 1 && (
                <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  {'← Свайп для просмотра →'}
                </Text>
              )}
              <TouchableOpacity onPress={() => router.push('/specialists')} activeOpacity={0.8} style={dyn.seeAllBtn}>
                <Text style={dyn.seeAllText}>{'\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432\u0441\u0435\u0445 \u2192'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== SECTION 2c: Recent Requests ===== */}
        {isLoadingRequests && (
          <View style={[styles.section, { backgroundColor: Colors.bgSecondary, paddingVertical: 40 }]}>
            <View style={[styles.sectionInner, innerStyle]}>
              <View style={{ width: '100%', gap: 12 }}>
                <SkeletonCard width="100%" height={60} />
                <SkeletonCard width="100%" height={60} />
              </View>
            </View>
          </View>
        )}
        {!isLoadingRequests && recentRequests.length > 0 && (
          <View style={[styles.section, { backgroundColor: Colors.bgSecondary }]}>
            <View style={[styles.sectionInner, innerStyle]}>
              <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B'}</Text>
              <View style={dyn.requestsList}>
                {recentRequests.map((req: any) => (
                  <TouchableOpacity
                    key={req.id}
                    style={dyn.requestItem}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/requests/${req.id}` as any)}
                  >
                    <View style={dyn.requestLeft}>
                      <Text style={dyn.requestTitle} numberOfLines={2}>{req.title || req.description}</Text>
                      {req.city ? <Text style={dyn.requestCity}>{req.city}</Text> : null}
                    </View>
                    {req.budget ? (
                      <Text style={dyn.requestBudget}>{req.budget.toLocaleString('ru-RU')}{' \u20BD'}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => router.push('/requests')} activeOpacity={0.8} style={dyn.seeAllBtn}>
                <Text style={dyn.seeAllText}>{'\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432\u0441\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B \u2192'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!isLoadingRequests && recentRequests.length === 0 && (
          <View style={[styles.section, { backgroundColor: Colors.bgSecondary }]}>
            <View style={[styles.sectionInner, innerStyle]}>
              <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B'}</Text>
              <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 400 }}>
                {'\u0411\u0443\u0434\u044C\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u043C! \u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u0435 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043E\u0442\u043A\u043B\u0438\u043A\u0438 \u043E\u0442 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432.'}
              </Text>
              <Button
                onPress={() => router.push('/(auth)/email?redirectTo=%2F(dashboard)%2Fmy-requests%2Fnew')}
                variant="primary"
                style={{ marginTop: Spacing.sm }}
              >{'\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441'}</Button>
            </View>
          </View>
        )}

        {/* Popular Cities section removed — replaced by IFNS search */}

        {/* ===== SECTION 3: How it works ===== */}
        <View nativeID="how-it-works" style={[styles.section, { backgroundColor: Colors.bgCard }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u041A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442'}</Text>

            <View style={[styles.stepsRow, isWide && styles.stepsRowWide]}>
              {[
                { num: '1', title: '\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443', desc: '\u0427\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0441\u0434\u0435\u043B\u0430\u0442\u044C, \u0441\u0440\u043E\u043A, \u0431\u044E\u0434\u0436\u0435\u0442' },
                { num: '2', title: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043E\u0442\u043A\u043B\u0438\u043A\u0438', desc: '\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u044B \u0438\u0437 \u0432\u0430\u0448\u0435\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430 \u043F\u0440\u0438\u0448\u043B\u044E\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F' },
                { num: '3', title: '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438 \u043F\u043B\u0430\u0442\u0438\u0442\u0435', desc: '\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0430\u044F \u0441\u0434\u0435\u043B\u043A\u0430, \u0434\u0435\u043D\u044C\u0433\u0438 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u044F\u0442 \u043F\u043E\u0441\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F' },
              ].map((step, idx, arr) => (
                <React.Fragment key={step.num}>
                  {idx > 0 && isWide && (
                    <View style={{ justifyContent: 'center', paddingBottom: 24 }}>
                      <Ionicons name="arrow-forward" size={24} color={Colors.border} />
                    </View>
                  )}
                  <View style={[styles.stepItem, isWide && styles.stepItemWide]}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumberText}>{step.num}</Text>
                    </View>
                    <View style={styles.stepTextBlock}>
                      <Text style={[styles.stepTitle, !isWide && { textAlign: 'center' as const }]}>{step.title}</Text>
                      <Text style={[styles.stepDesc, !isWide && { textAlign: 'center' as const }]}>{step.desc}</Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 4: Typical tasks ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgPrimary }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u0422\u0438\u043F\u0438\u0447\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438'}</Text>
            <Text style={styles.sectionSubtitle}>{'\u0427\u0442\u043E \u0440\u0435\u0448\u0430\u0435\u0442 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430'}</Text>

            <View style={[styles.tasksGrid, isDesktop && styles.tasksGridDesktop, isTablet && styles.tasksGridTablet]}>
              {[
                '\u0414\u0435\u043A\u043B\u0430\u0440\u0430\u0446\u0438\u044F 3-\u041D\u0414\u0424\u041B',
                '\u0421\u043F\u043E\u0440 \u0441 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u043E\u0439 \u0438\u043D\u0441\u043F\u0435\u043A\u0446\u0438\u0435\u0439',
                '\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0430\u043B\u043E\u0433\u043E\u043E\u0431\u043B\u043E\u0436\u0435\u043D\u0438\u044F',
                '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0418\u041F \u0438\u043B\u0438 \u041E\u041E\u041E',
                '\u041D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0439 \u0432\u044B\u0447\u0435\u0442',
                '\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0445 \u0440\u0438\u0441\u043A\u043E\u0432',
              ].map((task) => (
                <TouchableOpacity
                  key={task}
                  style={[styles.taskCard, isMobile && styles.taskCardMobile, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
                  activeOpacity={0.75}
                  onPress={async () => {
                    const serviceType = TASK_SERVICE_TYPE_MAP[task] || 'other';
                    await secureStorage.setItem('p2ptax_pending_service_type', serviceType);
                    router.push('/(auth)/email?redirectTo=%2F(dashboard)%2Fmy-requests%2Fnew');
                  }}
                >
                  <Text style={styles.taskCardText}>{task}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 5: For whom ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgCard }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u0414\u043B\u044F \u043A\u043E\u0433\u043E'}</Text>

            <View style={[styles.forWhomRow, isWide && styles.forWhomRowWide]}>
              {/* Clients */}
              <View style={[styles.forWhomCard, isWide && styles.forWhomCardWide]}>
                <View style={styles.forWhomIconContainer}>
                  <Ionicons name="person-outline" size={48} color={Colors.brandPrimary} />
                </View>
                <View style={styles.forWhomContent}>
                  <Text style={styles.forWhomTitle}>{'\u0417\u0430\u043A\u0430\u0437\u0447\u0438\u043A\u0430\u043C'}</Text>
                  <Text style={styles.forWhomSubtitle}>{'\u0424\u0438\u0437\u043B\u0438\u0446\u0430, \u0418\u041F \u0438 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438'}</Text>
                  {[
                    '\u0414\u0435\u043A\u043B\u0430\u0440\u0430\u0446\u0438\u0438 \u0438 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0435 \u0432\u044B\u0447\u0435\u0442\u044B',
                    '\u0421\u043F\u043E\u0440\u044B \u0441 \u0424\u041D\u0421',
                    '\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0430\u043B\u043E\u0433\u043E\u0432',
                    '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0431\u0438\u0437\u043D\u0435\u0441\u0430',
                  ].map((item) => (
                    <View key={item} style={styles.forWhomItem}>
                      <Text style={styles.forWhomBullet}>{'\u2022'}</Text>
                      <Text style={styles.forWhomText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Specialists */}
              <View style={[styles.forWhomCard, isWide && styles.forWhomCardWide]}>
                <View style={styles.forWhomIconContainer}>
                  <Ionicons name="briefcase-outline" size={48} color={Colors.brandPrimary} />
                </View>
                <View style={styles.forWhomContent}>
                  <Text style={styles.forWhomTitle}>{'\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430\u043C'}</Text>
                  <Text style={styles.forWhomSubtitle}>{'\u042E\u0440\u0438\u0441\u0442\u044B \u0438 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0435 \u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u043D\u0442\u044B'}</Text>
                  {[
                    '\u0421\u0442\u0430\u0431\u0438\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0442\u043E\u043A \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432',
                    '\u0420\u0430\u0431\u043E\u0442\u0430 \u0432 \u0441\u0432\u043E\u0451\u043C \u0433\u043E\u0440\u043E\u0434\u0435',
                    '\u0413\u0438\u0431\u043A\u0438\u0439 \u0433\u0440\u0430\u0444\u0438\u043A',
                    '\u041F\u0440\u043E\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044F',
                  ].map((item) => (
                    <View key={item} style={styles.forWhomItem}>
                      <Text style={styles.forWhomBullet}>{'\u2022'}</Text>
                      <Text style={styles.forWhomText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ===== SECTION 6: Trust ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgSecondary }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u041A\u0430\u043A \u043C\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432'}</Text>

            <View style={[styles.trustRow, isWide && styles.trustRowWide]}>
              {[
                { title: '\u0412\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432', desc: '\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0434\u0438\u043F\u043B\u043E\u043C\u044B \u0438 \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u0438', icon: 'document-text-outline' as const },
                { title: '\u0420\u0435\u0430\u043B\u044C\u043D\u044B\u0435 \u043E\u0442\u0437\u044B\u0432\u044B', desc: '\u0422\u043E\u043B\u044C\u043A\u043E \u043E\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0445 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432', icon: 'star-outline' as const },
                { title: '\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0430\u044F \u043E\u043F\u043B\u0430\u0442\u0430', desc: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044F\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u044B', icon: 'shield-checkmark-outline' as const },
              ].map((item) => (
                <View key={item.title} style={[styles.trustItem, isWide && styles.trustItemWide]}>
                  <Ionicons name={item.icon} size={36} color={Colors.brandPrimary} />
                  <Text style={styles.trustTitle}>{item.title}</Text>
                  <Text style={styles.trustDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 7: Reviews — hidden until real API reviews available ===== */}

        {/* ===== SECTION 8: FAQ ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgPrimary }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u0427\u0430\u0441\u0442\u043E \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B'}</Text>

            <View style={styles.faqList}>
              {[
                {
                  q: '\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u043E\u0438\u0442 \u0440\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441?',
                  a: '\u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E. \u0412\u044B \u043F\u043B\u0430\u0442\u0438\u0442\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C\u0443 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0443.',
                },
                {
                  q: '\u041A\u0430\u043A \u0431\u044B\u0441\u0442\u0440\u043E \u043F\u0440\u0438\u0434\u0443\u0442 \u043E\u0442\u043A\u043B\u0438\u043A\u0438?',
                  a: '\u041F\u0435\u0440\u0432\u044B\u0435 \u043E\u0442\u043A\u043B\u0438\u043A\u0438 \u043E\u0431\u044B\u0447\u043D\u043E \u043F\u043E\u0441\u0442\u0443\u043F\u0430\u044E\u0442 \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 1\u20132 \u0447\u0430\u0441\u043E\u0432 \u043F\u043E\u0441\u043B\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438.',
                },
                {
                  q: '\u041A\u0430\u043A \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B \u043C\u043E\u0438 \u0434\u0435\u043D\u044C\u0433\u0438?',
                  a: '\u041E\u043F\u043B\u0430\u0442\u0430 \u0440\u0435\u0437\u0435\u0440\u0432\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435 \u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u0441\u044F \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0443 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u0442\u043E\u0433\u043E, \u043A\u0430\u043A \u0432\u044B \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u0440\u0430\u0431\u043E\u0442\u044B.',
                },
                {
                  q: '\u0427\u0442\u043E \u0435\u0441\u043B\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043C\u0435\u043D\u044F \u043D\u0435 \u0443\u0441\u0442\u0440\u043E\u0438\u0442?',
                  a: '\u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0441\u043F\u043E\u0440. \u041D\u0430\u0448\u0430 \u0441\u043B\u0443\u0436\u0431\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0438\u0442 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u044E \u0438 \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u043D\u0430\u0439\u0442\u0438 \u0440\u0435\u0448\u0435\u043D\u0438\u0435.',
                },
              ].map((item, index) => (
                <View key={item.q} style={[styles.faqItem, index < 3 && styles.faqItemBorder]}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    activeOpacity={0.7}
                    onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <Text style={styles.faqQ}>{item.q}</Text>
                    <Text style={styles.faqChevron}>{expandedFaq === index ? '\u25B2' : '\u25BC'}</Text>
                  </TouchableOpacity>
                  {expandedFaq === index && (
                    <Text style={styles.faqA}>{item.a}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 8b: Transparent Pricing ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgCard }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
              {'\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0435 \u0446\u0435\u043D\u043E\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435'}
            </Text>

            <View style={[styles.forWhomRow, isWide && styles.forWhomRowWide]}>
              {/* For clients */}
              <View style={pricingStyles.card}>
                <Text style={pricingStyles.cardTitle}>{'\u0414\u043B\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432'}</Text>
                {[
                  '\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441 \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E',
                  '\u041E\u043F\u0438\u0441\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443 \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E',
                  '\u041F\u043B\u0430\u0442\u0438\u0442\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C\u0443 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0443',
                ].map((item) => (
                  <View key={item} style={pricingStyles.row}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.statusSuccess} />
                    <Text style={pricingStyles.rowText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* For specialists */}
              <View style={pricingStyles.card}>
                <Text style={pricingStyles.cardTitle}>{'\u0414\u043B\u044F \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432'}</Text>
                {[
                  '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E',
                  '\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043E\u0442\u043A\u043B\u0438\u043A\u043E\u0432 \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E',
                  '\u041A\u043E\u043C\u0438\u0441\u0441\u0438\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u2014 0%',
                ].map((item) => (
                  <View key={item} style={pricingStyles.row}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.statusSuccess} />
                    <Text style={pricingStyles.rowText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push('/pricing')} activeOpacity={0.7} style={{ marginTop: Spacing.md }}>
              <Text style={dyn.seeAllText}>{'\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 \u043E \u0442\u0430\u0440\u0438\u0444\u0430\u0445 \u2192'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== SECTION 9: Final CTA ===== */}
        <View style={styles.ctaSection}>
          <View style={[styles.ctaContent, innerStyle]}>
            <Text style={styles.ctaTitle}>{'\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441 \u2014 \u044D\u0442\u043E \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E'}</Text>
            <Text style={styles.ctaSubtitle}>
              {'\u0422\u044B\u0441\u044F\u0447\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432 \u0433\u043E\u0442\u043E\u0432\u044B \u043F\u043E\u043C\u043E\u0447\u044C \u0441 \u0432\u0430\u0448\u0435\u0439 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u043E\u0439 \u0437\u0430\u0434\u0430\u0447\u0435\u0439'}
            </Text>
            <View style={[styles.ctaButtons, isWide && styles.ctaButtonsWide]}>
              <Button
                onPress={() => router.push('/specialists')}
                variant="white"
                style={{ minWidth: 200 }}
              >{'\u041D\u0430\u0439\u0442\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430'}</Button>
              <Button
                onPress={() => router.push('/(auth)/email?redirectTo=%2F(dashboard)%2Fmy-requests%2Fnew')}
                variant="outline-white"
                style={{ minWidth: 200 }}
              >{'\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441'}</Button>
              <Button
                onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                variant="outline-white"
                style={{ minWidth: 200 }}
              >{'\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043A\u0430\u043A \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442'}</Button>
            </View>
          </View>
        </View>

        {/* ===== SECTION 10: Footer ===== */}
        <View style={styles.footer}>
          <View
            style={[
              styles.footerInner,
              innerStyle,
              isWide && styles.footerInnerWide,
            ]}
          >
            <View style={styles.footerLogoRow}>
              <View style={styles.footerLogoCircle}>
                <Text style={styles.footerLogoInitial}>{'\u041D'}</Text>
              </View>
              <Text style={styles.footerLogo}>{'\u041D\u0430\u043B\u043E\u0433\u043E\u0432\u0438\u043A'}</Text>
            </View>
            <View style={[styles.footerLinks, isWide && styles.footerLinksWide]}>
              <TouchableOpacity onPress={() => router.push('/specialists')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>{'\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u044B'}</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>{'\u00B7'}</Text>
              <TouchableOpacity onPress={() => router.push('/requests')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>{'\u0417\u0430\u043F\u0440\u043E\u0441\u044B'}</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>{'\u00B7'}</Text>
              <TouchableOpacity onPress={() => router.push('/pricing')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>{'\u0422\u0430\u0440\u0438\u0444\u044B'}</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>{'\u00B7'}</Text>
              <Text style={styles.footerDot}>{'\u00B7'}</Text>
              <TouchableOpacity onPress={() => router.push('/support' as any)} activeOpacity={0.7}>
                <Text style={styles.footerLink}>{'\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B'}</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>{'\u00B7'}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>{'\u041E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerCopy}>
              {`\u00A9 ${new Date().getFullYear()} \u041D\u0430\u043B\u043E\u0433\u043E\u0432\u0438\u043A`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
  },

  // ---- Hero ----
  heroSection: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  heroContent: {
    width: '100%',
    gap: 40,
  },
  heroContentWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    gap: 20,
  },
  heroLeftWide: {
    flex: 1,
    paddingRight: 40,
  },
  heroRight: {
    width: '100%',
    marginTop: 32,
  },
  heroRightWide: {
    flex: 1,
    marginTop: 0,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroTitleWide: {
    fontSize: 44,
    lineHeight: 56,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    lineHeight: 26,
    maxWidth: 520,
  },
  heroSubtitleWide: {
    fontSize: Typography.fontSize.lg,
    lineHeight: 28,
  },
  heroCtas: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  heroCtasWide: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 12,
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: BorderRadius.lg,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 30px rgba(15, 36, 71, 0.12)' }
      : {
          shadowColor: Colors.textPrimary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 30,
          elevation: 8,
        }),
  },
  heroImageWide: {
    height: 400,
  },
  heroImageFallback: {
    backgroundColor: Colors.brandPrimary,
    ...(Platform.OS === 'web'
      ? { background: `linear-gradient(135deg, ${Colors.brandPrimary} 0%, ${Colors.brandPrimaryHover} 100%)` } as any
      : {}),
  },

  // ---- Launch Banner (replaces fake stats) ----
  launchBanner: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  launchBannerText: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  launchBannerBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  launchBannerBtnLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // ---- Stats Bar ----
  statsSection: {
    width: '100%',
    backgroundColor: Colors.bgSecondary,
    paddingVertical: 32,
    alignItems: 'center',
  },
  statsInner: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRowMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  statItemMobile: {
    width: '50%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  // ---- Sections ----
  section: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
  },
  sectionInner: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 550,
    marginBottom: 24,
  },

  // ---- Steps ----
  stepsRow: {
    width: '100%',
    gap: 32,
    marginTop: 24,
  },
  stepsRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepItemWide: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  stepNumberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  stepTextBlock: {
    gap: 4,
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // ---- Tasks Grid ----
  tasksGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  tasksGridDesktop: {
    gap: 16,
  },
  tasksGridTablet: {
    gap: 14,
  },
  taskCard: {
    width: '31%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  taskCardMobile: {
    width: '47%',
  },
  taskCardText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // ---- For whom ----
  forWhomRow: {
    width: '100%',
    gap: 24,
    marginTop: 8,
  },
  forWhomRowWide: {
    flexDirection: 'row',
  },
  forWhomCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bgPrimary,
  },
  forWhomCardWide: {},
  forWhomIconContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  forWhomContent: {
    padding: 24,
    gap: 10,
  },
  forWhomTitle: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  forWhomSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 4,
  },
  forWhomItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  forWhomBullet: {
    fontSize: Typography.fontSize.md,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
    marginTop: 1,
  },
  forWhomText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },

  // ---- Trust ----
  trustRow: {
    width: '100%',
    gap: 24,
    marginTop: 8,
  },
  trustRowWide: {
    flexDirection: 'row',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  trustItemWide: {},
  trustCheck: {
    fontSize: 28,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  trustTitle: {
    fontSize: 17,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ---- Reviews ----
  reviewsRow: {
    width: '100%',
    gap: 20,
    marginTop: 8,
  },
  reviewsRowDesktop: {
    flexDirection: 'row',
  },
  reviewsRowTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reviewCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 24,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 12px rgba(15, 36, 71, 0.06)' }
      : {
          shadowColor: Colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }),
  },
  reviewCardTablet: {
    width: '48%',
    flex: undefined as any,
  },
  reviewQuote: {
    fontSize: Typography.fontSize.jumbo,
    color: Colors.border,
    lineHeight: 48,
    fontWeight: Typography.fontWeight.bold,
  },
  reviewText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 23,
  },
  reviewStars: {
    fontSize: Typography.fontSize.md,
    color: Colors.brandPrimary,
    letterSpacing: 2,
    marginTop: 4,
  },
  reviewName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  reviewCity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // ---- FAQ ----
  faqList: {
    width: '100%',
    maxWidth: 700,
    marginTop: 8,
  },
  faqItem: {
    paddingVertical: 20,
    gap: 8,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  faqQ: {
    fontSize: 17,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  faqChevron: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginLeft: 12,
  },
  faqA: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 23,
  },

  // ---- CTA Section ----
  ctaSection: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
    backgroundColor: Colors.textPrimary,
  },
  ctaContent: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  ctaTitle: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 500,
  },
  ctaButtons: {
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  ctaButtonsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  // ---- Footer ----
  footer: {
    width: '100%',
    backgroundColor: Colors.textPrimary,
    paddingVertical: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerInner: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  footerInnerWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoInitial: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  footerLogo: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLinksWide: {
    gap: 16,
  },
  footerLink: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: Typography.fontWeight.medium,
  },
  footerDot: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.35)',
  },
  footerCopy: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.35)',
  },
});

// ---- Dynamic section styles ----

const dyn = StyleSheet.create({
  specialistsRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
    flexDirection: 'row',
  },
  specialistCard: {
    width: 160,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  specialistName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  specialistCity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  specialistChip: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  specialistChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
  },
  requestsList: {
    width: '100%',
    gap: 0,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  requestLeft: {
    flex: 1,
    gap: 4,
  },
  requestTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  requestCity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  requestBudget: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
    flexShrink: 0,
  },
  citiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
    minHeight: 44,
    justifyContent: 'center',
  },
  cityChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  seeAllBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  seeAllText: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
});

const pricingStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
});
// dev-sync test Thu Apr  9 08:47:11 PDT 2026
