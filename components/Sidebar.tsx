import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

export interface SidebarNavItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  /** Segment to match for active state, e.g. "index" or "requests" */
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

  const groups: NavGroup[] = isGrouped(items)
    ? items
    : [{ items }];

  function renderItem(item: SidebarNavItem) {
    const active = isActive(item);
    return (
      <TouchableOpacity
        key={item.route}
        style={[styles.navItem, active && styles.navItemActive]}
        onPress={() => router.push(item.route as any)}
        activeOpacity={0.75}
        accessibilityLabel={item.label}
      >
        <View style={styles.navIconWrap}>
          <Ionicons name={item.icon} size={18} color={active ? Colors.brandPrimary : Colors.textMuted} />
          {item.badgeCount && item.badgeCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.badgeCount > 99 ? '99+' : item.badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.sidebar, { width }]}>
      {/* Logo / App name — clickable */}
      <TouchableOpacity
        style={styles.brand}
        onPress={() => router.push('/(dashboard)' as any)}
        activeOpacity={0.7}
        accessibilityLabel="На главную"
      >
        <Ionicons name="scale-outline" size={22} color={Colors.brandPrimary} />
        <Text style={styles.brandName}>Налоговик</Text>
      </TouchableOpacity>

      {/* Nav groups */}
      <View style={styles.nav}>
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 ? <View style={styles.divider} /> : null}
            {group.label ? (
              <Text style={styles.groupLabel}>{group.label}</Text>
            ) : null}
            {group.items.map(renderItem)}
          </React.Fragment>
        ))}
      </View>

      {/* Bottom: user info + logout */}
      <View style={styles.bottom}>
        {userEmail ? (
          <Text style={styles.userEmail} numberOfLines={1}>
            {userEmail}
          </Text>
        ) : null}
        {onLogout ? (
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: Colors.bgSecondary,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    flexDirection: 'column',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  brandName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  nav: {
    flex: 1,
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },
  groupLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  navItemActive: {
    backgroundColor: Colors.brandPrimary + '22',
    borderWidth: 1,
    borderColor: Colors.brandPrimary + '44',
  },
  navIconWrap: {
    position: 'relative',
  },
  navLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  navLabelActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  badge: {
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
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
  },
  logoutBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
});
