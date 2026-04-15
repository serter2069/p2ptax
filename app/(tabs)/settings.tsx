import React, { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';

function SettingRow({ label, value, danger, icon, onPress }: { label: string; value?: string; danger?: boolean; icon?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary }}>
      {icon && <Feather name={icon as any} size={18} color={danger ? Colors.statusError : Colors.textMuted} />}
      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: danger ? Colors.statusError : Colors.textPrimary }}>{label}</Text>
      {value && <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginRight: Spacing.sm }}>{value}</Text>}
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({ label, icon, enabled, onToggle }: { label: string; icon: string; enabled: boolean; onToggle: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary }}>
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary }}>{label}</Text>
      <Switch value={enabled} onValueChange={() => onToggle()} trackColor={{ false: '#D1D5DB', true: '#0284C7' }} thumbColor="#fff" />
    </View>
  );
}

export default function SettingsScreen() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [responseNotif, setResponseNotif] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
      <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>Настройки</Text>
      <View style={{ gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Уведомления</Text>
        <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm }}>
          <ToggleRow label="Email-уведомления" icon="mail" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
          <ToggleRow label="Push-уведомления" icon="bell" enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
          <ToggleRow label="Новые отклики" icon="message-circle" enabled={responseNotif} onToggle={() => setResponseNotif(!responseNotif)} />
        </View>
      </View>
      <View style={{ gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Аккаунт</Text>
        <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm }}>
          <SettingRow label="Email" value="elena@mail.ru" icon="mail" />
          <SettingRow label="Язык" value="Русский" icon="globe" />
          <SettingRow label="Тема" value="Светлая" icon="sun" />
        </View>
      </View>
      <View style={{ gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Информация</Text>
        <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm }}>
          <SettingRow label="Политика конфиденциальности" icon="shield" />
          <SettingRow label="Условия использования" icon="file-text" />
          <SettingRow label="Версия" value="1.0.0" icon="info" />
        </View>
      </View>
      <View style={{ gap: Spacing.sm }}>
        <Pressable onPress={() => setShowLogout(!showLogout)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, backgroundColor: Colors.statusBg.error, borderRadius: BorderRadius.btn }}>
          <Feather name="log-out" size={18} color={Colors.statusError} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.statusError }}>Выйти из аккаунта</Text>
        </Pressable>
        {showLogout && (
          <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.statusBg.error, gap: Spacing.md, ...Shadows.sm }}>
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' }}>Вы уверены, что хотите выйти?</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Pressable onPress={() => setShowLogout(false)} style={{ flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}><Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>Отмена</Text></Pressable>
              <Pressable style={{ flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.statusError }}><Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Выйти</Text></Pressable>
            </View>
          </View>
        )}
        <Pressable onPress={() => setShowDelete(!showDelete)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.statusBg.error, borderRadius: BorderRadius.btn }}>
          <Feather name="trash-2" size={18} color={Colors.statusError} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.statusError }}>Удалить аккаунт</Text>
        </Pressable>
        {showDelete && (
          <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.statusBg.error, gap: Spacing.md, ...Shadows.sm }}>
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' }}>Это действие необратимо. Все данные будут удалены.</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Pressable onPress={() => setShowDelete(false)} style={{ flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}><Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>Отмена</Text></Pressable>
              <Pressable style={{ flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.statusError }}><Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Удалить</Text></Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
