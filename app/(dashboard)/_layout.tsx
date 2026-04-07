import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';
import { ResponsiveLayout } from '../../components/ResponsiveLayout';
import { SidebarNavItem } from '../../components/Sidebar';
import { useBreakpoints } from '../../hooks/useBreakpoints';

const CLIENT_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Главная', icon: 'home-outline', route: '/(dashboard)', segment: 'index' },
  { label: 'Мои запросы', icon: 'document-text-outline', route: '/(dashboard)/requests', segment: 'requests' },
  { label: 'Лента запросов', icon: 'newspaper-outline', route: '/requests', segment: 'feed' },
  { label: 'Сообщения', icon: 'chatbubble-outline', route: '/(dashboard)/messages', segment: 'messages' },
  { label: 'Специалисты', icon: 'search-outline', route: '/specialists', segment: 'specialists' },
  { label: 'Настройки', icon: 'settings-outline', route: '/(dashboard)/settings', segment: 'settings' },
];

const SPECIALIST_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Главная', icon: 'home-outline', route: '/(dashboard)', segment: 'index' },
  { label: 'Мой профиль', icon: 'person-outline', route: '/(dashboard)/profile', segment: 'profile' },
  { label: 'Мои отклики', icon: 'checkmark-circle-outline', route: '/(dashboard)/responses', segment: 'responses' },
  { label: 'Сообщения', icon: 'chatbubble-outline', route: '/(dashboard)/messages', segment: 'messages' },
  { label: 'Запросы города', icon: 'location-outline', route: '/(dashboard)/city-requests', segment: 'city-requests' },
  { label: 'Лента запросов', icon: 'newspaper-outline', route: '/requests', segment: 'requests' },
  { label: 'Продвижение', icon: 'rocket-outline', route: '/(dashboard)/promotion', segment: 'promotion' },
  { label: 'Настройки', icon: 'settings-outline', route: '/(dashboard)/settings', segment: 'settings' },
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
      userEmail={user.username || user.email.split('@')[0]}
      onLogout={handleLogout}
    >
      {stack}
    </ResponsiveLayout>
  );
}
