import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function Screen({ initialFilled }: { initialFilled?: boolean }) {
  const [about, setAbout] = useState(initialFilled ? 'Налоговый консультант с опытом работы 8 лет. Специализация — НДФЛ, имущественные вычеты, регистрация ИП.' : '');
  const [price, setPrice] = useState(initialFilled ? '2 000' : '');

  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '100%' }]} /></View>
      <Text style={s.step}>Шаг 3 из 3</Text>
      <Text style={s.title}>Расскажите о себе</Text>
      <Text style={s.subtitle}>Информация поможет клиентам выбрать вас</Text>
      <View style={s.form}>
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Feather name="user" size={28} color={Colors.brandPrimary} />
          </View>
          <Pressable style={s.avatarBtnRow}>
            <Feather name="camera" size={14} color={Colors.brandPrimary} />
            <Text style={s.avatarHint}>Загрузить фото</Text>
          </Pressable>
        </View>
        <View style={s.field}>
          <Text style={s.label}>О себе</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            placeholder="Расскажите о вашем опыте и специализации..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={s.textarea}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Стоимость консультации</Text>
          <View style={s.priceWrap}>
            <Feather name="dollar-sign" size={16} color={Colors.textMuted} />
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="Например: 2 000"
              placeholderTextColor={Colors.textMuted}
              style={s.priceInput}
            />
          </View>
        </View>
      </View>
      <Pressable style={s.btn}>
        <Feather name="check" size={16} color={Colors.white} />
        <Text style={s.btnText}>Завершить регистрацию</Text>
      </Pressable>
    </View>
  );
}

export function OnboardingProfileStates() {
  return (
    <StateSection title="DEFAULT">
      <Screen />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing.lg },
  progress: { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Colors.statusSuccess, borderRadius: 2 },
  step: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  form: { gap: Spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatarHint: { fontSize: Typography.fontSize.base, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  textarea: {
    minHeight: 96, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  priceWrap: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.sm,
  },
  priceInput: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary, paddingVertical: 0 },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
