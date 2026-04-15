import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

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

// ---------------------------------------------------------------------------
// LOADING state — fetching terms content
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable style={s.closeBtn}>
          <Feather name="x" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Условия использования</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={s.content}>
        <View style={[s.skelLine, { width: '60%', height: 18 }]} />
        <View style={[s.skelLine, { width: '100%' }]} />
        <View style={[s.skelLine, { width: '100%' }]} />
        <View style={[s.skelLine, { width: '80%' }]} />
        <View style={{ height: Spacing.lg }} />
        <View style={[s.skelLine, { width: '50%', height: 18 }]} />
        <View style={[s.skelLine, { width: '100%' }]} />
        <View style={[s.skelLine, { width: '90%' }]} />
        <View style={[s.skelLine, { width: '70%' }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function TermsStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="LOADED" pageId="terms">
        <LoadedState />
      </StateSection>

      <StateSection title="LOADING" pageId="terms">
        <LoadingState />
      </StateSection>
    </View>
  );
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
