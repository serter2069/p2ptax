import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Страница не найдена</Text>
        <Text style={styles.subtitle}>
          Кажется, такой страницы не существует. Возможно, ссылка устарела.
        </Text>
        <Button onPress={() => router.replace('/')} style={styles.btn}>
          На главную
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.lg,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
  code: {
    fontSize: 72,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    lineHeight: 80,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.md,
  },
});
