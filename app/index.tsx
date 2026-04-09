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
import { Footer } from '../components/Footer';

// ---- Components ----

function QuickRequestForm() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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

      <Text style={qrf.label}>Что случилось?</Text>
      <View style={qrf.cityRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[qrf.cityChip, serviceType === cat.name && qrf.cityChipSelected]}
            onPress={() => setServiceType(cat.name)}
          >
            <Text style={[qrf.cityChipText, serviceType === cat.name && qrf.cityChipTextSelected]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={qrf.label}>Описание</Text>
      <TextInput
        testID="quick-request-description"
        style={qrf.input}
        placeholder="Опишите вашу ситуацию..."
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
  const [featuredSpecialists, setFeaturedSpecialists] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string | null;
    clientName: string;
    specialistName: string;
    specialistNick?: string;
  }>>([]);
  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.get<any[]>('/specialists/featured?limit=50').then(setFeaturedSpecialists).catch((err) => console.warn('Landing section failed (featured specialists):', err)).finally(() => setIsLoadingSpecialists(false));
    api.get<any[]>('/requests/recent?limit=5').then(setRecentRequests).catch((err) => console.warn('Landing section failed (recent requests):', err)).finally(() => setIsLoadingRequests(false));
    api.get<any[]>('/reviews/public?limit=6').then(setReviews).catch((err) => console.warn('Landing section failed (reviews):', err));
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
        <meta name="description" content="Подбираем специалиста по вашей ИФНС и конкретной ситуации. Выездная проверка, камеральная, вычеты, споры — только тот, кто знает именно ваш вопрос." />
        <meta property="og:title" content="Налоговик — найдите налогового специалиста" />
        <meta property="og:description" content="Подбираем специалиста по вашей ИФНС и конкретной ситуации. Выездная проверка, камеральная, вычеты, споры — только тот, кто знает именно ваш вопрос." />
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
                {'Специалист, который знает\nименно вашу ИФНС'}
              </Text>
              <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
                {'Не общие советы — а специалист, который работал с вашей инспекцией и знает её практику. Первая консультация бесплатно.'}
              </Text>

              <View style={[styles.heroCtas, isWide && styles.heroCtasWide]}>
                <Button
                  onPress={() => router.push('/specialists')}
                  variant="primary"
                  style={!isWide ? { width: '100%', minHeight: 52 } : { minWidth: 260, maxWidth: 320 }}
                >{'\u041D\u0430\u0439\u0442\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430'}</Button>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                activeOpacity={0.7}
                style={{ marginTop: 8 }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' }}>
                  {'\u042F \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442 \u2014 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F'}
                </Text>
              </TouchableOpacity>
            </View>

            {isWide && (
              <View style={[styles.heroRight, styles.heroRightWide]}>
                <View style={styles.heroCardsContainer}>
                  {[
                    { icon: 'search-outline' as const, label: '200+ ИФНС' },
                    { icon: 'people-outline' as const, label: 'Проверенные специалисты' },
                    { icon: 'checkmark-done-outline' as const, label: 'Результат, не совет' },
                  ].map((item) => (
                    <View key={item.label} style={styles.heroCard}>
                      <Ionicons name={item.icon} size={28} color={Colors.brandPrimary} />
                      <Text style={styles.heroCardText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ===== Stats Bar ===== */}
        <View style={styles.statsSection}>
          <View style={[styles.statsInner, innerStyle]}>
            <View style={[isMobile ? styles.statsRowMobile : styles.statsRow]}>
              {[
                { number: '200+', label: 'ИФНС в базе' },
                { number: '500+', label: 'Специалистов' },
                { number: '1-2 часа', label: 'Время первого отклика' },
                { number: 'Бесплатно', label: 'Размещение запроса' },
              ].map((stat, idx, arr) => (
                <React.Fragment key={stat.label}>
                  <View style={[styles.statItem, isMobile && styles.statItemMobile]}>
                    <Text style={styles.statNumber}>{stat.number}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                  {!isMobile && idx < arr.length - 1 && <View style={styles.statDivider} />}
                </React.Fragment>
              ))}
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
                ref={carouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dyn.specialistsRow}
                onScroll={() => {}}
                scrollEventThrottle={16}
              >
                {featuredSpecialists.map((s: any, idx: number) => {
                  const displayName = s.displayName || s.nick || '';
                  const initials = displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                  const headline = s.headline || (s.services && s.services.length > 0 ? s.services[0] : null);
                  const city = s.cities && s.cities.length > 0 ? s.cities[0] : null;
                  const memberYear = s.createdAt ? new Date(s.createdAt).getFullYear() : null;
                  return (
                    <TouchableOpacity
                      key={`${s.nick}-${idx}`}
                      style={dyn.specialistCard}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/specialists/${s.nick}` as any)}
                    >
                      {/* Avatar */}
                      <View style={dyn.avatarRow}>
                        {s.avatarUrl ? (
                          <Image source={{ uri: s.avatarUrl }} style={dyn.avatar} />
                        ) : (
                          <View style={dyn.avatarPlaceholder}>
                            <Text style={dyn.avatarInitials}>{initials || '?'}</Text>
                          </View>
                        )}
                      </View>
                      {/* Name */}
                      <Text style={dyn.specialistName} numberOfLines={2}>{displayName}</Text>
                      {/* Headline / specialization */}
                      {headline ? (
                        <Text style={dyn.specialistHeadline} numberOfLines={2}>{headline}</Text>
                      ) : null}
                      {/* Pills row */}
                      <View style={dyn.pillsRow}>
                        {city ? (
                          <View style={dyn.pill}>
                            <Text style={dyn.pillText} numberOfLines={1}>{city}</Text>
                          </View>
                        ) : null}
                        {memberYear ? (
                          <View style={[dyn.pill, dyn.pillYear]}>
                            <Text style={[dyn.pillText, dyn.pillTextYear]}>{`с ${memberYear}`}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
                { num: '1', icon: 'create-outline' as const, title: 'Опишите ситуацию', desc: 'Расскажите что произошло: требование ФНС, проверка, штраф или нужна помощь с декларацией' },
                { num: '2', icon: 'search-outline' as const, title: 'Подбираем по ИФНС', desc: 'Ищем специалистов, которые работали именно с вашей инспекцией и знают её практику' },
                { num: '3', icon: 'checkmark-circle-outline' as const, title: 'Получите решение', desc: 'Специалист не просто сопровождает — он ведёт ваш вопрос до закрытия' },
              ].map((step, idx, arr) => (
                <React.Fragment key={step.num}>
                  {idx > 0 && isWide && (
                    <View style={{ justifyContent: 'center', paddingBottom: 24 }}>
                      <Ionicons name="arrow-forward" size={24} color={Colors.border} />
                    </View>
                  )}
                  <View style={[styles.stepItem, isWide && styles.stepItemWide]}>
                    <View style={styles.stepNumberCircle}>
                      <Ionicons name={step.icon} size={24} color={Colors.white} />
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

        {/* ===== SECTION 3b: Our Principle ===== */}
        <View style={[styles.section, { backgroundColor: '#1A3A6C', paddingVertical: 64 }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]} accessibilityRole="header" aria-level={2}>
              {'Специалист по вашей ИФНС — не по налогам вообще'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: 'rgba(255,255,255,0.80)', maxWidth: 620 }]}>
              {'Мы не даём общих советов. Каждый специалист на платформе работает с конкретными инспекциями и решает конкретные вопросы: камеральная в ИФНС №46, выездная в МРИ №5, спор с вашей районной.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/specialists')}
              activeOpacity={0.85}
              style={{
                marginTop: 8,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.4)',
                borderRadius: 8,
                paddingHorizontal: 28,
                paddingVertical: 14,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                {'Найти специалиста под мою задачу →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== SECTION 4: For whom ===== */}
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

        {/* ===== Quick Request Form ===== */}
        <View style={[styles.section, { backgroundColor: Colors.bgSecondary, paddingVertical: 48 }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <QuickRequestForm />
          </View>
        </View>

        {/* ===== SECTION 7: Reviews ===== */}
        {reviews.length > 0 && (
          <View style={[styles.section, { backgroundColor: Colors.bgSecondary }]}>
            <View style={[styles.sectionInner, innerStyle]}>
              <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>{'\u041e\u0442\u0437\u044b\u0432\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432'}</Text>
              <Text style={styles.sectionSubtitle}>{'\u0420\u0435\u0430\u043b\u044c\u043d\u044b\u0435 \u043e\u0442\u0437\u044b\u0432\u044b \u043e\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0445 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432'}</Text>

              <View style={[
                styles.reviewsRow,
                isWide && styles.reviewsRowDesktop,
                isTablet && !isWide && styles.reviewsRowTablet,
              ]}>
                {reviews.map((review) => (
                  <View
                    key={review.id}
                    style={[
                      styles.reviewCard,
                      isTablet && !isWide && styles.reviewCardTablet,
                    ]}
                  >
                    <Text style={styles.reviewQuote}>{'\u201c'}</Text>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                    <Text style={styles.reviewStars}>
                      {'\u2605'.repeat(review.rating)}{'\u2606'.repeat(5 - review.rating)}
                    </Text>
                    <Text style={styles.reviewName}>{review.clientName}</Text>
                    <Text style={styles.reviewCity}>{'\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442: '}{review.specialistName}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

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

        {/* ===== SECTION 9: Final CTA ===== */}
        <View style={styles.ctaSection}>
          <View style={[styles.ctaContent, innerStyle]}>
            <Text style={styles.ctaTitle}>{'\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441 \u2014 \u044D\u0442\u043E \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E'}</Text>
            <Text style={styles.ctaSubtitle}>
              {'Специалисты по всей России готовы довести ваш вопрос до результата'}
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
        <Footer isWide={isWide} />
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
  heroCardsContainer: {
    gap: 16,
    padding: 24,
    borderRadius: BorderRadius.lg,
    ...(Platform.OS === 'web'
      ? { background: `linear-gradient(135deg, ${Colors.brandPrimary} 0%, ${Colors.brandPrimaryHover} 100%)` } as any
      : { backgroundColor: Colors.brandPrimary }),
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(15, 36, 71, 0.10)' }
      : {
          shadowColor: Colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  heroCardText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
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
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: Colors.border,
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
    minWidth: 280,
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

});

// ---- Dynamic section styles ----

const dyn = StyleSheet.create({
  specialistsRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 16,
    flexDirection: 'row',
  },
  specialistCard: {
    width: 184,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 10px rgba(15, 36, 71, 0.07)' }
      : {
          shadowColor: Colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 3,
        }),
  },
  avatarRow: {
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  specialistName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  specialistHeadline: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  pill: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillYear: {
    backgroundColor: 'rgba(14, 105, 209, 0.08)',
  },
  pillText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  pillTextYear: {
    color: Colors.brandPrimary,
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
// dev-sync test Thu Apr  9 08:47:11 PDT 2026
