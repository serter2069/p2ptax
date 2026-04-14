import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function FormScreen() {
  const [price, setPrice] = useState('4 500');
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');
  const [deadline, setDeadline] = useState('2 рабочих дня');

  return (
    <View style={s.container}>
      <View style={s.requestInfo}>
        <View style={s.requestTitleRow}>
          <Feather name="file-text" size={16} color={Colors.brandPrimary} />
          <Text style={s.requestTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        </View>
        <View style={s.requestMeta}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={s.metaText}>Москва</Text>
          <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
          <Text style={s.metaText}>3 000 — 5 000 &#8381;</Text>
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
  container: { padding: Spacing.lg, gap: Spacing.lg },
  requestInfo: {
    backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: BorderRadius.card, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  requestTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  requestTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  requestMeta: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  metaText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  inputWrap: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  inputInner: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  textarea: {
    minHeight: 100, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
