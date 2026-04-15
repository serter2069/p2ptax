import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function SettingRow({ label, value, danger, icon, onPress }: { label: string; value?: string; danger?: boolean; icon?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      {icon && <Feather name={icon as any} size={18} color={danger ? Colors.statusError : Colors.textMuted} />}
      <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({ label, icon, enabled, onToggle }: { label: string; icon: string; enabled: boolean; onToggle: () => void }) {
  return (
    <View style={s.row}>
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <Text style={s.rowLabel}>{label}</Text>
      <Switch value={enabled} onValueChange={() => onToggle()} trackColor={{ false: '#D1D5DB', true: '#0284C7' }} thumbColor="#fff" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (interactive)
// ---------------------------------------------------------------------------

function DefaultSettings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [responseNotif, setResponseNotif] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Настройки</Text>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Уведомления</Text>
        <View style={s.card}>
          <ToggleRow label="Email-уведомления" icon="mail" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
          <ToggleRow label="Push-уведомления" icon="bell" enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
          <ToggleRow label="Новые отклики" icon="message-circle" enabled={responseNotif} onToggle={() => setResponseNotif(!responseNotif)} />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Аккаунт</Text>
        <View style={s.card}>
          <SettingRow label="Email" value="elena@mail.ru" icon="mail" />
          <SettingRow label="Язык" value="Русский" icon="globe" />
          <SettingRow label="Тема" value="Светлая" icon="sun" />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Информация</Text>
        <View style={s.card}>
          <SettingRow label="Политика конфиденциальности" icon="shield" />
          <SettingRow label="Условия использования" icon="file-text" />
          <SettingRow label="Версия" value="1.0.0" icon="info" />
        </View>
      </View>

      <View style={s.dangerSection}>
        <Pressable onPress={() => setShowLogout(!showLogout)} style={s.dangerBtn}>
          <Feather name="log-out" size={18} color={Colors.statusError} />
          <Text style={s.dangerBtnText}>Выйти из аккаунта</Text>
        </Pressable>
        {showLogout && (
          <View style={s.confirmCard}>
            <Text style={s.confirmText}>Вы уверены, что хотите выйти?</Text>
            <View style={s.confirmActions}>
              <Pressable onPress={() => setShowLogout(false)} style={s.confirmBtnCancel}>
                <Text style={s.confirmBtnCancelText}>Отмена</Text>
              </Pressable>
              <Pressable style={s.confirmBtnDanger}>
                <Text style={s.confirmBtnDangerText}>Выйти</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable onPress={() => setShowDelete(!showDelete)} style={[s.dangerBtn, s.dangerBtnOutline]}>
          <Feather name="trash-2" size={18} color={Colors.statusError} />
          <Text style={s.dangerBtnText}>Удалить аккаунт</Text>
        </Pressable>
        {showDelete && (
          <View style={s.confirmCard}>
            <Text style={s.confirmText}>Это действие необратимо. Все данные будут удалены.</Text>
            <View style={s.confirmActions}>
              <Pressable onPress={() => setShowDelete(false)} style={s.confirmBtnCancel}>
                <Text style={s.confirmBtnCancelText}>Отмена</Text>
              </Pressable>
              <Pressable style={s.confirmBtnDanger}>
                <Text style={s.confirmBtnDangerText}>Удалить</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingSettings() {
  return (
    <View style={s.container}>
      <SkeletonBlock width="40%" height={22} />
      {[1, 2, 3].map(section => (
        <View key={section} style={s.section}>
          <SkeletonBlock width={100} height={14} />
          <View style={s.card}>
            {[1, 2, 3].map(row => (
              <View key={row} style={[s.row, { justifyContent: 'flex-start' }]}>
                <SkeletonBlock width={18} height={18} radius={9} />
                <SkeletonBlock width="50%" height={14} />
                <View style={{ flex: 1 }} />
                <SkeletonBlock width={44} height={24} radius={12} />
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorSettings() {
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Настройки</Text>
      <View style={s.errorBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="settings" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Не удалось загрузить настройки</Text>
        <Text style={s.errorText}>Попробуйте обновить страницу</Text>
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

export function SettingsStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultSettings />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingSettings />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorSettings />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  rowLabel: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  rowLabelDanger: { color: Colors.statusError },
  rowValue: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginRight: Spacing.sm },
  // Danger section
  dangerSection: { gap: Spacing.sm },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, backgroundColor: Colors.statusBg.error, borderRadius: BorderRadius.btn,
  },
  dangerBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.statusBg.error,
  },
  dangerBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.statusError },

  // Confirm dialog
  confirmCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.statusBg.error, gap: Spacing.md, ...Shadows.sm,
  },
  confirmText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: Spacing.sm },
  confirmBtnCancel: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  confirmBtnCancelText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  confirmBtnDanger: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.statusError,
  },
  confirmBtnDangerText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

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
