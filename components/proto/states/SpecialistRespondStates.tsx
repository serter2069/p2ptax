import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (form)
// ---------------------------------------------------------------------------

function FormScreen() {
  const [price, setPrice] = useState('4 500');
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');
  const [deadline, setDeadline] = useState('2 рабочих дня');

  return (
    <View style={s.container}>
      <View style={s.requestInfo}>
        <View style={s.requestBadge}>
          <Text style={s.requestBadgeText}>Заявка #1</Text>
        </View>
        <Text style={s.requestTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        <Text style={s.requestDesc} numberOfLines={2}>
          Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры.
        </Text>
        <View style={s.requestMeta}>
          <View style={s.metaChip}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={s.metaText}>Москва</Text>
          </View>
          <View style={s.metaChip}>
            <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
            <Text style={s.metaText}>3 000 — 5 000 &#8381;</Text>
          </View>
          <View style={s.metaChip}>
            <Feather name="briefcase" size={12} color={Colors.textMuted} />
            <Text style={s.metaText}>Декларация 3-НДФЛ</Text>
          </View>
        </View>
      </View>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Ваша цена *</Text>
          <View style={s.inputWrap}>
            <Feather name="dollar-sign" size={16} color={Colors.textMuted} />
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="Укажите стоимость в рублях"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={s.inputInner}
            />
            <Text style={s.inputSuffix}>₽</Text>
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Сообщение клиенту *</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            style={s.textarea}
          />
          <Text style={s.charCount}>{message.length}/500</Text>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Срок выполнения</Text>
          <View style={s.inputWrap}>
            <Feather name="clock" size={16} color={Colors.textMuted} />
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              style={s.inputInner}
            />
          </View>
        </View>
      </View>

      <Pressable style={s.btn}>
        <Feather name="send" size={16} color={Colors.white} />
        <Text style={s.btnText}>Отправить отклик</Text>
      </Pressable>

      <Pressable style={s.cancelBtn} onPress={() => navigate('specialist-dashboard')}>
        <Text style={s.cancelBtnText}>Отмена</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: SUBMITTING
// ---------------------------------------------------------------------------

function SubmittingScreen() {
  return (
    <View style={s.container}>
      <View style={s.requestInfo}>
        <Text style={s.requestTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        <View style={s.requestMeta}>
          <View style={s.metaChip}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={s.metaText}>Москва</Text>
          </View>
        </View>
      </View>

      <View style={s.submittingBlock}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text style={s.submittingTitle}>Отправка отклика...</Text>
        <Text style={s.submittingText}>Пожалуйста, подождите</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: SUBMITTED (success)
// ---------------------------------------------------------------------------

function SubmittedScreen() {
  return (
    <View style={s.container}>
      <View style={s.successBlock}>
        <View style={s.successIconWrap}>
          <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
        </View>
        <Text style={s.successTitle}>Отклик отправлен!</Text>
        <Text style={s.successText}>
          Клиент получит уведомление о вашем предложении. Вы увидите статус в разделе "Мои отклики".
        </Text>

        <View style={s.successSummary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Заявка</Text>
            <Text style={s.summaryValue}>Декларация 3-НДФЛ</Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Ваша цена</Text>
            <Text style={[s.summaryValue, { color: Colors.brandPrimary }]}>4 500 ₽</Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Срок</Text>
            <Text style={s.summaryValue}>2 рабочих дня</Text>
          </View>
        </View>

        <Pressable style={s.btn} onPress={() => navigate('specialist-my-responses')}>
          <Feather name="list" size={16} color={Colors.white} />
          <Text style={s.btnText}>К моим откликам</Text>
        </Pressable>
        <Pressable style={s.outlineBtn} onPress={() => navigate('specialist-dashboard')}>
          <Text style={s.outlineBtnText}>На главную</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorScreen() {
  return (
    <View style={s.container}>
      <View style={s.errorBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="alert-circle" size={40} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Не удалось отправить отклик</Text>
        <Text style={s.errorText}>Произошла ошибка при отправке. Проверьте подключение и попробуйте снова.</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
        <Pressable style={s.cancelBtn} onPress={() => navigate('specialist-dashboard')}>
          <Text style={s.cancelBtnText}>Вернуться назад</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SpecialistRespondStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <FormScreen />
      </StateSection>
      <StateSection title="SUBMITTING">
        <SubmittingScreen />
      </StateSection>
      <StateSection title="SUBMITTED">
        <SubmittedScreen />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorScreen />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },

  requestInfo: {
    backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: BorderRadius.card, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  requestBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  requestBadgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.textMuted },
  requestTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  requestDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  requestMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bgSurface, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  inputWrap: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.input, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  inputInner: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  inputSuffix: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  textarea: {
    minHeight: 100, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.input, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, alignSelf: 'flex-end' },

  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  cancelBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  outlineBtn: {
    height: 44, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  outlineBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },

  // Submitting
  submittingBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  submittingTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  submittingText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Success
  successBlock: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  successIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.statusBg.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  successText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 300 },

  successSummary: {
    width: '100%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  summaryValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },

  // Error
  errorBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
