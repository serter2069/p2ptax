import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';
import { ResponsiveLayout } from '../../components/ResponsiveLayout';
import { NavGroup } from '../../components/Sidebar';
import { BottomTabItem } from '../../components/BottomTabBar';
import { useBreakpoints } from '../../hooks/useBreakpoints';

// Client sidebar groups (Feather icons)
const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Glavnaya', icon: 'home', route: '/(dashboard)', segment: 'index' },
      { label: 'Moi zayavki', icon: 'file-text', route: '/(dashboard)/my-requests', segment: 'my-requests' },
      { label: 'Otkliki', icon: 'inbox', route: '/(dashboard)/responses', segment: 'responses' },
      { label: 'Lenta zayavok', icon: 'list', route: '/requests', segment: 'feed' },
    ],
  },
  {
    items: [
      { label: 'Specialisty', icon: 'search', route: '/specialists', segment: 'specialists' },
    ],
  },
  {
    label: 'Lichnoe',
    items: [
      { label: 'Soobscheniya', icon: 'message-circle', route: '/(dashboard)/messages', segment: 'messages', badgeCount: 0 },
      { label: 'Nastroiki', icon: 'settings', route: '/(dashboard)/settings', segment: 'settings' },
    ],
  },
];

// Specialist sidebar groups (Feather icons)
const SPECIALIST_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Kabinet', icon: 'briefcase', route: '/specialist/dashboard', segment: 'specialist-dashboard' },
      { label: 'Zayavki goroda', icon: 'map-pin', route: '/(dashboard)/city-requests', segment: 'city-requests' },
      { label: 'Lenta zayavok', icon: 'list', route: '/requests', segment: 'requests' },
    ],
  },
  {
    items: [
      { label: 'Moi otkliki', icon: 'send', route: '/(dashboard)/responses', segment: 'responses' },
      { label: 'Moi profil', icon: 'user', route: '/(dashboard)/profile', segment: 'profile' },
      { label: 'Prodvizhenie', icon: 'trending-up', route: '/(dashboard)/promotion', segment: 'promotion' },
    ],
  },
  {
    label: 'Lichnoe',
    items: [
      { label: 'Soobscheniya', icon: 'message-circle', route: '/(dashboard)/messages', segment: 'messages', badgeCount: 0 },
      { label: 'Nastroiki', icon: 'settings', route: '/(dashboard)/settings', segment: 'settings' },
    ],
  },
];

// Client mobile bottom tabs (Feather icons matching prototype)
const CLIENT_TAB_ITEMS: BottomTabItem[] = [
  { label: 'Glavnaya', icon: 'home', route: '/(dashboard)', segment: 'index' },
  { label: 'Zayavki', icon: 'file-text', route: '/(dashboard)/my-requests', segment: 'my-requests' },
  { label: 'Otkliki', icon: 'inbox', route: '/(dashboard)/responses', segment: 'responses' },
  { label: 'Soobscheniya', icon: 'message-circle', route: '/(dashboard)/messages', segment: 'messages' },
  { label: 'Profil', icon: 'user', route: '/(dashboard)/settings', segment: 'settings' },
];

// Specialist mobile bottom tabs (Feather icons matching prototype)
const SPECIALIST_TAB_ITEMS: BottomTabItem[] = [
  { label: 'Kabinet', icon: 'briefcase', route: '/specialist/dashboard', segment: 'specialist-dashboard' },
  { label: 'Otkliki', icon: 'send', route: '/(dashboard)/responses', segment: 'responses' },
  { label: 'Soobscheniya', icon: 'message-circle', route: '/(dashboard)/messages', segment: 'messages' },
  { label: 'Profil', icon: 'user', route: '/(dashboard)/profile', segment: 'profile' },
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
  const tabItems = isSpecialist ? SPECIALIST_TAB_ITEMS : CLIENT_TAB_ITEMS;

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
      tabItems={tabItems}
      userEmail={user.username || user.email.split('@')[0]}
      onLogout={handleLogout}
    >
      {stack}
    </ResponsiveLayout>
  );
}
