import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';

export default function SupportScreen() {
  return (
    <View className="flex-1 bg-bgPrimary">
      <Head>
        <title>Контакты — Налоговик</title>
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="max-w-lg px-4 py-8 w-full self-center gap-4">
          <Text className="text-2xl font-bold text-textPrimary mb-2">{'Контакты'}</Text>
          <Text className="text-lg text-brandPrimary font-medium">{'support@nalogovic.ru'}</Text>
          <Text className="text-base text-textMuted">{'Мы ответим в течение 24 часов'}</Text>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
