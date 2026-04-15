import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

export interface SidebarNavItem {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: string;
  /** Segment to match for active state */
  segment?: string;
  /** Unread count badge */
  badgeCount?: number;
}

export interface NavGroup {
  /** Optional group label */
  label?: string;
  items: SidebarNavItem[];
}

interface SidebarProps {
  items: SidebarNavItem[] | NavGroup[];
  userEmail?: string;
  onLogout?: () => void;
  width: number;
}

function isGrouped(items: SidebarNavItem[] | NavGroup[]): items is NavGroup[] {
  return items.length > 0 && 'items' in items[0];
}

export function Sidebar({ items, userEmail, onLogout, width }: SidebarProps) {
  const router = useRouter();
  const segments = useSegments();

  function isActive(item: SidebarNavItem): boolean {
    const target = item.segment ?? item.route.split('/').pop() ?? '';
    return segments.includes(target as any);
  }

  const groups: NavGroup[] = isGrouped(items) ? items : [{ items }];

  function renderItem(item: SidebarNavItem) {
    const active = isActive(item);
    return (
      <Pressable
        key={item.route}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.md,
          ...(active ? {
            backgroundColor: Colors.brandPrimary + '10',
            borderLeftWidth: 3,
            borderLeftColor: Colors.brandPrimary,
          } : {}),
        }}
        onPress={() => router.push(item.route as any)}
        accessibilityLabel={item.label}
      >
        <View style={{ position: 'relative' }}>
          <Feather
            name={item.icon}
            size={18}
            color={active ? Colors.brandPrimary : Colors.textMuted}
          />
          {item.badgeCount && item.badgeCount > 0 ? (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -8,
              backgroundColor: Colors.statusError,
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{
                color: Colors.white,
                fontSize: 10,
                fontWeight: '700',
              }}>
                {item.badgeCount > 99 ? '99+' : item.badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={{
          fontSize: Typography.fontSize.sm,
          fontWeight: active ? Typography.fontWeight.semibold : Typography.fontWeight.medium,
          color: active ? Colors.brandPrimary : Colors.textSecondary,
        }}>
          {item.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{
      width,
      backgroundColor: Colors.bgSecondary,
      borderRightWidth: 1,
      borderRightColor: Colors.border,
      flexDirection: 'column',
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing['2xl'],
      paddingHorizontal: Spacing.md,
    }}>
      {/* Logo */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingHorizontal: Spacing.sm,
          marginBottom: Spacing['3xl'],
        }}
        onPress={() => router.push('/(dashboard)' as any)}
        accessibilityLabel="Home"
      >
        <View style={{
          width: 28,
          height: 28,
          borderRadius: BorderRadius.md,
          backgroundColor: Colors.brandPrimary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Feather name="shield" size={16} color={Colors.white} />
        </View>
        <Text style={{
          fontSize: Typography.fontSize.lg,
          fontWeight: Typography.fontWeight.bold,
          color: Colors.textPrimary,
        }}>Налоговик</Text>
      </Pressable>

      {/* Nav groups */}
      <View style={{ flex: 1, gap: Spacing.xs }}>
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 ? (
              <View style={{
                height: 1,
                backgroundColor: Colors.border,
                marginVertical: Spacing.sm,
                marginHorizontal: Spacing.sm,
              }} />
            ) : null}
            {group.label ? (
              <Text style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.textMuted,
                fontWeight: Typography.fontWeight.semibold,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingHorizontal: Spacing.md,
                paddingTop: Spacing.xs,
                paddingBottom: Spacing.xs,
              }}>{group.label}</Text>
            ) : null}
            {group.items.map(renderItem)}
          </React.Fragment>
        ))}
      </View>

      {/* Bottom: user info + logout */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.lg,
        gap: Spacing.sm,
      }}>
        {userEmail ? (
          <Text style={{
            fontSize: Typography.fontSize.xs,
            color: Colors.textMuted,
            paddingHorizontal: Spacing.sm,
          }} numberOfLines={1}>{userEmail}</Text>
        ) : null}
        {onLogout ? (
          <Pressable
            onPress={onLogout}
            style={{
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
              borderRadius: BorderRadius.md,
            }}
          >
            <Text style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.statusError,
              fontWeight: Typography.fontWeight.medium,
            }}>Выйти</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
