import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.infoRow}>
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
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
          <Pressable style={s.changePhotoBtn}>
            <Feather name="camera" size={14} color={Colors.brandPrimary} />
            <Text style={s.changePhoto}>Изменить фото</Text>
          </Pressable>
        </View>
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Имя</Text>
            <TextInput value={name} onChangeText={setName} style={s.input} />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput value="elena@mail.ru" editable={false} style={[s.input, s.inputDisabled]} />
            <View style={s.hintRow}>
              <Feather name="lock" size={12} color={Colors.textMuted} />
              <Text style={s.hint}>Email нельзя изменить</Text>
            </View>
          </View>
          <View style={s.field}>
            <Text style={s.label}>Город</Text>
            <TextInput value={city} onChangeText={setCity} style={s.input} />
          </View>
        </View>
        <View style={s.actions}>
          <Pressable onPress={handleSave} style={s.btnPrimary}>
            <Feather name="check" size={16} color={Colors.white} />
            <Text style={s.btnPrimaryText}>Сохранить</Text>
          </Pressable>
          <Pressable onPress={handleCancel} style={s.btnSecondary}>
            <Text style={s.btnSecondaryText}>Отмена</Text>
          </Pressable>
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
          <View style={s.roleRow}>
            <Feather name="user" size={14} color={Colors.textMuted} />
            <Text style={s.role}>Клиент</Text>
          </View>
        </View>
      </View>
      <View style={s.card}>
        <InfoRow label="Email" value="elena@mail.ru" icon="mail" />
        <InfoRow label="Город" value={savedCity} icon="map-pin" />
        <InfoRow label="Дата регистрации" value="15.02.2026" icon="calendar" />
        <InfoRow label="Заявки" value="5 (3 активных)" icon="file-text" />
      </View>
      <Pressable onPress={() => setEditMode(true)} style={s.btn}>
        <Feather name="edit-2" size={16} color={Colors.white} />
        <Text style={s.btnText}>Редактировать</Text>
      </Pressable>
    </View>
  );
}

export function ProfileStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveProfile />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  nameText: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  role: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changePhoto: { fontSize: Typography.fontSize.base, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textMuted },
  infoValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  inputDisabled: { opacity: 0.5 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hint: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  actions: { gap: Spacing.sm },
  btnPrimary: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnPrimaryText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  btnSecondary: {
    height: 48, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
});
