import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.infoRow}>
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={s.statBlock}>
      <Feather name={icon as any} size={18} color={Colors.brandPrimary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (interactive view + edit)
// ---------------------------------------------------------------------------

function DefaultProfile() {
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
          <View style={s.avatarLarge}>
            <Text style={s.avatarLargeText}>ЕВ</Text>
          </View>
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
        <View style={s.avatarLarge}>
          <Text style={s.avatarLargeText}>ЕВ</Text>
        </View>
        <View>
          <Text style={s.nameText}>{savedName}</Text>
          <View style={s.roleRow}>
            <Feather name="user" size={14} color={Colors.textMuted} />
            <Text style={s.role}>Клиент</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatBlock icon="file-text" value="5" label="Заявок" />
        <StatBlock icon="check-circle" value="3" label="Завершено" />
        <StatBlock icon="star" value="4.9" label="Рейтинг" />
      </View>

      {/* Info card */}
      <View style={s.card}>
        <InfoRow label="Email" value="elena@mail.ru" icon="mail" />
        <InfoRow label="Город" value={savedCity} icon="map-pin" />
        <InfoRow label="Регистрация" value="15.02.2026" icon="calendar" />
        <InfoRow label="Заявки" value="5 (3 активных)" icon="file-text" />
      </View>

      <Pressable onPress={() => setEditMode(true)} style={s.btn}>
        <Feather name="edit-2" size={16} color={Colors.white} />
        <Text style={s.btnText}>Редактировать</Text>
      </Pressable>

      <Pressable style={s.settingsLink}>
        <Feather name="settings" size={16} color={Colors.textMuted} />
        <Text style={s.settingsLinkText}>Настройки</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingProfile() {
  return (
    <View style={s.container}>
      <View style={s.profileHeader}>
        <SkeletonBlock width={64} height={64} radius={32} />
        <View style={{ gap: 6 }}>
          <SkeletonBlock width={140} height={20} />
          <SkeletonBlock width={60} height={14} />
        </View>
      </View>
      <View style={s.statsRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[s.statBlock, { alignItems: 'center' }]}>
            <SkeletonBlock width={18} height={18} radius={9} />
            <SkeletonBlock width={28} height={20} />
            <SkeletonBlock width={48} height={12} />
          </View>
        ))}
      </View>
      <View style={s.card}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={s.infoRow}>
            <SkeletonBlock width={16} height={16} radius={8} />
            <SkeletonBlock width={60} height={14} />
            <View style={{ flex: 1 }} />
            <SkeletonBlock width={100} height={14} />
          </View>
        ))}
      </View>
      <SkeletonBlock width="100%" height={48} radius={BorderRadius.btn} />
      <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorProfile() {
  return (
    <View style={s.container}>
      <View style={s.errorBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="user-x" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Не удалось загрузить профиль</Text>
        <Text style={s.errorText}>Проверьте подключение и попробуйте снова</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ProfileStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultProfile />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingProfile />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorProfile />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },

  // Profile header
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarLarge: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarLargeText: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  nameText: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  role: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changePhoto: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statBlock: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  // Info card
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  infoValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },

  // Buttons
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Settings link
  settingsLink: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  settingsLinkText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },

  // Edit form
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  inputDisabled: { opacity: 0.5 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hint: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
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

  // Error state
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

  // Skeleton
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7, borderRadius: BorderRadius.md },
});
