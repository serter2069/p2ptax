import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
  /** Segment to match for active state, e.g. "index" or "requests" */
  segment?: string;
}

interface SidebarProps {
  items: SidebarNavItem[];
  userEmail?: string;
  onLogout?: () => void;
  width: number;
}

export function Sidebar({ items, userEmail, onLogout, width }: SidebarProps) {
  const router = useRouter();
  const segments = useSegments();

  function isActive(item: SidebarNavItem): boolean {
    // Match by last segment or explicit segment override
    const last = segments[segments.length - 1] ?? '';
    const target = item.segment ?? item.route.split('/').pop() ?? '';
    return last === target;
  }

  return (
    <View style={[styles.sidebar, { width }]}>
      {/* Logo / App name */}
      <View style={styles.brand}>
        <Text style={styles.brandIcon}>{'⚖'}</Text>
        <Text style={styles.brandName}>Налоговик</Text>
      </View>

      {/* Nav items */}
      <View style={styles.nav}>
        {items.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.replace(item.route as any)}
              activeOpacity={0.75}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  brandIcon: {
    fontSize: Typography.fontSize.xl,
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
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  navItemActive: {
    backgroundColor: Colors.brandPrimary + '22', // 13% opacity tint
    borderWidth: 1,
    borderColor: Colors.brandPrimary + '44',
  },
  navIcon: {
    fontSize: Typography.fontSize.base,
    width: 20,
    textAlign: 'center',
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
