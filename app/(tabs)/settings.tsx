import React, { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [responseNotif, setResponseNotif] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <View className="flex-1 bg-white">
      <Header variant="auth" />
      <View className="flex-1 p-4 gap-4">
        <Text className="text-xl font-bold text-textPrimary">Настройки</Text>

        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-textMuted">Уведомления</Text>
          <View className="rounded-xl border border-borderLight bg-white overflow-hidden">
            {[
              { label: 'Email-уведомления', icon: 'mail', value: emailNotif, toggle: () => setEmailNotif(!emailNotif) },
              { label: 'Push-уведомления', icon: 'bell', value: pushNotif, toggle: () => setPushNotif(!pushNotif) },
              { label: 'Новые отклики', icon: 'message-circle', value: responseNotif, toggle: () => setResponseNotif(!responseNotif) },
            ].map((row) => (
              <View key={row.label} className="flex-row items-center gap-3 border-b border-bgSecondary px-4 py-3">
                <Feather name={row.icon as any} size={18} color={Colors.textMuted} />
                <Text className="flex-1 text-sm text-textPrimary">{row.label}</Text>
                <Switch value={row.value} onValueChange={row.toggle} trackColor={{ false: '#D1D5DB', true: '#0284C7' }} thumbColor="#fff" />
              </View>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-textMuted">Аккаунт</Text>
          <View className="rounded-xl border border-borderLight bg-white overflow-hidden">
            {[
              { label: 'Email', value: 'elena@mail.ru', icon: 'mail' },
              { label: 'Язык', value: 'Русский', icon: 'globe' },
              { label: 'Тема', value: 'Светлая', icon: 'sun' },
            ].map((row) => (
              <Pressable key={row.label} className="flex-row items-center gap-3 border-b border-bgSecondary px-4 py-3">
                <Feather name={row.icon as any} size={18} color={Colors.textMuted} />
                <Text className="flex-1 text-sm text-textPrimary">{row.label}</Text>
                <Text className="text-sm text-textMuted mr-2">{row.value}</Text>
                <Feather name="chevron-right" size={16} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Pressable onPress={() => setShowLogout(!showLogout)} className="h-12 flex-row items-center justify-center gap-2 rounded-lg" style={{ backgroundColor: Colors.statusBg.error }}>
            <Feather name="log-out" size={18} color={Colors.statusError} />
            <Text className="text-sm font-semibold text-statusError">Выйти из аккаунта</Text>
          </Pressable>
          {showLogout && (
            <View className="rounded-xl border p-4 gap-3" style={{ borderColor: Colors.statusBg.error }}>
              <Text className="text-sm text-textSecondary text-center">Вы уверены, что хотите выйти?</Text>
              <View className="flex-row gap-2">
                <Pressable onPress={() => setShowLogout(false)} className="flex-1 h-10 items-center justify-center rounded-lg border border-borderLight">
                  <Text className="text-sm text-textMuted">Отмена</Text>
                </Pressable>
                <Pressable className="flex-1 h-10 items-center justify-center rounded-lg bg-statusError">
                  <Text className="text-sm font-semibold text-white">Выйти</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
      <BottomNav activeId="profile" variant="client" />
    </View>
  );
}
