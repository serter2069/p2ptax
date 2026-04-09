import React from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function FormScreen({ errors, loading, success }: { errors?: Record<string, string>; loading?: boolean; success?: boolean }) {
  return (
    <View style={s.container}>
      {success && (
        <View style={s.overlay}>
          <View style={s.popup}>
            <Text style={s.popupIcon}>{'✓'}</Text>
            <Text style={s.popupTitle}>Заявка создана!</Text>
            <Text style={s.popupText}>Специалисты получат уведомление и смогут откликнуться</Text>
            <View style={s.popupBtn}><Text style={s.popupBtnText}>К моим заявкам</Text></View>
          </View>
        </View>
      )}
      <Text style={s.pageTitle}>Новая заявка</Text>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Заголовок *</Text>
          <TextInput
            value={errors ? 'Де' : ''}
            editable={false}
            placeholder="Кратко опишите задачу"
            placeholderTextColor={Colors.textMuted}
            style={[s.input, errors?.title ? s.inputError : null]}
          />
          {errors?.title && <Text style={s.error}>{errors.title}</Text>}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Описание *</Text>
          <TextInput
            value=""
            editable={false}
            placeholder="Подробно опишите, что нужно сделать..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={[s.textarea, errors?.description ? s.inputError : null]}
          />
          {errors?.description && <Text style={s.error}>{errors.description}</Text>}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Город *</Text>
          <View style={[s.select, errors?.city ? s.inputError : null]}>
            <Text style={s.selectText}>Выберите город</Text>
            <Text style={s.selectArrow}>{'>'}</Text>
          </View>
          {errors?.city && <Text style={s.error}>{errors.city}</Text>}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Услуга *</Text>
          <View style={s.select}>
            <Text style={s.selectText}>Выберите услугу</Text>
            <Text style={s.selectArrow}>{'>'}</Text>
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Бюджет</Text>
          <TextInput
            value=""
            editable={false}
            placeholder="Например: 5 000 — 10 000 ₽"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
          />
        </View>
      </View>
      <View style={[s.btn, loading ? s.btnLoading : null]}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={s.btnText}>Создать заявку</Text>
        )}
      </View>
    </View>
  );
}

export function MyRequestsNewStates() {
  return (
    <>
      <StateSection title="FORM">
        <FormScreen />
      </StateSection>
      <StateSection title="VALIDATION_ERROR">
        <FormScreen errors={{
          title: 'Заголовок должен содержать минимум 5 символов',
          description: 'Обязательное поле',
          city: 'Выберите город',
        }} />
      </StateSection>
      <StateSection title="LOADING">
        <FormScreen loading />
      </StateSection>
      <StateSection title="SUCCESS_POPUP">
        <FormScreen success />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 96, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: Colors.statusError },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
  select: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  selectText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  selectArrow: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnLoading: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 340,
  },
  popupIcon: { fontSize: 48, color: Colors.statusSuccess },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  popupBtn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  popupBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
