import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native';
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

function InteractiveProfile() {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('Елена Васильева');
  const [city, setCity] = useState('Москва');
  const [savedName, setSavedName] = useState('Елена Васильева');
  const [savedCity, setSavedCity] = useState('Москва');

  const handleSave = () => {
    setSavedName(name);
    setSavedCity(city);
    setEditMode(false);
  };

  const handleCancel = () => {
    setName(savedName);
    setCity(savedCity);
    setEditMode(false);
  };

  if (editMode) {
    return (
      <View style={s.container}>
        <View style={s.profileHeader}>
          <Image source={{ uri: 'https://picsum.photos/seed/ElenaV/64/64' }} style={{ width: 64, height: 64, borderRadius: 32 }} />
          <Pressable><Text style={s.changePhoto}>Изменить фото</Text></Pressable>
        </View>
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Имя</Text>
            <TextInput value={name} onChangeText={setName} style={s.input} />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput value="elena@mail.ru" editable={false} style={[s.input, s.inputDisabled]} />
            <Text style={s.hint}>Email нельзя изменить</Text>
          </View>
          <View style={s.field}>
            <Text style={s.label}>Город</Text>
            <TextInput value={city} onChangeText={setCity} style={s.input} />
          </View>
        </View>
        <View style={s.actions}>
          <Pressable onPress={handleSave} style={s.btnPrimary}><Text style={s.btnPrimaryText}>Сохранить</Text></Pressable>
          <Pressable onPress={handleCancel} style={s.btnSecondary}><Text style={s.btnSecondaryText}>Отмена</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.profileHeader}>
        <Image source={{ uri: 'https://picsum.photos/seed/ElenaV/64/64' }} style={{ width: 64, height: 64, borderRadius: 32 }} />
        <View>
          <Text style={s.nameText}>{savedName}</Text>
          <Text style={s.role}>Клиент</Text>
        </View>
      </View>
      <View style={s.card}>
        <InfoRow label="Email" value="elena@mail.ru" />
        <InfoRow label="Город" value={savedCity} />
        <InfoRow label="Дата регистрации" value="15.02.2026" />
        <InfoRow label="Заявки" value="5 (3 активных)" />
      </View>
      <Pressable onPress={() => setEditMode(true)} style={s.btn}><Text style={s.btnText}>Редактировать</Text></Pressable>
    </View>
  );
}

function LoadingProfile() {
  return (
    <View style={s.container}>
      <View style={s.profileHeader}>
        <View style={[s.avatar, s.skeleton]} />
        <View style={{ gap: Spacing.sm }}>
          <View style={[s.skeleton, { width: 140, height: 18, borderRadius: BorderRadius.sm }]} />
          <View style={[s.skeleton, { width: 60, height: 14, borderRadius: BorderRadius.sm }]} />
        </View>
      </View>
      <View style={s.card}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={s.infoRow}>
            <View style={[s.skeleton, { width: 80, height: 14, borderRadius: BorderRadius.sm }]} />
            <View style={[s.skeleton, { width: 120, height: 14, borderRadius: BorderRadius.sm }]} />
          </View>
        ))}
      </View>
      <View style={[s.skeleton, { height: 48, borderRadius: BorderRadius.md }]} />
    </View>
  );
}

export function ProfileStates() {
  return (
    <>
      <StateSection title="INTERACTIVE">
        <InteractiveProfile />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingProfile />
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
  nameText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
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
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
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
  btnPrimaryText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  btnSecondary: {
    height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  skeleton: { backgroundColor: Colors.bgSecondary },
});
