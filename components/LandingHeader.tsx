import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export function LandingHeader() {
  return (
    <View
      className="h-14 flex-row items-center justify-between border-b bg-white px-5"
      style={{ borderBottomColor: Colors.borderLight }}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-md bg-brandPrimary">
          <Feather name="shield" size={16} color={Colors.white} />
        </View>
        <Text className="text-lg font-bold text-textPrimary">Налоговик</Text>
      </View>
      <View className="flex-row items-center gap-4">
        <Pressable><Text className="text-sm text-textSecondary">Специалисты</Text></Pressable>
        <Pressable><Text className="text-sm text-textSecondary">Тарифы</Text></Pressable>
        <Pressable className="h-9 flex-row items-center gap-1.5 rounded-lg bg-brandPrimary px-4">
          <Text className="text-sm font-semibold text-white">Войти</Text>
        </Pressable>
      </View>
    </View>
  );
}
