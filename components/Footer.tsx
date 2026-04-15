import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface FooterProps {
  isWide?: boolean;
}

export function Footer({ isWide = false }: FooterProps) {
  const router = useRouter();

  return (
    <View className="w-full bg-textPrimary py-6 px-4 items-center border-t border-white/[0.08]">
      <View className={`w-full max-w-[1100px] flex-col items-center gap-4 ${isWide ? 'flex-row justify-between' : ''}`}>
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-brandPrimary items-center justify-center">
            <Text className="text-[13px] font-bold text-white">H</Text>
          </View>
          <Text className="text-lg font-bold text-white">Налоговик</Text>
        </View>
        <View className={`flex-row items-center gap-3 flex-wrap justify-center ${isWide ? 'gap-4' : ''}`}>
          <Pressable onPress={() => router.push('/specialists')}>
            <Text className="text-[15px] text-white/[0.65] font-medium">Специалисты</Text>
          </Pressable>
          <Text className="text-[15px] text-white/[0.35]">·</Text>
          <Pressable onPress={() => router.push('/requests')}>
            <Text className="text-[15px] text-white/[0.65] font-medium">Запросы</Text>
          </Pressable>
          <Text className="text-[15px] text-white/[0.35]">·</Text>
          <Pressable
            onPress={() => {
              if (Platform.OS === 'web') {
                router.push('/');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }
            }}
          >
            <Text className="text-[15px] text-white/[0.65] font-medium">О платформе</Text>
          </Pressable>
          <Text className="text-[15px] text-white/[0.35]">·</Text>
          <Pressable onPress={() => router.push('/support' as any)}>
            <Text className="text-[15px] text-white/[0.65] font-medium">Контакты</Text>
          </Pressable>
          <Text className="text-[15px] text-white/[0.35]">·</Text>
          <Pressable onPress={() => router.push('/privacy' as any)}>
            <Text className="text-[15px] text-white/[0.65] font-medium">Политика конфиденциальности</Text>
          </Pressable>
          <Text className="text-[15px] text-white/[0.35]">·</Text>
          <Pressable onPress={() => router.push('/terms' as any)}>
            <Text className="text-[15px] text-white/[0.65] font-medium">Пользовательское соглашение</Text>
          </Pressable>
        </View>
        <Text className="text-[13px] text-white/[0.35]">
          {`\u00A9 ${new Date().getFullYear()} Налоговик`}
        </Text>
      </View>
    </View>
  );
}
