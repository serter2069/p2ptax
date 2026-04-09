import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function Popup({ type, onClose }: { type: 'success' | 'error'; onClose: () => void }) {
  const isSuccess = type === 'success';
  return (
    <View style={s.overlay}>
      <View style={s.popup}>
        <Text style={s.popupIcon}>{isSuccess ? '✓' : '✕'}</Text>
        <Text style={s.popupTitle}>{isSuccess ? 'Отклик отправлен!' : 'Ошибка отправки'}</Text>
        <Text style={s.popupText}>
          {isSuccess
            ? 'Клиент получит уведомление о вашем отклике и сможет связаться с вами'
            : 'Не удалось отправить отклик. Попробуйте ещё раз.'}
        </Text>
        <Pressable onPress={onClose} style={[s.popupBtn, isSuccess ? null : s.popupBtnError]}>
          <Text style={s.popupBtnText}>{isSuccess ? 'К моим откликам' : 'Попробовать снова'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormScreen() {
  const [price, setPrice] = useState('4 500');
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');
  const [deadline, setDeadline] = useState('2 рабочих дня');
  const [popup, setPopup] = useState<'success' | 'error' | null>(null);

  const handleSubmit = () => {
    // Simulate: randomly succeed or fail
    setPopup(Math.random() > 0.3 ? 'success' : 'error');
  };

  return (
    <View style={[s.container, popup ? { minHeight: 500 } : null]}>
      {popup && <Popup type={popup} onClose={() => setPopup(null)} />}
      <View style={s.requestInfo}>
        <Text style={s.requestTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        <View style={s.requestMeta}>
          <Text style={s.metaText}>Москва</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Text style={s.metaText}>3 000 — 5 000 ₽</Text>
        </View>
      </View>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Ваша цена *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Укажите стоимость в рублях"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Сообщение клиенту *</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            style={s.textarea}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Срок выполнения</Text>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            style={s.input}
          />
        </View>
      </View>
      <Pressable onPress={handleSubmit} style={s.btn}><Text style={s.btnText}>Отправить отклик</Text></Pressable>
    </View>
  );
}

export function SpecialistRespondStates() {
  return (
    <StateSection title="INTERACTIVE_FORM">
      <FormScreen />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  requestInfo: {
    backgroundColor: Colors.bgSecondary, padding: Spacing.lg, borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  requestTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  requestMeta: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 80, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
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
  popupIcon: { fontSize: 44, color: Colors.statusSuccess },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  popupBtn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], width: '100%',
  },
  popupBtnError: { backgroundColor: Colors.statusError },
  popupBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
