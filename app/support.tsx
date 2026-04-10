import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Typography, Colors, Spacing } from '../constants/Colors';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Head>
        <title>Контакты — Налоговик</title>
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>{'Контакты'}</Text>
          <Text style={styles.email}>{'support@nalogovic.ru'}</Text>
          <Text style={styles.note}>{'Мы ответим в течение 24 часов'}</Text>
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
    maxWidth: 430,
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
    marginBottom: 8,
  },
  email: {
    fontSize: Typography.fontSize.lg,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  note: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
