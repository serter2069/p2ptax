import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

const FEATURES = [
  'Проверенные специалисты',
  'Быстро и удобно',
  'Безопасная оплата',
];

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>⚖️</Text>
            </View>
            <Text style={styles.appName}>Налоговик</Text>
            <Text style={styles.tagline}>
              Найди специалиста по налогам{'\n'}в своём городе
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Quick access */}
          <View style={styles.quickAccess}>
            <Button
              onPress={() => router.push('/specialists')}
              variant="secondary"
              style={styles.btn}
            >
              Каталог специалистов
            </Button>
            <Button
              onPress={() => router.push('/requests')}
              variant="secondary"
              style={styles.btn}
            >
              Лента запросов
            </Button>
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <Button
              onPress={() => router.push('/(auth)/email?role=CLIENT')}
              variant="primary"
              style={styles.btn}
            >
              Войти как заказчик
            </Button>
            <Button
              onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
              variant="secondary"
              style={styles.btn}
            >
              Я специалист / Зарегистрироваться
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing['3xl'],
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing['4xl'],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brandPrimary,
  },
  logoEmoji: {
    fontSize: Typography.fontSize.display,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  features: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureCheck: {
    fontSize: Typography.fontSize.md,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.bold,
  },
  featureText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  quickAccess: {
    width: '100%',
    gap: Spacing.md,
  },
  ctas: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  btn: {
    width: '100%',
  },
});
