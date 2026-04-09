import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';

type NavVariant = 'public' | 'auth' | 'client' | 'specialist' | 'admin';

interface ProtoNavProps {
  variant: NavVariant;
  activeTab?: string;
}

// Public header — logo + nav links + login button
function PublicNav() {
  return (
    <View style={s.publicNav}>
      <Text style={s.logo}>Налоговик</Text>
      <View style={s.publicLinks}>
        <Text style={s.publicLink}>Специалисты</Text>
        <Text style={s.publicLink}>Тарифы</Text>
        <View style={s.loginBtn}>
          <Text style={s.loginBtnText}>Войти</Text>
        </View>
      </View>
    </View>
  );
}

// Auth header — logo only, minimal
function AuthNav() {
  return (
    <View style={s.authNav}>
      <Text style={s.logo}>Налоговик</Text>
    </View>
  );
}

// Client bottom tabs
function ClientNav({ activeTab = 'home' }: { activeTab?: string }) {
  const tabs = [
    { id: 'home', icon: 'home' as const, label: 'Главная' },
    { id: 'requests', icon: 'file-text' as const, label: 'Заявки' },
    { id: 'messages', icon: 'message-circle' as const, label: 'Сообщения' },
    { id: 'profile', icon: 'user' as const, label: 'Профиль' },
  ];
  return (
    <View style={s.bottomTabs}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} style={s.tab}>
          <Feather
            name={tab.icon}
            size={20}
            color={activeTab === tab.id ? Colors.brandPrimary : Colors.textMuted}
          />
          <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Specialist bottom tabs
function SpecialistNav({ activeTab = 'dashboard' }: { activeTab?: string }) {
  const tabs = [
    { id: 'dashboard', icon: 'briefcase' as const, label: 'Заявки' },
    { id: 'responses', icon: 'send' as const, label: 'Отклики' },
    { id: 'messages', icon: 'message-circle' as const, label: 'Сообщения' },
    { id: 'profile', icon: 'user' as const, label: 'Профиль' },
  ];
  return (
    <View style={s.bottomTabs}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} style={s.tab}>
          <Feather
            name={tab.icon}
            size={20}
            color={activeTab === tab.id ? Colors.brandPrimary : Colors.textMuted}
          />
          <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Admin sidebar nav
function AdminNav({ activeTab = 'dashboard' }: { activeTab?: string }) {
  const items = [
    { id: 'dashboard', icon: 'bar-chart-2' as const, label: 'Статистика' },
    { id: 'users', icon: 'users' as const, label: 'Пользователи' },
    { id: 'requests', icon: 'file-text' as const, label: 'Заявки' },
    { id: 'moderation', icon: 'shield' as const, label: 'Модерация' },
    { id: 'reviews', icon: 'star' as const, label: 'Отзывы' },
    { id: 'promotions', icon: 'gift' as const, label: 'Промо' },
  ];
  return (
    <View style={s.adminHeader}>
      <Text style={s.adminLogo}>Налоговик Admin</Text>
      <View style={s.adminTabs}>
        {items.map((item) => (
          <Pressable key={item.id} style={[s.adminTab, activeTab === item.id && s.adminTabActive]}>
            <Feather name={item.icon} size={16} color={activeTab === item.id ? Colors.brandPrimary : Colors.textMuted} />
            <Text style={[s.adminTabText, activeTab === item.id && s.adminTabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Top bar for authenticated pages (client/specialist)
function AppTopBar({ title }: { title?: string }) {
  return (
    <View style={s.topBar}>
      <Text style={s.topBarLogo}>Налоговик</Text>
      {title && <Text style={s.topBarTitle}>{title}</Text>}
      <View style={s.topBarRight}>
        <Feather name="bell" size={20} color={Colors.textMuted} />
      </View>
    </View>
  );
}

export function ProtoNavHeader({ variant, activeTab }: ProtoNavProps) {
  switch (variant) {
    case 'public': return <PublicNav />;
    case 'auth': return <AuthNav />;
    case 'client': return <AppTopBar />;
    case 'specialist': return <AppTopBar title="Специалист" />;
    case 'admin': return <AdminNav activeTab={activeTab} />;
    default: return null;
  }
}

export function ProtoNavFooter({ variant, activeTab }: ProtoNavProps) {
  switch (variant) {
    case 'client': return <ClientNav activeTab={activeTab} />;
    case 'specialist': return <SpecialistNav activeTab={activeTab} />;
    default: return null; // public, auth, admin — no bottom tabs
  }
}

const s = StyleSheet.create({
  // Public
  publicNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#0F2447',
  },
  logo: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
  },
  publicLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  publicLink: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  loginBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loginBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFF',
  },

  // Auth
  authNav: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Top bar (client/specialist)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 56,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarLogo: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  topBarTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginLeft: Spacing.md,
  },
  topBarRight: {
    marginLeft: 'auto',
  },

  // Bottom tabs (client/specialist)
  bottomTabs: {
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

  // Admin
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xl,
  },
  adminLogo: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  adminTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  adminTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  adminTabActive: {
    backgroundColor: Colors.bgSecondary,
  },
  adminTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  adminTabTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
});
