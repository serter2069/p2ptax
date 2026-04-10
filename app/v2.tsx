import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Colors, Typography } from '../constants/Colors';
import { api } from '../lib/api';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { QuickRequestForm } from '../components/QuickRequestForm';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

// ---- FAQ Accordion ----

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={faqStyles.item}>
      <TouchableOpacity
        style={faqStyles.questionRow}
        activeOpacity={0.7}
        onPress={() => setOpen(!open)}
      >
        <Text style={faqStyles.question}>{q}</Text>
        <Text style={faqStyles.chevron}>{open ? '−' : '+'}</Text>
      </TouchableOpacity>
      {open && <Text style={faqStyles.answer}>{a}</Text>}
    </View>
  );
}

const faqStyles = StyleSheet.create({
  item: {
    paddingVertical: 24,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  question: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 28,
  },
  chevron: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textMuted,
    marginLeft: 16,
    fontWeight: '300',
  },
  answer: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 26,
    marginTop: 12,
  },
});

// ---- Main Screen ----

export default function LandingV2Screen() {
  const router = useRouter();
  const { isMobile, isDesktop } = useBreakpoints();
  const formRef = useRef<View>(null);
  const [landingStats, setLandingStats] = useState<{
    specialistsCount: number;
    ifnsCount: number;
    requestsCount: number;
  } | null>(null);
  const [review, setReview] = useState<{
    id: string;
    rating: number;
    comment: string | null;
    clientName: string;
    specialistName: string;
  } | null>(null);

  useEffect(() => {
    api
      .get<{ specialistsCount: number; ifnsCount: number; requestsCount: number }>(
        '/stats/landing'
      )
      .then(setLandingStats)
      .catch((err) => console.warn('[v2]', err));
    api
      .get<any[]>('/reviews/public?limit=1')
      .then((data) => {
        if (data && data.length > 0) setReview(data[0]);
      })
      .catch((err) => console.warn('[v2]', err));
  }, []);

  const isWide = !isMobile;
  const contentMaxWidth = isMobile ? 430 : isDesktop ? 1080 : 900;
  const sectionPx = isMobile ? 20 : 40;

  const inner = {
    maxWidth: contentMaxWidth as any,
    paddingHorizontal: sectionPx,
    width: '100%' as const,
    alignSelf: 'center' as const,
  };

  function scrollToForm() {
    if (Platform.OS === 'web') {
      document.getElementById('v2-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <Stack.Screen options={{ title: 'Налоговик — найдите налогового специалиста' }} />
      <Head>
        <title>Налоговик — найдите налогового специалиста</title>
        <meta
          name="description"
          content="Подбираем специалиста по вашей ИФНС и конкретной ситуации."
        />
        <meta property="og:title" content="Налоговик — найдите налогового специалиста" />
        <meta
          property="og:description"
          content="Подбираем специалиста по вашей ИФНС и конкретной ситуации."
        />
        <meta property="og:url" content={APP_URL} />
      </Head>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ===== Header ===== */}
        <View style={s.header}>
          <View style={[s.headerInner, inner]}>
            <Text style={s.headerLogo}>Налоговик</Text>
            <View style={s.headerNav}>
              <TouchableOpacity
                onPress={() => router.push('/specialists')}
                activeOpacity={0.7}
              >
                <Text style={s.headerLink}>Специалисты</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    document
                      .getElementById('v2-how')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={s.headerLink}>Как это работает</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.headerBtn}
                onPress={() => router.push('/(auth)/email')}
                activeOpacity={0.85}
              >
                <Text style={s.headerBtnText}>Войти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== Hero ===== */}
        <View style={[s.hero, { paddingTop: isMobile ? 64 : 120, paddingBottom: isMobile ? 48 : 100 }]}>
          <View style={[inner]}>
            <Text style={s.heroLabel}>НАЛОГОВЫЕ СПЕЦИАЛИСТЫ ПО ВАШЕЙ ИФНС</Text>
            <Text style={[s.heroTitle, isMobile && s.heroTitleMobile]}>
              {'Найдём того, кто уже\nрешал ваш вопрос'}
            </Text>
            <Text style={s.heroSub}>
              Не общие советы — а конкретный специалист, который работал с вашей
              инспекцией и знает её практику.
            </Text>
            <TouchableOpacity style={s.heroCta} onPress={scrollToForm} activeOpacity={0.85}>
              <Text style={s.heroCtaText}>Описать ситуацию</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
              activeOpacity={0.7}
              style={{ marginTop: 16 }}
            >
              <Text style={s.heroSpecLink}>{'Я специалист \u2192'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Social Proof Strip ===== */}
        {landingStats && (
          <View style={s.socialStrip}>
            <Text style={s.socialText}>
              {`${landingStats.specialistsCount} специалистов \u00B7 ${landingStats.ifnsCount} ИФНС \u00B7 ${landingStats.requestsCount} решённых вопросов`}
            </Text>
          </View>
        )}

        {/* ===== Quick Request Form ===== */}
        <View
          nativeID="v2-form"
          ref={formRef}
          style={[
            s.formSection,
            { paddingTop: isMobile ? 64 : 120, paddingBottom: isMobile ? 64 : 120 },
          ]}
        >
          <View style={[inner]}>
            <Text style={[s.sectionTitle, isMobile && s.sectionTitleMobile]}>
              Что случилось?
            </Text>
            <QuickRequestForm />
          </View>
        </View>

        {/* ===== How it works ===== */}
        <View
          nativeID="v2-how"
          style={[
            s.howSection,
            { paddingTop: isMobile ? 64 : 120, paddingBottom: isMobile ? 64 : 120 },
          ]}
        >
          <View style={[inner]}>
            <Text style={[s.sectionTitle, isMobile && s.sectionTitleMobile]}>
              Как это работает
            </Text>
            <View style={s.stepsWrap}>
              {[
                {
                  num: '01',
                  title: 'Опишите ситуацию',
                  desc: 'Расскажите что произошло: требование ФНС, проверка, штраф или нужна помощь с декларацией.',
                },
                {
                  num: '02',
                  title: 'Подбираем по ИФНС',
                  desc: 'Ищем специалистов, которые работали именно с вашей инспекцией и знают её практику.',
                },
                {
                  num: '03',
                  title: 'Получите решение',
                  desc: 'Специалист не просто консультирует — он ведёт ваш вопрос до закрытия.',
                },
              ].map((step, idx, arr) => (
                <React.Fragment key={step.num}>
                  <View style={s.stepRow}>
                    <Text style={s.stepNum}>{step.num}</Text>
                    <View style={s.stepContent}>
                      <Text style={s.stepTitle}>{step.title}</Text>
                      <Text style={s.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                  {idx < arr.length - 1 && <View style={s.stepDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* ===== Trust Strip ===== */}
        <View style={s.trustStrip}>
          <Text style={s.trustText}>
            {'Проверяем документы \u00B7 Реальные отзывы \u00B7 Оплата после результата'}
          </Text>
        </View>

        {/* ===== Review (single highlight) ===== */}
        {review && review.comment && (
          <View
            style={[
              s.reviewSection,
              {
                paddingTop: isMobile ? 64 : 120,
                paddingBottom: isMobile ? 64 : 120,
              },
            ]}
          >
            <View style={[inner, { alignItems: 'center' as const }]}>
              <Text style={s.reviewQuote}>{'\u201C'}</Text>
              <Text style={[s.reviewText, isMobile && s.reviewTextMobile]}>
                {review.comment}
              </Text>
              <View style={s.reviewAuthor}>
                <Text style={s.reviewName}>{review.clientName}</Text>
                <Text style={s.reviewSpec}>
                  {'Специалист: '}
                  {review.specialistName}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ===== Specialists link ===== */}
        <View style={s.specLinkSection}>
          <TouchableOpacity
            onPress={() => router.push('/specialists')}
            activeOpacity={0.7}
          >
            <Text style={s.specLinkText}>
              {landingStats
                ? `${landingStats.specialistsCount} проверенных специалистов \u2192`
                : 'Все специалисты \u2192'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== FAQ ===== */}
        <View
          style={[
            s.faqSection,
            { paddingTop: isMobile ? 64 : 120, paddingBottom: isMobile ? 48 : 80 },
          ]}
        >
          <View style={[inner]}>
            <Text style={[s.sectionTitle, isMobile && s.sectionTitleMobile]}>
              Вопросы и ответы
            </Text>
            <View style={s.faqList}>
              <FaqItem
                q="Сколько стоит разместить запрос?"
                a="Размещение запроса бесплатно. Вы платите только выбранному специалисту."
              />
              <FaqItem
                q="Как быстро придут отклики?"
                a="Первые отклики обычно поступают в течение 1-2 часов после публикации."
              />
              <FaqItem
                q="Как защищены мои деньги?"
                a="Оплата резервируется на платформе и переводится специалисту только после того, как вы подтвердите выполнение работы."
              />
              <FaqItem
                q="Что если результат меня не устроит?"
                a="Вы можете открыть спор. Наша служба поддержки рассмотрит ситуацию и поможет найти решение."
              />
            </View>
          </View>
        </View>

        {/* ===== Final CTA ===== */}
        <View
          style={[
            s.ctaSection,
            { paddingTop: isMobile ? 64 : 100, paddingBottom: isMobile ? 64 : 100 },
          ]}
        >
          <View style={[inner, { alignItems: 'center' as const }]}>
            <Text style={[s.ctaTitle, isMobile && s.ctaTitleMobile]}>
              Начните бесплатно
            </Text>
            <TouchableOpacity style={s.ctaBtn} onPress={scrollToForm} activeOpacity={0.85}>
              <Text style={s.ctaBtnText}>Описать ситуацию</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Footer ===== */}
        <View style={s.footer}>
          <View style={[s.footerInner, inner]}>
            <View
              style={[
                s.footerRow,
                isWide && { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
              ]}
            >
              <Text style={s.footerLogo}>Налоговик</Text>
              <View style={s.footerLinks}>
                <TouchableOpacity
                  onPress={() => router.push('/specialists')}
                  activeOpacity={0.7}
                >
                  <Text style={s.footerLink}>Специалисты</Text>
                </TouchableOpacity>
                <Text style={s.footerDot}>{'\u00B7'}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/requests')}
                  activeOpacity={0.7}
                >
                  <Text style={s.footerLink}>Запросы</Text>
                </TouchableOpacity>
                <Text style={s.footerDot}>{'\u00B7'}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/support' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={s.footerLink}>Контакты</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={s.footerCopy}>
              {`\u00A9 ${new Date().getFullYear()} Налоговик`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Styles ----

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgCard,
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  header: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerLogo: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerBtn: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },

  // Hero
  hero: {
    width: '100%',
    backgroundColor: Colors.bgCard,
  },
  heroLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 62,
    marginBottom: 20,
  },
  heroTitleMobile: {
    fontSize: Typography.fontSize.display,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  heroSub: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    lineHeight: 30,
    maxWidth: 520,
    marginBottom: 32,
  },
  heroCta: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  heroSpecLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Social proof strip
  socialStrip: {
    width: '100%',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  socialText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Form section
  formSection: {
    width: '100%',
    backgroundColor: Colors.bgCard,
  },
  sectionTitle: {
    fontSize: 40,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 40,
  },
  sectionTitleMobile: {
    fontSize: Typography.fontSize['2xl'],
    letterSpacing: -0.5,
    marginBottom: 24,
  },

  // How it works
  howSection: {
    width: '100%',
    backgroundColor: Colors.bgSecondary,
  },
  stepsWrap: {
    width: '100%',
    maxWidth: 640,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 32,
    alignItems: 'flex-start',
  },
  stepNum: {
    fontSize: 72,
    fontWeight: '300',
    color: Colors.border,
    lineHeight: 72,
    minWidth: 80,
  },
  stepContent: {
    flex: 1,
    gap: 8,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  stepDivider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },

  // Trust strip
  trustStrip: {
    width: '100%',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trustText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // Review
  reviewSection: {
    width: '100%',
    backgroundColor: Colors.bgCard,
  },
  reviewQuote: {
    fontSize: 80,
    color: Colors.border,
    lineHeight: 80,
    fontWeight: '400',
    marginBottom: -8,
  },
  reviewText: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
    lineHeight: 38,
    textAlign: 'center',
    maxWidth: 640,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  reviewTextMobile: {
    fontSize: Typography.fontSize.lg,
    lineHeight: 30,
  },
  reviewAuthor: {
    marginTop: 32,
    alignItems: 'center',
    gap: 4,
  },
  reviewName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reviewSpec: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // Specialists link
  specLinkSection: {
    width: '100%',
    paddingVertical: 32,
    alignItems: 'center',
  },
  specLinkText: {
    fontSize: Typography.fontSize.md,
    color: Colors.brandPrimary,
    fontWeight: '500',
  },

  // FAQ
  faqSection: {
    width: '100%',
    backgroundColor: Colors.bgCard,
  },
  faqList: {
    width: '100%',
    maxWidth: 640,
  },

  // Final CTA
  ctaSection: {
    width: '100%',
    backgroundColor: Colors.bgCard,
  },
  ctaTitle: {
    fontSize: Typography.fontSize.jumbo,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaTitleMobile: {
    fontSize: Typography.fontSize['3xl'],
    letterSpacing: -0.5,
  },
  ctaBtn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },

  // Footer
  footer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 40,
    backgroundColor: Colors.bgCard,
  },
  footerInner: {
    width: '100%',
    gap: 16,
  },
  footerRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  footerLogo: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  footerDot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.border,
  },
  footerCopy: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
