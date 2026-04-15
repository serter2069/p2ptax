import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BRAND_ACCENT = '#D4A843';

interface FooterProps {
  /** @deprecated kept for backward compatibility */
  isWide?: boolean;
}

export function Footer(_props?: FooterProps) {
  const router = useRouter();

  return (
    <View className="bg-textPrimary px-6 py-6 gap-4">
      {/* Top row: logo + links */}
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center gap-2">
          <Feather name="briefcase" size={18} color={BRAND_ACCENT} />
          <Text className="text-base font-bold text-white">Налоговик</Text>
        </View>
        <View className="gap-2 items-end">
          <Pressable onPress={() => router.push('/')}>
            <Text className="text-sm text-white/60">О сервисе</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/specialists')}>
            <Text className="text-sm text-white/60">Специалисты</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/pricing')}>
            <Text className="text-sm text-white/60">Тарифы</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/support' as any)}>
            <Text className="text-sm text-white/60">Контакты</Text>
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-white/10" />

      {/* Copyright */}
      <Text className="text-xs text-white/40 text-center">
        {`${new Date().getFullYear()} Налоговик. Все права защищены.`}
      </Text>
    </View>
  );
}
