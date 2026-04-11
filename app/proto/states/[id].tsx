import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { pageRegistry } from '../../../constants/pageRegistry';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function StateSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

function PlaceholderState({ pageId, stateName }: { pageId: string; stateName: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>📋</Text>
      <Text style={styles.placeholderTitle}>{stateName}</Text>
      <Text style={styles.placeholderSub}>Page: {pageId}</Text>
    </View>
  );
}

function getStatesForPage(pageId: string) {
  const stateMap: Record<string, { name: string }[]> = {
    'landing': [
      { name: 'Гость видит лендинг' },
      { name: 'Гость вводит описание задачи' },
      { name: 'Гость вводит email и отправляет' },
    ],
    'auth-email': [
      { name: 'Пустая форма' },
      { name: 'Валидный email введён' },
      { name: 'Ошибка — неверный формат email' },
    ],
    'auth-otp': [
      { name: 'Пустые поля ввода кода' },
      { name: 'Код частично введён' },
      { name: 'Ошибка — неверный код' },
    ],
    'onboarding-username': [
      { name: 'Пустое поле имени' },
      { name: 'Имя введено, доступно' },
    ],
    'onboarding-work-area': [
      { name: 'Пустая форма выбора города и услуг' },
      { name: 'Город выбран, услуги частично' },
      { name: 'Все поля заполнены' },
    ],
    'onboarding-profile': [
      { name: 'Пустой профиль' },
      { name: 'Фото загружено, описание введено' },
    ],
    'client-dashboard': [
      { name: 'Новый пользователь — нет запросов' },
      { name: 'Есть активные запросы' },
      { name: 'Диалоги с специалистами' },
    ],
    'my-requests': [
      { name: 'Нет запросов (empty state)' },
      { name: 'Список активных запросов' },
      { name: 'Список закрытых запросов' },
      { name: 'Закрытие запроса (подтверждение)' },
    ],
    'my-request-detail': [
      { name: 'Запрос без откликов' },
      { name: 'Запрос с откликами' },
      { name: 'Запрос закрыт' },
    ],
    'create-request': [
      { name: 'Пустая форма' },
      { name: 'Ошибка валидации' },
      { name: 'Успешная отправка' },
    ],
    'my-responses': [
      { name: 'Нет откликов (empty state)' },
      { name: 'Список откликов' },
      { name: 'Детали отклика' },
    ],
    'specialist-dashboard': [
      { name: 'Новый специалист — нет откликов' },
      { name: 'Есть активные запросы в городе' },
      { name: 'Статистика и продвижение' },
    ],
    'specialist-profile': [
      { name: 'Пустой профиль — создание' },
      { name: 'Частично заполненный профиль' },
      { name: 'Полностью заполненный профиль' },
      { name: 'Ошибка — ник занят' },
    ],
    'specialist-catalog': [
      { name: 'Пустой каталог (нет специалистов)' },
      { name: 'Список специалистов' },
      { name: 'Фильтрация по городу' },
    ],
    'specialist-detail': [
      { name: 'Профиль без услуг' },
      { name: 'Полный профиль с услугами' },
      { name: 'Гость — просьба войти' },
    ],
    'city-requests': [
      { name: 'Нет городов в профиле' },
      { name: 'Запросы найдены' },
      { name: 'Отправка отклика' },
    ],
    'promotion': [
      { name: 'Нет активного продвижения' },
      { name: 'Есть активное продвижение' },
      { name: 'Покупка продвижения' },
    ],
    'requests-feed': [
      { name: 'Нет запросов (empty state)' },
      { name: 'Список запросов' },
      { name: 'Пагинация — загрузка ещё' },
    ],
    'admin-moderation': [
      { name: 'Очередь модерации пуста' },
      { name: 'Профили на модерации' },
      { name: 'Одобрение/отклонение' },
    ],
    'admin-users': [
      { name: 'Список пользователей' },
      { name: 'Детали пользователя' },
    ],
  };
  return stateMap[pageId] || [{ name: 'Default state' }];
}

export default function ProtoStatesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = pageRegistry.find((p) => p.id === id);

  if (!page) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Page "{id}" not found in registry</Text>
      </View>
    );
  }

  const states = getStatesForPage(page.id);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{page.title}</Text>
        <Text style={styles.headerRoute}>{page.route}</Text>
        <Text style={styles.headerMeta}>
          Group: {page.group} | States: {page.stateCount}
        </Text>
      </View>

      {states.map((state, idx) => (
        <StateSection key={idx} title={`State ${idx + 1}: ${state.name}`}>
          <PlaceholderState pageId={page.id} stateName={state.name} />
        </StateSection>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerRoute: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  headerMeta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  section: {
    width: '100%',
    maxWidth: 430,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  sectionContent: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.xl,
  },
  placeholder: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['3xl'],
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  placeholderSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  notFoundText: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusError,
    textAlign: 'center',
  },
});
