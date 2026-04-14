import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function SettingRow({ label, value, danger, icon, onPress }: { label: string; value?: string; danger?: boolean; icon?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      {icon && <Feather name={icon as any} size={18} color={danger ? Colors.statusError : Colors.textMuted} />}
      <Text style={[s.rowLabel, danger ? s.rowLabelDanger : null]}>{label}</Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({ label, icon, enabled, onToggle }: { label: string; icon: string; enabled: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={s.row}>
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <Text style={s.rowLabel}>{label}</Text>
      <View style={[s.toggle, enabled ? s.toggleOn : null]}>
        <View style={[s.toggleDot, enabled ? s.toggleDotOn : null]} />
      </View>
    </Pressable>
  );
}

function InteractiveSettings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [responseNotif, setResponseNotif] = useState(true);

  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Настройки</Text>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Уведомления</Text>
        <View style={s.card}>
          <ToggleRow label="Email-уведомления" icon="mail" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
          <ToggleRow label="Push-уведомления" icon="bell" enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
          <ToggleRow label="Уведомления о новых откликах" icon="message-circle" enabled={responseNotif} onToggle={() => setResponseNotif(!responseNotif)} />
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
        <Text style={s.sectionTitle}>Прочее</Text>
        <View style={s.card}>
          <SettingRow label="Политика конфиденциальности" icon="shield" />
          <SettingRow label="Условия использования" icon="file-text" />
          <SettingRow label="Версия" value="1.0.0" icon="info" />
        </View>
      </View>

      <View style={s.dangerCard}>
        <SettingRow label="Выйти из аккаунта" danger icon="log-out" />
        <SettingRow label="Удалить аккаунт" danger icon="trash-2" />
      </View>
    </View>
  );
}

export function SettingsStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveSettings />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm,
  },
  dangerCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.statusBg.error, overflow: 'hidden', ...Shadows.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  rowLabel: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  rowLabelDanger: { color: Colors.statusError },
  rowValue: { fontSize: Typography.fontSize.base, color: Colors.textMuted, marginRight: Spacing.sm },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: Colors.brandPrimary },
  toggleDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white,
  },
  toggleDotOn: { alignSelf: 'flex-end' },
});
