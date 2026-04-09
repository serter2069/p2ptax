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
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

export interface BottomTabItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon?: React.ComponentProps<typeof Ionicons>['name'];
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
        const iconName = active ? (item.activeIcon ?? item.icon) : item.icon;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.tab}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            accessibilityLabel={item.label}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={iconName}
                size={22}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              {item.badgeCount != null && item.badgeCount > 0 ? (
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
    paddingBottom: Platform.select({ web: 0, default: 8 }),
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      } as any,
      default: {
        position: 'absolute' as any,
        bottom: 0,
        left: 0,
        right: 0,
      } as any,
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  iconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    right: -10,
    backgroundColor: Colors.statusError,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
  },
});
