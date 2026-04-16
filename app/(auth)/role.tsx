import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { Colors } from '../../constants/Colors';

export default function RoleScreen() {
  const router = useRouter();

  function selectRole(role: 'CLIENT' | 'SPECIALIST') {
    router.push({ pathname: '/(auth)/email', params: { role } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Выбор роли" onBack={() => router.back()} />
      <View className="flex-1 items-center justify-center bg-white px-4 py-8">
        <View className="mb-8 items-center gap-2">
          <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="shield" size={28} color={Colors.brandPrimary} />
          </View>
          <Text className="text-2xl font-bold text-textPrimary">Налоговик</Text>
          <Text className="text-base text-textMuted">Кто вы на платформе?</Text>
        </View>

        <View className="w-full max-w-md gap-4">
          <Pressable
            onPress={() => selectRole('CLIENT')}
            className="rounded-2xl border-2 border-borderLight bg-white p-6 active:border-brandPrimary active:bg-bgSecondary"
            style={{ borderColor: Colors.borderLight }}
          >
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-xl bg-bgSecondary">
              <Feather name="search" size={24} color={Colors.brandPrimary} />
            </View>
            <Text className="text-lg font-bold text-textPrimary">Я ищу специалиста</Text>
            <Text className="mt-1 text-sm leading-5 text-textMuted">
              Нужна помощь с налоговой проверкой или вопросом — найду специалиста по своей ФНС
            </Text>
          </Pressable>

          <Pressable
            onPress={() => selectRole('SPECIALIST')}
            className="rounded-2xl border-2 border-borderLight bg-white p-6 active:border-brandPrimary active:bg-bgSecondary"
            style={{ borderColor: Colors.borderLight }}
          >
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-xl bg-bgSecondary">
              <Feather name="briefcase" size={24} color={Colors.brandPrimary} />
            </View>
            <Text className="text-lg font-bold text-textPrimary">Я специалист по налогам</Text>
            <Text className="mt-1 text-sm leading-5 text-textMuted">
              Консультирую клиентов по вопросам налоговых проверок в конкретных ФНС
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
