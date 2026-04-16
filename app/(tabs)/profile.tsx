import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary }}>{value}</Text>
    </View>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm }}>
      <Feather name={icon as any} size={18} color={Colors.brandPrimary} />
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('Елена Васильева');
  const [city, setCity] = useState('Москва');
  const [savedName, setSavedName] = useState('Елена Васильева');
  const [savedCity, setSavedCity] = useState('Москва');

  const handleSave = () => { setSavedName(name); setSavedCity(city); setEditMode(false); };
  const handleCancel = () => { setName(savedName); setCity(savedCity); setEditMode(false); };

  if (editMode) {
    return (
      <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>ЕВ</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="camera" size={14} color={Colors.brandPrimary} />
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium }}>Изменить фото</Text>
          </Pressable>
        </View>
        <View style={{ gap: Spacing.lg }}>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Имя</Text>
            <TextInput value={name} onChangeText={setName} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, outlineStyle: 'none' } as any} />
          </View>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Email</Text>
            <TextInput value="elena@mail.ru" editable={false} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, opacity: 0.5, outlineStyle: 'none' } as any} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Feather name="lock" size={12} color={Colors.textMuted} /><Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>Email нельзя изменить</Text></View>
          </View>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Город</Text>
            <TextInput value={city} onChangeText={setCity} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, outlineStyle: 'none' } as any} />
          </View>
        </View>
        <View style={{ gap: Spacing.sm }}>
          <Pressable onPress={handleSave} style={{ height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm }}>
            <Feather name="check" size={16} color={Colors.white} /><Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Сохранить</Text>
          </Pressable>
          <Pressable onPress={handleCancel} style={{ height: 48, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textMuted }}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>ЕВ</Text>
        </View>
        <View>
          <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>{savedName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}><Feather name="user" size={14} color={Colors.textMuted} /><Text style={{ fontSize: Typography.fontSize.base, color: Colors.textMuted }}>Клиент</Text></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <StatBlock icon="file-text" value="5" label="Заявок" />
        <StatBlock icon="check-circle" value="3" label="Завершено" />
        <StatBlock icon="star" value="4.9" label="Рейтинг" />
      </View>
      <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm }}>
        <InfoRow label="Email" value="elena@mail.ru" icon="mail" />
        <InfoRow label="Город" value={savedCity} icon="map-pin" />
        <InfoRow label="Регистрация" value="15.02.2026" icon="calendar" />
        <InfoRow label="Заявки" value="5 (3 активных)" icon="file-text" />
      </View>
      <Pressable onPress={() => setEditMode(true)} style={{ height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm }}>
        <Feather name="edit-2" size={16} color={Colors.white} /><Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Редактировать</Text>
      </Pressable>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: BorderRadius.card, borderWidth: 1, borderColor: Colors.border }} onPress={() => router.push('/(tabs)/settings' as any)}>
        <Feather name="settings" size={16} color={Colors.textMuted} />
        <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textPrimary }}>Настройки</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
      </Pressable>
    </View>
  );
}
