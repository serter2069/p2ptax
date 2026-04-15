import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

function SettingRow({ label, value, danger, onPress }: { label: string; value?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between border-b border-bgSecondary px-4 py-3">
      <Text className={`flex-1 text-sm ${danger ? 'text-statusError' : 'text-textPrimary'}`}>{label}</Text>
      {value && <Text className="mr-2 text-sm text-textMuted">{value}</Text>}
      <Text className="text-sm text-textMuted">{'>'}</Text>
    </Pressable>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center justify-between border-b border-bgSecondary px-4 py-3">
      <Text className="flex-1 text-sm text-textPrimary">{label}</Text>
      <View
        className={`justify-center rounded-full ${enabled ? 'bg-brandPrimary' : 'bg-border'}`}
        style={{ width: 44, height: 24, paddingHorizontal: 2 }}
      >
        <View
          className="rounded-full bg-white"
          style={{ width: 20, height: 20, alignSelf: enabled ? 'flex-end' : 'flex-start' }}
        />
      </View>
    </Pressable>
  );
}

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [responseNotif, setResponseNotif] = useState(true);

  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-lg font-bold text-textPrimary">Настройки</Text>

        <View className="gap-2">
          <Text className="text-sm font-semibold uppercase tracking-wide text-textMuted">Уведомления</Text>
          <View className="overflow-hidden rounded-lg border border-border bg-bgCard">
            <ToggleRow label="Email-уведомления" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
            <ToggleRow label="Push-уведомления" enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
            <ToggleRow label="Уведомления о новых откликах" enabled={responseNotif} onToggle={() => setResponseNotif(!responseNotif)} />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold uppercase tracking-wide text-textMuted">Аккаунт</Text>
          <View className="overflow-hidden rounded-lg border border-border bg-bgCard">
            <SettingRow label="Email" value="elena@mail.ru" />
            <SettingRow label="Язык" value="Русский" />
            <SettingRow label="Тема" value="Светлая" />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold uppercase tracking-wide text-textMuted">Прочее</Text>
          <View className="overflow-hidden rounded-lg border border-border bg-bgCard">
            <SettingRow label="Политика конфиденциальности" />
            <SettingRow label="Условия использования" />
            <SettingRow label="Версия" value="1.0.0" />
          </View>
        </View>

        <View className="overflow-hidden rounded-lg border border-statusBgError bg-bgCard">
          <SettingRow label="Выйти из аккаунта" danger />
          <SettingRow label="Удалить аккаунт" danger />
        </View>
      </ScrollView>
    </View>
  );
}
