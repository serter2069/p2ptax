import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography } from '../constants/Colors';
import { useUnreadNotifications } from '../lib/hooks/useUnreadNotifications';

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      style={styles.wrap}
      accessibilityLabel={`Уведомления${unreadCount > 0 ? `, ${unreadCount} непрочитанных` : ''}`}
    >
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: Colors.statusError,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.bgPrimary,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
