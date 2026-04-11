import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// ProtoHeader
// ---------------------------------------------------------------------------
type HeaderVariant = 'guest' | 'auth' | 'back';

interface ProtoHeaderProps {
  variant: HeaderVariant;
  backTitle?: string;
}

export function ProtoHeader({ variant, backTitle = 'Мои заявки' }: ProtoHeaderProps) {
  switch (variant) {
    case 'guest':
      return (
        <View style={s.headerBar}>
          <Text style={s.headerLogo}>Налоговик</Text>
          <View style={s.headerRight}>
            <Pressable style={s.loginBtn}>
              <Text style={s.loginBtnText}>Войти</Text>
            </Pressable>
          </View>
        </View>
      );
    case 'auth':
      return (
        <View style={s.headerBar}>
          <Text style={s.headerLogo}>Налоговик</Text>
          <View style={s.headerRight}>
            <View style={s.notifDot}>
              <Feather name="bell" size={20} color={Colors.textMuted} />
              <View style={s.badge} />
            </View>
            <Image
              source={{ uri: 'https://picsum.photos/seed/user42/80/80' }}
              style={s.avatar}
            />
          </View>
        </View>
      );
    case 'back':
      return (
        <View style={s.headerBar}>
          <Pressable style={s.backRow}>
            <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
            <Text style={s.backLabel}>{backTitle}</Text>
          </Pressable>
          <View style={s.headerRight}>
            <Feather name="more-vertical" size={20} color={Colors.textMuted} />
          </View>
        </View>
      );
  }
}

// ---------------------------------------------------------------------------
// ProtoTabBar
// ---------------------------------------------------------------------------
const CLIENT_TABS = [
  { id: 'home', icon: 'home' as const, label: 'Главная' },
  { id: 'requests', icon: 'file-text' as const, label: 'Заявки' },
  { id: 'messages', icon: 'message-circle' as const, label: 'Сообщения' },
  { id: 'profile', icon: 'user' as const, label: 'Профиль' },
];

interface ProtoTabBarProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export function ProtoTabBar({ activeTab, onTabChange }: ProtoTabBarProps) {
  return (
    <View style={s.tabBar}>
      {CLIENT_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={s.tab}
            onPress={() => onTabChange?.(tab.id)}
          >
            <Feather
              name={tab.icon}
              size={20}
              color={active ? Colors.brandPrimary : Colors.textMuted}
            />
            <Text style={[s.tabLabel, active && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProtoBurger
// ---------------------------------------------------------------------------
interface ProtoBurgerProps {
  open: boolean;
  onToggle?: () => void;
}

const BURGER_LINKS = [
  { icon: 'home' as const, label: 'Главная' },
  { icon: 'file-text' as const, label: 'Заявки' },
  { icon: 'users' as const, label: 'Специалисты' },
  { icon: 'credit-card' as const, label: 'Тарифы' },
  { icon: 'settings' as const, label: 'Настройки' },
  { icon: 'log-out' as const, label: 'Выйти' },
];

export function ProtoBurger({ open, onToggle }: ProtoBurgerProps) {
  return (
    <View style={s.burgerContainer}>
      {/* Header with burger icon */}
      <View style={s.burgerHeader}>
        <Text style={s.headerLogo}>Налоговик</Text>
        <Pressable onPress={onToggle} style={s.burgerIconBtn}>
          <Feather name={open ? 'x' : 'menu'} size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {open && (
        <>
          {/* Overlay */}
          <Pressable style={s.overlay} onPress={onToggle} />
          {/* Drawer */}
          <View style={s.drawer}>
            <View style={s.drawerProfile}>
              <Image
                source={{ uri: 'https://picsum.photos/seed/user42/80/80' }}
                style={s.drawerAvatar}
              />
              <View>
                <Text style={s.drawerName}>Sergei Petrov</Text>
                <Text style={s.drawerEmail}>sergei@example.com</Text>
              </View>
            </View>
            <View style={s.drawerDivider} />
            {BURGER_LINKS.map((link) => (
              <Pressable key={link.label} style={s.drawerItem}>
                <Feather name={link.icon} size={18} color={Colors.textSecondary} />
                <Text style={s.drawerItemText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loginBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandPrimary,
  },
  loginBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  notifDot: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  // Burger
  burgerContainer: {
    position: 'relative',
    minHeight: 300,
    backgroundColor: Colors.bgPrimary,
  },
  burgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 3,
  },
  burgerIconBtn: {
    padding: Spacing.xs,
  },
  overlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,36,71,0.4)',
    zIndex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: 260,
    backgroundColor: Colors.bgCard,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    borderBottomLeftRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    zIndex: 2,
    ...Shadows.lg,
  },
  drawerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
  },
  drawerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  drawerEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  drawerItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
});
