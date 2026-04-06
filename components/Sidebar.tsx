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
    // Match by segment presence anywhere in the route segments
    // This ensures /messages/123 still highlights "messages"
    const target = item.segment ?? item.route.split('/').pop() ?? '';
    return segments.includes(target as any);
  }

  return (
    <View style={[styles.sidebar, { width }]}>
      {/* Logo / App name */}
      <View style={styles.brand}>
        <Ionicons name="scale-outline" size={22} color={Colors.brandPrimary} />
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
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <Ionicons name={item.icon} size={18} color={active ? Colors.brandPrimary : Colors.textMuted} />
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
