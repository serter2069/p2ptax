import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function Screen({ initialFilled }: { initialFilled?: boolean }) {
  const [about, setAbout] = useState(initialFilled ? 'Налоговый консультант с опытом работы 8 лет. Специализация — НДФЛ, имущественные вычеты, регистрация ИП.' : '');
  const [price, setPrice] = useState(initialFilled ? '2 000' : '');

  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '100%' }]} /></View>
      <Text style={s.step}>Шаг 5 из 5</Text>
      <Text style={s.title}>Расскажите о себе</Text>
      <Text style={s.subtitle}>Информация поможет клиентам выбрать вас</Text>
      <View style={s.form}>
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Feather name="user" size={28} color={Colors.brandPrimary} />
          </View>
          <Pressable><Text style={s.avatarHint}>Загрузить фото</Text></Pressable>
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
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Например: 2 000"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
          />
        </View>
      </View>
      <Pressable style={s.btn}>
        <Text style={s.btnText}>Завершить регистрацию</Text>
      </Pressable>
    </View>
  );
}

export function OnboardingProfileStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <Screen />
      </StateSection>
      <StateSection title="FILLED">
        <Screen initialFilled />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing.lg },
  progress: { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Colors.statusSuccess, borderRadius: 2 },
  step: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  form: { gap: Spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
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
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
