import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '../constants/Colors';
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
    <View className="flex-1 bg-bgPrimary">
      <Head>
        <title>Политика конфиденциальности — Налоговик</title>
        <meta name="description" content="Политика конфиденциальности платформы Налоговик. Как мы обрабатываем и защищаем ваши данные." />
        <meta property="og:title" content="Политика конфиденциальности — Налоговик" />
        <meta property="og:description" content="Политика конфиденциальности платформы Налоговик." />
        <meta property="og:type" content="website" />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-[700px] self-center px-4 py-8 gap-4">
          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          ) : error ? (
            <Text className="text-base text-statusError text-center mt-10">{error}</Text>
          ) : privacy ? (
            <>
              <Text className="text-2xl font-bold text-textPrimary mb-1">{privacy.title}</Text>
              <Text className="text-sm text-textMuted mb-3">
                Обновлено: {privacy.updatedAt}
              </Text>
              {Platform.OS === 'web' ? (
                <div
                  dangerouslySetInnerHTML={{ __html: privacy.content }}
                  style={{ color: Colors.textSecondary, lineHeight: '1.7' }}
                />
              ) : (
                <Text className="text-base text-textSecondary leading-[26px]">{privacy.content}</Text>
              )}
            </>
          ) : null}
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
