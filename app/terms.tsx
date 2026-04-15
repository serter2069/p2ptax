import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

// ---------------------------------------------------------------------------
// LOADED state — terms content rendered
// ---------------------------------------------------------------------------
function LoadedState() {
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.closeBtn}>
          <Feather name="x" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Условия использования</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <View style={s.content}>
        <Text style={s.sectionTitle}>1. Общие положения</Text>
        <Text style={s.paragraph}>
          Настоящие Условия использования (далее — «Условия») регулируют порядок использования
          платформы «Налоговик» (далее — «Платформа»), предоставляющей услуги по поиску и подбору
          налоговых специалистов.
        </Text>
        <Text style={s.paragraph}>
          Используя Платформу, вы подтверждаете, что ознакомились с настоящими Условиями и принимаете
          их в полном объёме.
        </Text>

        <Text style={s.sectionTitle}>2. Регистрация и учётная запись</Text>
        <Text style={s.paragraph}>
          Для использования функций Платформы необходимо пройти регистрацию, указав действующий
          адрес электронной почты. Авторизация осуществляется посредством одноразового кода (OTP),
          направляемого на указанный email.
        </Text>
        <Text style={s.paragraph}>
          Пользователь несёт ответственность за сохранность доступа к своей электронной почте и
          учётной записи на Платформе.
        </Text>

        <Text style={s.sectionTitle}>3. Роли пользователей</Text>
        <Text style={s.paragraph}>
          На Платформе предусмотрены следующие роли: Клиент и Специалист. Клиент может создавать
          заявки на налоговые услуги. Специалист может откликаться на заявки и оказывать услуги.
        </Text>

        <Text style={s.sectionTitle}>4. Ограничение ответственности</Text>
        <Text style={s.paragraph}>
          Платформа является информационным посредником и не несёт ответственности за качество
          услуг, оказываемых специалистами. Все финансовые расчёты между клиентами и специалистами
          осуществляются напрямую, без участия Платформы.
        </Text>

        <Text style={s.sectionTitle}>5. Конфиденциальность</Text>
        <Text style={s.paragraph}>
          Платформа обрабатывает персональные данные пользователей в соответствии с Политикой
          конфиденциальности. Данные не передаются третьим лицам без согласия пользователя, за
          исключением случаев, предусмотренных законодательством.
        </Text>

        <Text style={s.sectionTitle}>6. Изменение условий</Text>
        <Text style={s.paragraph}>
          Администрация Платформы оставляет за собой право вносить изменения в настоящие Условия.
          Актуальная версия всегда доступна на данной странице.
        </Text>

        <Text style={s.updated}>Последнее обновление: 01.04.2026</Text>
      </View>
    </View>
  );
}

export default function TermsPage() {
  return <LoadedState />;
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { gap: 0 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Content
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  paragraph: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  updated: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },

  // Skeleton
  skelLine: {
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.bgSecondary,
  },
});
