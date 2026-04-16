import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Toggle } from '../../components/proto/Toggle';
import { useAuth } from '../../lib/auth/AuthContext';
import { users, specialistPortal, specialists } from '../../lib/api/endpoints';

function IdleState() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isAvailable, setIsAvailable] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);

  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const [savingAvailable, setSavingAvailable] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const availableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      users.getMe().catch(() => null),
      specialistPortal.getProfile().catch(() => null),
    ]).then(([meRes, spRes]) => {
      if (meRes?.data) {
        const me = meRes.data as any;
        setEmail(me.email ?? user?.email ?? '');
        setPhone(me.phone ?? '');
        if (typeof me.notifyNewMessages === 'boolean') setEmailNotif(me.notifyNewMessages);
        if (typeof me.isAvailable === 'boolean') setIsAvailable(me.isAvailable);
      }
      if (spRes?.data) {
        const sp = spRes.data as any;
        if (sp.phone) setPhone((prev) => prev || sp.phone);
        if (typeof sp.isAvailable === 'boolean') setIsAvailable(sp.isAvailable);
      }
    }).finally(() => setProfileLoading(false));
    return () => {
      if (availableTimerRef.current) clearTimeout(availableTimerRef.current);
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, []);

  const handleAvailableToggle = (next: boolean) => {
    setIsAvailable(next);
    if (availableTimerRef.current) clearTimeout(availableTimerRef.current);
    setSavingAvailable(true);
    availableTimerRef.current = setTimeout(() => {
      specialists.updateProfile({ isAvailable: next })
        .catch(() => setIsAvailable(!next))
        .finally(() => setSavingAvailable(false));
    }, 400);
  };

  const handleEmailNotifToggle = (next: boolean) => {
    setEmailNotif(next);
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    setSavingEmail(true);
    emailTimerRef.current = setTimeout(() => {
      users.updateSettings({ notifyNewMessages: next })
        .catch(() => setEmailNotif(!next))
        .finally(() => setSavingEmail(false));
    }, 400);
  };

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

      {/* Availability — primary toggle */}
      <View className="gap-3 rounded-xl border-2 border-brandPrimary bg-bgSecondary p-4">
        <View className="flex-row items-center gap-2">
          <Feather name="zap" size={18} color={Colors.brandPrimary} />
          <Text className="flex-1 text-base font-bold text-textPrimary">Я доступен для новых заявок</Text>
          {savingAvailable && <ActivityIndicator size="small" color={Colors.brandPrimary} />}
        </View>
        <Text className="text-xs text-textMuted">
          Когда выключено, ваш профиль скрыт из каталога и вы не получите новых заявок.
        </Text>
        {profileLoading ? (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        ) : (
          <Toggle
            label={isAvailable ? 'Доступен' : 'Недоступен'}
            value={isAvailable}
            onValueChange={handleAvailableToggle}
          />
        )}
      </View>

      {/* Account */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Аккаунт</Text>

        <View className="gap-1">
          <Text className="text-sm font-medium text-textMuted">Email</Text>
          <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
            <Feather name="mail" size={16} color={Colors.textMuted} />
            {profileLoading ? (
              <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginLeft: 8 }} />
            ) : (
              <Text className="ml-2 flex-1 text-base text-textSecondary">{email || '—'}</Text>
            )}
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-textMuted">Телефон</Text>
          <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
            <Feather name="phone" size={16} color={Colors.textMuted} />
            {profileLoading ? (
              <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginLeft: 8 }} />
            ) : (
              <Text className="ml-2 flex-1 text-base text-textSecondary">{phone || '—'}</Text>
            )}
            {/* TODO: phone edit screen not implemented */}
            <Pressable hitSlop={8} onPress={() => router.push('/(tabs)/profile' as any)}>
              <Feather name="edit-2" size={16} color={Colors.brandPrimary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-base font-semibold text-textPrimary">Уведомления</Text>
          {savingEmail && <ActivityIndicator size="small" color={Colors.textMuted} />}
        </View>
        <Toggle label="Email-уведомления" value={emailNotif} onValueChange={handleEmailNotifToggle} />
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
