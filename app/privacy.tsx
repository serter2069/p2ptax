import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Typography, Colors, Spacing } from '../constants/Colors';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';
import { api } from '../lib/api';

interface PrivacyResponse {
  title: string;
  content: string;
  updatedAt: string;
}

export default function PrivacyScreen() {
  const [privacy, setPrivacy] = useState<PrivacyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PrivacyResponse>('/content/privacy')
      .then(setPrivacy)
      .catch(() => setError('Не удалось загрузить политику конфиденциальности'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Head>
        <title>Политика конфиденциальности — Налоговик</title>
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : privacy ? (
            <>
              <Text style={styles.title}>{privacy.title}</Text>
              <Text style={styles.updatedAt}>
                Обновлено: {privacy.updatedAt}
              </Text>
              {Platform.OS === 'web' ? (
                <div
                  dangerouslySetInnerHTML={{ __html: privacy.content }}
                  style={{ color: Colors.textSecondary, lineHeight: '1.7' }}
                />
              ) : (
                <Text style={styles.htmlFallback}>{privacy.content}</Text>
              )}
            </>
          ) : null}
        </View>
        <Footer />
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
  },
  container: {
    maxWidth: 700,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['4xl'],
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  updatedAt: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  error: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusError,
    textAlign: 'center',
    marginTop: 40,
  },
  htmlFallback: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
});
