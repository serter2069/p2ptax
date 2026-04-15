import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useUnreadNotifications } from '../lib/hooks/useUnreadNotifications';

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      className="relative p-1"
      accessibilityLabel={`Уведомления${unreadCount > 0 ? `, ${unreadCount} непрочитанных` : ''}`}
    >
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {unreadCount > 0 && (
        <View className="absolute top-0 -right-[2px] bg-statusError rounded-[10px] min-w-[16px] h-4 items-center justify-center px-[3px] border-[1.5px] border-bgPrimary">
          <Text className="text-white text-[9px] font-bold leading-[11px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
