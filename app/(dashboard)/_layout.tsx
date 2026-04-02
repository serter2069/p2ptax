import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';
import { ResponsiveLayout } from '../../components/ResponsiveLayout';
import { SidebarNavItem } from '../../components/Sidebar';
import { useBreakpoints } from '../../hooks/useBreakpoints';

const CLIENT_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Главная', icon: '🏠', route: '/(dashboard)', segment: 'index' },
  { label: 'Мои запросы', icon: '📋', route: '/(dashboard)/requests', segment: 'requests' },
  { label: 'Сообщения', icon: '💬', route: '/(dashboard)/messages', segment: 'messages' },
  { label: 'Специалисты', icon: '🔍', route: '/specialists', segment: 'specialists' },
  { label: 'Лента запросов', icon: '📰', route: '/requests', segment: 'requests' },
  { label: 'Настройки', icon: '⚙', route: '/(dashboard)/settings', segment: 'settings' },
];

const SPECIALIST_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Главная', icon: '🏠', route: '/(dashboard)', segment: 'index' },
  { label: 'Мой профиль', icon: '👤', route: '/(dashboard)/profile', segment: 'profile' },
  { label: 'Сообщения', icon: '💬', route: '/(dashboard)/messages', segment: 'messages' },
  { label: 'Запросы города', icon: '📍', route: '/(dashboard)/city-requests', segment: 'city-requests' },
  { label: 'Лента запросов', icon: '📰', route: '/requests', segment: 'requests' },
  { label: 'Продвижение', icon: '🚀', route: '/(dashboard)/promotion', segment: 'promotion' },
  { label: 'Настройки', icon: '⚙', route: '/(dashboard)/settings', segment: 'settings' },
];

export default function DashboardLayout() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/(auth)/email?role=CLIENT');
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

  const navItems = user.role === 'SPECIALIST' ? SPECIALIST_NAV_ITEMS : CLIENT_NAV_ITEMS;

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
      navItems={navItems}
      userEmail={user.email}
      onLogout={handleLogout}
    >
      {stack}
    </ResponsiveLayout>
  );
}
