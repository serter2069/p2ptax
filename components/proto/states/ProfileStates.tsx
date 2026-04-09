import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function ViewMode() {
  return (
    <View style={s.container}>
      <View style={s.profileHeader}>
        <View style={s.avatar}><Text style={s.avatarText}>ЕВ</Text></View>
        <View>
          <Text style={s.name}>Елена Васильева</Text>
          <Text style={s.role}>Клиент</Text>
        </View>
      </View>
      <View style={s.card}>
        <InfoRow label="Email" value="elena@mail.ru" />
        <InfoRow label="Город" value="Москва" />
        <InfoRow label="Дата регистрации" value="15.02.2026" />
        <InfoRow label="Заявки" value="5 (3 активных)" />
      </View>
      <View style={s.btn}><Text style={s.btnText}>Редактировать</Text></View>
    </View>
  );
}

function EditMode() {
  return (
    <View style={s.container}>
      <View style={s.profileHeader}>
        <View style={s.avatar}><Text style={s.avatarText}>ЕВ</Text></View>
        <Text style={s.changePhoto}>Изменить фото</Text>
      </View>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Имя</Text>
          <TextInput value="Елена Васильева" editable={false} style={s.input} />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <TextInput value="elena@mail.ru" editable={false} style={[s.input, s.inputDisabled]} />
          <Text style={s.hint}>Email нельзя изменить</Text>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Город</Text>
          <TextInput value="Москва" editable={false} style={s.input} />
        </View>
      </View>
      <View style={s.actions}>
        <View style={s.btnPrimary}><Text style={s.btnPrimaryText}>Сохранить</Text></View>
        <View style={s.btnSecondary}><Text style={s.btnSecondaryText}>Отмена</Text></View>
      </View>
    </View>
  );
}

export function ProfileStates() {
  return (
    <>
      <StateSection title="VIEW">
        <ViewMode />
      </StateSection>
      <StateSection title="EDIT_MODE">
        <EditMode />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  name: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  role: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  changePhoto: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  infoValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  inputDisabled: { opacity: 0.5 },
  hint: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  actions: { gap: Spacing.sm },
  btnPrimary: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  btnSecondary: {
    height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
});
