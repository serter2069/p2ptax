import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full bg-bgSecondary">
        <Feather name="frown" size={40} color={Colors.textMuted} />
      </View>
      <Text className="text-xl font-bold text-textPrimary">Страница не найдена</Text>
      <Text className="max-w-[300px] text-center text-sm text-textMuted">
        Возможно, она была удалена или ссылка устарела
      </Text>
      <Pressable
        className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-8"
        onPress={() => router.replace('/')}
      >
        <Feather name="home" size={16} color={Colors.white} />
        <Text className="text-base font-semibold text-white">На главную</Text>
      </Pressable>
    </ScrollView>
  );
}
