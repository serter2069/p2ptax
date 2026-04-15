import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';
import { api } from '../lib/api';

interface TermsResponse {
  title: string;
  content: string;
  updatedAt: string;
}

export default function TermsScreen() {
  const router = useRouter();
  const [terms, setTerms] = useState<TermsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<TermsResponse>('/content/terms')
      .then(setTerms)
      .catch(() => setError('Не удалось загрузить условия использования'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bgPrimary">
      <Head>
        <title>Пользовательское соглашение — Налоговик</title>
        <meta name="description" content="Пользовательское соглашение платформы Налоговик. Условия использования сервиса." />
        <meta property="og:title" content="Пользовательское соглашение — Налоговик" />
        <meta property="og:description" content="Пользовательское соглашение платформы Налоговик." />
        <meta property="og:type" content="website" />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingHeader />

      {/* Header bar */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-borderLight">
        <Pressable
          className="w-8 h-8 rounded-full bg-bgSecondary items-center justify-center"
          onPress={() => router.back()}
        >
          <Feather name="x" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text className="text-lg font-semibold text-textPrimary">Условия использования</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-[700px] self-center p-6 gap-3">
          {loading ? (
            /* Skeleton loading state */
            <>
              <View className="bg-bgSecondary rounded h-[18px] w-[60%]" />
              <View className="bg-bgSecondary rounded h-3 w-full" />
              <View className="bg-bgSecondary rounded h-3 w-full" />
              <View className="bg-bgSecondary rounded h-3 w-[80%]" />
              <View className="h-6" />
              <View className="bg-bgSecondary rounded h-[18px] w-[50%]" />
              <View className="bg-bgSecondary rounded h-3 w-full" />
              <View className="bg-bgSecondary rounded h-3 w-[90%]" />
              <View className="bg-bgSecondary rounded h-3 w-[70%]" />
            </>
          ) : error ? (
            <Text className="text-base text-statusError text-center mt-10">{error}</Text>
          ) : terms ? (
            <>
              {Platform.OS === 'web' ? (
                <div
                  dangerouslySetInnerHTML={{ __html: terms.content }}
                  style={{ color: Colors.textSecondary, lineHeight: '1.7' }}
                />
              ) : (
                <Text className="text-base text-textSecondary leading-[22px]">{terms.content}</Text>
              )}
              <Text className="text-sm text-textMuted mt-5 text-center">
                Последнее обновление: {terms.updatedAt}
              </Text>
            </>
          ) : null}
        </View>
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}
