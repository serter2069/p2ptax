import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Toggle } from '../../components/proto/Toggle';
import { useAuth } from '../../lib/auth/AuthContext';

function IdleState() {
  const { logout } = useAuth();
  const router = useRouter();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/(auth)/email');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки</Text>

      {/* Account */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Аккаунт</Text>

        <View className="gap-1">
          <Text className="text-sm font-medium text-textMuted">Email</Text>
          <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
            <Feather name="mail" size={16} color={Colors.textMuted} />
            <Text className="ml-2 flex-1 text-base text-textSecondary">alex@mail.ru</Text>
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-textMuted">Телефон</Text>
          <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
            <Feather name="phone" size={16} color={Colors.textMuted} />
            <Text className="ml-2 flex-1 text-base text-textSecondary">+7 (916) 123-45-67</Text>
            <Pressable hitSlop={8}>
              <Feather name="edit-2" size={16} color={Colors.brandPrimary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Уведомления</Text>
        <Toggle label="Email-уведомления" value={emailNotif} onValueChange={setEmailNotif} />
        <Toggle label="Push-уведомления" value={pushNotif} onValueChange={setPushNotif} />
      </View>

      {/* Public profile */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Публичный профиль</Text>
        <Toggle label="Профиль виден всем" value={publicProfile} onValueChange={setPublicProfile} />
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
        style={{ backgroundColor: Colors.statusBg.error }}
      >
        <Feather name="log-out" size={18} color={Colors.statusError} />
        <Text className="text-base font-semibold" style={{ color: Colors.statusError }}>
          Выйти из аккаунта
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export default function SpecialistSettingsPage() {
  return <IdleState />;
}
