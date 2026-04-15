import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '../constants/Colors';

export interface BottomTabItem {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: string;
  segment?: string;
  badgeCount?: number;
}

interface BottomTabBarProps {
  items: BottomTabItem[];
}

export function BottomTabBar({ items }: BottomTabBarProps) {
  const router = useRouter();
  const segments = useSegments();

  function isActive(item: BottomTabItem): boolean {
    const target = item.segment ?? item.route.split('/').pop() ?? '';
    return segments.includes(target as any);
  }

  return (
    <View style={{
      flexDirection: 'row',
      height: 60,
      backgroundColor: Colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: Colors.borderLight,
      alignItems: 'center',
      ...Platform.select({
        web: {
          position: 'sticky' as any,
          bottom: 0,
          boxShadow: '0 -1px 3px rgba(0,0,0,0.06)',
        },
        default: {
          ...Shadows.sm,
        },
      }),
    }}>
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Pressable
            key={item.route}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              position: 'relative',
            }}
            onPress={() => router.push(item.route as any)}
            accessibilityLabel={item.label}
          >
            <View style={{ position: 'relative' }}>
              <Feather
                name={item.icon}
                size={20}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              {item.badgeCount && item.badgeCount > 0 ? (
                <View style={{
                  position: 'absolute',
                  top: -3,
                  right: -6,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.statusError,
                }} />
              ) : null}
            </View>
            <Text style={{
              fontSize: 10,
              fontWeight: active ? Typography.fontWeight.bold : Typography.fontWeight.medium,
              color: active ? Colors.brandPrimary : Colors.textMuted,
            }}>
              {item.label}
            </Text>
            {active && (
              <View style={{
                position: 'absolute',
                bottom: 0,
                width: 20,
                height: 2,
                borderRadius: 1,
                backgroundColor: Colors.brandPrimary,
              }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
