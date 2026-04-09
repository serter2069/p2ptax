import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';
import { ResponsiveLayout } from '../../components/ResponsiveLayout';
import { NavGroup, SidebarNavItem } from '../../components/Sidebar';
import { BottomTabItem } from '../../components/BottomTabBar';
import { useBreakpoints } from '../../hooks/useBreakpoints';

// Grouped sidebar items for CLIENT
const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Главная', icon: 'home-outline', route: '/(dashboard)', segment: 'index' },
      { label: 'Мои запросы', icon: 'document-text-outline', route: '/(dashboard)/my-requests', segment: 'my-requests' },
      { label: 'Лента запросов', icon: 'newspaper-outline', route: '/requests', segment: 'feed' },
    ],
  },
  {
    items: [
      { label: 'Специалисты', icon: 'search-outline', route: '/specialists', segment: 'specialists' },
    ],
  },
  {
    label: 'Сообщения',
    items: [
      { label: 'Сообщения', icon: 'chatbubble-outline', route: '/(dashboard)/messages', segment: 'messages', badgeCount: 0 },
    ],
  },
  {
    items: [
      { label: 'Настройки', icon: 'settings-outline', route: '/(dashboard)/settings', segment: 'settings' },
    ],
  },
];

// Grouped sidebar items for SPECIALIST
const SPECIALIST_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Главная', icon: 'home-outline', route: '/specialist/dashboard', segment: 'specialist-dashboard' },
      { label: 'Запросы города', icon: 'location-outline', route: '/(dashboard)/city-requests', segment: 'city-requests' },
      { label: 'Лента запросов', icon: 'newspaper-outline', route: '/requests', segment: 'requests' },
    ],
  },
  {
    items: [
      { label: 'Мои отклики', icon: 'checkmark-circle-outline', route: '/(dashboard)/responses', segment: 'responses' },
      { label: 'Мой профиль', icon: 'person-outline', route: '/(dashboard)/profile', segment: 'profile' },
      { label: 'Продвижение', icon: 'rocket-outline', route: '/(dashboard)/promotion', segment: 'promotion' },
    ],
  },
  {
    label: 'Сообщения',
    items: [
      { label: 'Сообщения', icon: 'chatbubble-outline', route: '/(dashboard)/messages', segment: 'messages', badgeCount: 0 },
    ],
  },
  {
    items: [
      { label: 'Настройки', icon: 'settings-outline', route: '/(dashboard)/settings', segment: 'settings' },
    ],
  },
];

// Mobile bottom tabs for CLIENT
const CLIENT_BOTTOM_TABS: BottomTabItem[] = [
  { label: 'Главная', icon: 'home-outline', activeIcon: 'home', route: '/(dashboard)', segment: 'index' },
  { label: 'Запросы', icon: 'document-text-outline', activeIcon: 'document-text', route: '/(dashboard)/my-requests', segment: 'my-requests' },
  { label: 'Сообщения', icon: 'chatbubble-outline', activeIcon: 'chatbubble', route: '/(dashboard)/messages', segment: 'messages', badgeCount: 0 },
  { label: 'Настройки', icon: 'settings-outline', activeIcon: 'settings', route: '/(dashboard)/settings', segment: 'settings' },
];

// Mobile bottom tabs for SPECIALIST
const SPECIALIST_BOTTOM_TABS: BottomTabItem[] = [
  { label: 'Главная', icon: 'home-outline', activeIcon: 'home', route: '/specialist/dashboard', segment: 'specialist-dashboard' },
  { label: 'Запросы', icon: 'newspaper-outline', activeIcon: 'newspaper', route: '/(dashboard)/city-requests', segment: 'city-requests' },
  { label: 'Сообщения', icon: 'chatbubble-outline', activeIcon: 'chatbubble', route: '/(dashboard)/messages', segment: 'messages', badgeCount: 0 },
  { label: 'Профиль', icon: 'person-outline', activeIcon: 'person', route: '/(dashboard)/profile', segment: 'profile' },
];

export default function DashboardLayout() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/(auth)/email');
    }
  }, [user, isLoading, router]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  if (isLoading || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  const isSpecialist = user.role === 'SPECIALIST';
  const navGroups = isSpecialist ? SPECIALIST_NAV_GROUPS : CLIENT_NAV_GROUPS;
  const bottomTabs = isSpecialist ? SPECIALIST_BOTTOM_TABS : CLIENT_BOTTOM_TABS;

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
        animation: isMobile ? 'slide_from_right' : 'none',
      }}
    />
  );

  return (
    <ResponsiveLayout
      navItems={navGroups}
      bottomTabs={bottomTabs}
      userEmail={user.username || user.email.split('@')[0]}
      onLogout={handleLogout}
    >
      {stack}
    </ResponsiveLayout>
  );
}
