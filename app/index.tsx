import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Typography, BorderRadius } from '../constants/Colors';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { LandingHeader } from '../components/LandingHeader';

// ---- Components ----

function LandingButton({
  onPress,
  label,
  variant = 'primary',
  style,
}: {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'outline' | 'white' | 'outline-white';
  style?: any;
}) {
  const isPrimary = variant === 'primary';
  const isWhite = variant === 'white';
  const isOutlineWhite = variant === 'outline-white';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        btnStyles.base,
        isPrimary && btnStyles.primary,
        variant === 'outline' && btnStyles.outline,
        isWhite && btnStyles.white,
        isOutlineWhite && btnStyles.outlineWhite,
        style,
      ]}
    >
      <Text
        style={[
          btnStyles.label,
          isPrimary && btnStyles.primaryLabel,
          variant === 'outline' && btnStyles.outlineLabel,
          isWhite && btnStyles.whiteLabel,
          isOutlineWhite && btnStyles.outlineWhiteLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  primary: {
    backgroundColor: '#1A5BA8',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1A5BA8',
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  outlineWhite: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  outlineLabel: {
    color: '#1A5BA8',
  },
  whiteLabel: {
    color: '#1A5BA8',
  },
  outlineWhiteLabel: {
    color: '#FFFFFF',
  },
});

// ---- Main ----

export default function LandingScreen() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [heroImageError, setHeroImageError] = React.useState(false);

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
              <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
                {'\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0441 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u043E\u0439?\n\u041D\u0430\u0439\u0434\u0451\u043C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430 \u0437\u0430 1 \u0447\u0430\u0441'}
              </Text>
              <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
                {'\u042E\u0440\u0438\u0441\u0442\u044B \u0438 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0435 \u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u043D\u0442\u044B \u0432 \u0432\u0430\u0448\u0435\u043C \u0433\u043E\u0440\u043E\u0434\u0435. \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0439\u0442\u0435 \u0437\u0430\u043F\u0440\u043E\u0441 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u2014 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043E\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0445 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432'}
              </Text>

              <View style={[styles.heroCtas, isWide && styles.heroCtasWide]}>
                <LandingButton
                  onPress={() => router.push('/specialists')}
                  label={'\u041D\u0430\u0439\u0442\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430'}
                  variant="primary"
                  style={isWide ? { minWidth: 220 } : { width: '100%' as any }}
                />
                <LandingButton
                  onPress={() => router.push('/(auth)/email?redirectTo=%2F(dashboard)%2Frequests%2Fnew')}
                  label={'\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441'}
                  variant="outline"
                  style={isWide ? { minWidth: 200 } : { width: '100%' as any }}
                />
                <LandingButton
                  onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                  label={'\u042F \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442'}
                  variant="outline"
                  style={isWide ? { minWidth: 200 } : { width: '100%' as any }}
                />
              </View>
            </View>

            {isWide && (
              <View style={[styles.heroRight, styles.heroRightWide]}>
                {heroImageError ? (
                  <View style={[styles.heroImage, styles.heroImageWide, styles.heroImageFallback]} />
                ) : (
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80' }}
                    style={[styles.heroImage, styles.heroImageWide]}
                    resizeMode="cover"
                    onError={() => setHeroImageError(true)}
                    accessibilityLabel="Налоговый консультант за работой"
                  />
                )}
              </View>
            )}
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

        {/* ===== SECTION 3: How it works ===== */}
        <View nativeID="how-it-works" style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle}>{'\u041A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442'}</Text>

            <View style={[styles.stepsRow, isWide && styles.stepsRowWide]}>
              {[
                { num: '1', title: '\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443', desc: '\u0427\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0441\u0434\u0435\u043B\u0430\u0442\u044C, \u0441\u0440\u043E\u043A, \u0431\u044E\u0434\u0436\u0435\u0442' },
                { num: '2', title: '\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043E\u0442\u043A\u043B\u0438\u043A\u0438', desc: '\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u044B \u0438\u0437 \u0432\u0430\u0448\u0435\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430 \u043F\u0440\u0438\u0448\u043B\u044E\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F' },
                { num: '3', title: '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438 \u043F\u043B\u0430\u0442\u0438\u0442\u0435', desc: '\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0430\u044F \u0441\u0434\u0435\u043B\u043A\u0430, \u0434\u0435\u043D\u044C\u0433\u0438 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u044F\u0442 \u043F\u043E\u0441\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F' },
              ].map((step) => (
                <View key={step.num} style={[styles.stepItem, isWide && styles.stepItemWide]}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{step.num}</Text>
                  </View>
                  <View style={styles.stepTextBlock}>
                    <Text style={[styles.stepTitle, !isWide && { textAlign: 'center' as const }]}>{step.title}</Text>
                    <Text style={[styles.stepDesc, !isWide && { textAlign: 'center' as const }]}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 4: Typical tasks ===== */}
        <View style={[styles.section, { backgroundColor: '#F4FBFC' }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle}>{'\u0422\u0438\u043F\u0438\u0447\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438'}</Text>
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
                <View key={task} style={[styles.taskCard, isMobile && styles.taskCardMobile]}>
                  <Text style={styles.taskCardText}>{task}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 5: For whom ===== */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle}>{'\u0414\u043B\u044F \u043A\u043E\u0433\u043E'}</Text>

            <View style={[styles.forWhomRow, isWide && styles.forWhomRowWide]}>
              {/* Clients */}
              <View style={[styles.forWhomCard, isWide && styles.forWhomCardWide]}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' }}
                  style={styles.forWhomImage}
                  resizeMode="cover"
                />
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
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' }}
                  style={styles.forWhomImage}
                  resizeMode="cover"
                />
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
        <View style={[styles.section, { backgroundColor: '#EBF3FB' }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle}>{'\u041A\u0430\u043A \u043C\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432'}</Text>

            <View style={[styles.trustRow, isWide && styles.trustRowWide]}>
              {[
                { title: '\u0412\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432', desc: '\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0434\u0438\u043F\u043B\u043E\u043C\u044B \u0438 \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u0438' },
                { title: '\u0420\u0435\u0430\u043B\u044C\u043D\u044B\u0435 \u043E\u0442\u0437\u044B\u0432\u044B', desc: '\u0422\u043E\u043B\u044C\u043A\u043E \u043E\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0445 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432' },
                { title: '\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0430\u044F \u043E\u043F\u043B\u0430\u0442\u0430', desc: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044F\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u044B' },
              ].map((item) => (
                <View key={item.title} style={[styles.trustItem, isWide && styles.trustItemWide]}>
                  <Text style={styles.trustCheck}>{'\u2713'}</Text>
                  <Text style={styles.trustTitle}>{item.title}</Text>
                  <Text style={styles.trustDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 7: Reviews ===== */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle}>{'\u041E\u0442\u0437\u044B\u0432\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432'}</Text>

            <View style={[styles.reviewsRow, isDesktop && styles.reviewsRowDesktop, isTablet && styles.reviewsRowTablet]}>
              {[
                {
                  text: '\u041F\u043E\u043C\u043E\u0433\u043B\u0438 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C\u0441\u044F \u0441 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u043C \u0432\u044B\u0447\u0435\u0442\u043E\u043C, \u0431\u044B\u0441\u0442\u0440\u043E \u0438 \u043F\u043E\u043D\u044F\u0442\u043D\u043E. \u0412\u0435\u0440\u043D\u0443\u043B\u0438 260 \u0442\u044B\u0441\u044F\u0447 \u0437\u0430 \u043A\u0432\u0430\u0440\u0442\u0438\u0440\u0443!',
                  name: '\u0410\u043D\u043D\u0430 \u041A.',
                  city: '\u041C\u043E\u0441\u043A\u0432\u0430',
                },
                {
                  text: '\u041D\u0430\u0448\u043B\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430 \u0437\u0430 \u0447\u0430\u0441, \u0441\u043F\u043E\u0440 \u0441 \u0424\u041D\u0421 \u0440\u0435\u0448\u0438\u043B\u0438 \u0437\u0430 2 \u043C\u0435\u0441\u044F\u0446\u0430. \u0414\u043E\u043D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E.',
                  name: '\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u0412.',
                  city: '\u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u0431\u0443\u0440\u0433',
                },
                {
                  text: '\u041E\u0442\u043B\u0438\u0447\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441. \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u041E\u041E\u041E \u043F\u043E\u0434 \u043A\u043B\u044E\u0447 \u0437\u0430 3 \u0434\u043D\u044F, \u0432\u0441\u0451 \u043E\u0431\u044A\u044F\u0441\u043D\u0438\u043B\u0438 \u0438 \u043F\u043E\u043C\u043E\u0433\u043B\u0438 \u0441 \u0432\u044B\u0431\u043E\u0440\u043E\u043C \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u043E\u0433\u043E \u0440\u0435\u0436\u0438\u043C\u0430.',
                  name: '\u041C\u0430\u0440\u0438\u043D\u0430 \u0421.',
                  city: '\u041A\u0430\u0437\u0430\u043D\u044C',
                },
              ].map((review) => (
                <View key={review.name} style={[styles.reviewCard, isTablet && styles.reviewCardTablet]}>
                  <Text style={styles.reviewQuote}>{'\u201C'}</Text>
                  <Text style={styles.reviewText}>{review.text}</Text>
                  <Text style={styles.reviewStars}>{'\u2605\u2605\u2605\u2605\u2605'}</Text>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewCity}>{review.city}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ===== SECTION 8: FAQ ===== */}
        <View style={[styles.section, { backgroundColor: '#F4FBFC' }]}>
          <View style={[styles.sectionInner, innerStyle]}>
            <Text style={styles.sectionTitle}>{'\u0427\u0430\u0441\u0442\u043E \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B'}</Text>

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
                  <Text style={styles.faqQ}>{item.q}</Text>
                  <Text style={styles.faqA}>{item.a}</Text>
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
              {'\u0422\u044B\u0441\u044F\u0447\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432 \u0433\u043E\u0442\u043E\u0432\u044B \u043F\u043E\u043C\u043E\u0447\u044C \u0441 \u0432\u0430\u0448\u0435\u0439 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u043E\u0439 \u0437\u0430\u0434\u0430\u0447\u0435\u0439'}
            </Text>
            <View style={[styles.ctaButtons, isWide && styles.ctaButtonsWide]}>
              <LandingButton
                onPress={() => router.push('/specialists')}
                label={'\u041D\u0430\u0439\u0442\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430'}
                variant="white"
                style={{ minWidth: 200 }}
              />
              <LandingButton
                onPress={() => router.push('/(auth)/email?redirectTo=%2F(dashboard)%2Frequests%2Fnew')}
                label={'\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441'}
                variant="outline-white"
                style={{ minWidth: 200 }}
              />
              <LandingButton
                onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                label={'\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043A\u0430\u043A \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442'}
                variant="outline-white"
                style={{ minWidth: 200 }}
              />
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
    backgroundColor: '#F4FBFC',
  },
  scroll: {
    flexGrow: 1,
  },

  // ---- Hero ----
  heroSection: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
    backgroundColor: '#F4FBFC',
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
    color: '#0F2447',
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
    color: '#4A6B88',
    lineHeight: 26,
    maxWidth: 520,
  },
  heroSubtitleWide: {
    fontSize: 18,
    lineHeight: 28,
  },
  heroCtas: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  heroCtasWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: BorderRadius.lg,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 30px rgba(15, 36, 71, 0.12)' }
      : {
          shadowColor: '#0F2447',
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
    backgroundColor: '#1A5BA8',
    ...(Platform.OS === 'web'
      ? { background: 'linear-gradient(135deg, #1A5BA8 0%, #2368BE 100%)' } as any
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
    color: '#0F2447',
    fontWeight: '600',
    textAlign: 'center',
  },
  launchBannerBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  launchBannerBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ---- Stats Bar ----
  statsSection: {
    width: '100%',
    backgroundColor: '#EBF3FB',
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
    fontWeight: '700',
    color: '#0F2447',
  },
  statLabel: {
    fontSize: 14,
    color: '#4A6B88',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#C0D0EA',
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
    fontWeight: '700',
    color: '#0F2447',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#4A6B88',
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
    backgroundColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTextBlock: {
    gap: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F2447',
  },
  stepDesc: {
    fontSize: 15,
    color: '#4A6B88',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C0D0EA',
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
    fontSize: 15,
    fontWeight: '500',
    color: '#0F2447',
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
    backgroundColor: '#F4FBFC',
  },
  forWhomCardWide: {},
  forWhomImage: {
    width: '100%',
    height: 200,
  },
  forWhomContent: {
    padding: 24,
    gap: 10,
  },
  forWhomTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F2447',
  },
  forWhomSubtitle: {
    fontSize: 15,
    color: '#1A5BA8',
    fontWeight: '500',
    marginBottom: 4,
  },
  forWhomItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  forWhomBullet: {
    fontSize: 16,
    color: '#1A5BA8',
    fontWeight: '700',
    marginTop: 1,
  },
  forWhomText: {
    fontSize: 15,
    color: '#4A6B88',
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
    color: '#1A5BA8',
    fontWeight: '700',
    marginBottom: 4,
  },
  trustTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F2447',
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: 15,
    color: '#4A6B88',
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
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 24,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 12px rgba(15, 36, 71, 0.06)' }
      : {
          shadowColor: '#0F2447',
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
    fontSize: 48,
    color: '#C0D0EA',
    lineHeight: 48,
    fontWeight: '700',
  },
  reviewText: {
    fontSize: 15,
    color: '#0F2447',
    lineHeight: 23,
  },
  reviewStars: {
    fontSize: 16,
    color: '#1A5BA8',
    letterSpacing: 2,
    marginTop: 4,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2447',
    marginTop: 4,
  },
  reviewCity: {
    fontSize: 14,
    color: '#4A6B88',
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
    borderBottomColor: '#C0D0EA',
  },
  faqQ: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2447',
  },
  faqA: {
    fontSize: 15,
    color: '#4A6B88',
    lineHeight: 23,
  },

  // ---- CTA Section ----
  ctaSection: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
    backgroundColor: '#0F2447',
  },
  ctaContent: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#0F2447',
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
    backgroundColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerLogo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
  },
  footerCopy: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },
});
