import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function SettingRow({ label, value, danger, onPress }: { label: string; value?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <Text style={[s.rowLabel, danger ? s.rowLabelDanger : null]}>{label}</Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      <Text style={s.rowArrow}>{'>'}</Text>
    </Pressable>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={s.row}>
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
          <ToggleRow label="Email-уведомления" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
          <ToggleRow label="Push-уведомления" enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
          <ToggleRow label="Уведомления о новых откликах" enabled={responseNotif} onToggle={() => setResponseNotif(!responseNotif)} />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Аккаунт</Text>
        <View style={s.card}>
          <SettingRow label="Email" value="elena@mail.ru" />
          <SettingRow label="Язык" value="Русский" />
          <SettingRow label="Тема" value="Светлая" />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Прочее</Text>
        <View style={s.card}>
          <SettingRow label="Политика конфиденциальности" />
          <SettingRow label="Условия использования" />
          <SettingRow label="Версия" value="1.0.0" />
        </View>
      </View>

      <View style={s.dangerCard}>
        <SettingRow label="Выйти из аккаунта" danger />
        <SettingRow label="Удалить аккаунт" danger />
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
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dangerCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: '#fde8e8', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  rowLabel: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  rowLabelDanger: { color: Colors.statusError },
  rowValue: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginRight: Spacing.sm },
  rowArrow: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: Colors.brandPrimary },
  toggleDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF',
  },
  toggleDotOn: { alignSelf: 'flex-end' },
});
