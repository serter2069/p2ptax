import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/Colors';

export interface BottomTabItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
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
    <View style={styles.container}>
      {items.map((item) => {
        const active = isActive(item);
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.tab}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            accessibilityLabel={item.label}
          >
            <View>
              <Ionicons
                name={active ? (item.icon.replace('-outline', '') as any) : item.icon}
                size={22}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              {item.badgeCount && item.badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'web' ? 8 : Spacing.lg,
    paddingTop: Spacing.sm,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        bottom: 0,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.statusError,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
