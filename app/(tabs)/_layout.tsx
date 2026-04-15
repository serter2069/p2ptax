import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../stores/authStore';
import { useResponsive } from '../../lib/hooks/useResponsive';
import { Sidebar, NavGroup } from '../../components/Sidebar';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: FeatherIcon;
}

const CLIENT_TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Главная', icon: 'home' },
  { name: 'requests', title: 'Заявки', icon: 'file-text' },
  { name: 'messages', title: 'Сообщения', icon: 'message-circle' },
  { name: 'settings', title: 'Настройки', icon: 'settings' },
];

const SPECIALIST_TABS: TabConfig[] = [
  { name: 'feed', title: 'Лента', icon: 'list' },
  { name: 'my-responses', title: 'Отклики', icon: 'send' },
  { name: 'messages', title: 'Сообщения', icon: 'message-circle' },
  { name: 'dashboard', title: 'Профиль', icon: 'user' },
  { name: 'settings', title: 'Настройки', icon: 'settings' },
];

const ALL_TAB_NAMES = ['dashboard', 'requests', 'messages', 'settings', 'feed', 'my-responses'];

// Sidebar nav groups for desktop view
const CLIENT_SIDEBAR_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Главная', icon: 'home-outline', route: '/(tabs)/dashboard', segment: 'dashboard' },
      { label: 'Заявки', icon: 'document-text-outline', route: '/(tabs)/requests', segment: 'requests' },
    ],
  },
  {
    label: 'Личное',
    items: [
      { label: 'Сообщения', icon: 'chatbubble-outline', route: '/(tabs)/messages', segment: 'messages' },
      { label: 'Настройки', icon: 'settings-outline', route: '/(tabs)/settings', segment: 'settings' },
    ],
  },
];

const SPECIALIST_SIDEBAR_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Лента', icon: 'list-outline', route: '/(tabs)/feed', segment: 'feed' },
      { label: 'Мои отклики', icon: 'send-outline', route: '/(tabs)/my-responses', segment: 'my-responses' },
    ],
  },
  {
    label: 'Личное',
    items: [
      { label: 'Сообщения', icon: 'chatbubble-outline', route: '/(tabs)/messages', segment: 'messages' },
      { label: 'Профиль', icon: 'person-outline', route: '/(tabs)/dashboard', segment: 'dashboard' },
      { label: 'Настройки', icon: 'settings-outline', route: '/(tabs)/settings', segment: 'settings' },
    ],
  },
];

const SIDEBAR_WIDTH = 240;

export default function TabsLayout() {
  const { user, logout } = useAuth();
  const { isMobile } = useResponsive();
  const router = useRouter();
  const isSpecialist = user?.role === 'SPECIALIST';
  const activeTabs = isSpecialist ? SPECIALIST_TABS : CLIENT_TABS;
  const activeNames = new Set(activeTabs.map((t) => t.name));

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  const sidebarNav = isSpecialist ? SPECIALIST_SIDEBAR_NAV : CLIENT_SIDEBAR_NAV;

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: isMobile
          ? {
              backgroundColor: Colors.bgPrimary,
              borderTopColor: Colors.borderLight,
              borderTopWidth: 1,
            }
          : { display: 'none' },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {ALL_TAB_NAMES.map((name) => {
        const tab = activeTabs.find((t) => t.name === name);
        const hidden = !activeNames.has(name);
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: tab?.title ?? name,
              href: hidden ? null : undefined,
              tabBarIcon: ({ color, size }) => (
                <Feather name={tab?.icon ?? 'circle'} size={size} color={color} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );

  // Desktop: sidebar + content
  if (!isMobile) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar
          items={sidebarNav}
          userEmail={user?.username || user?.email?.split('@')[0]}
          onLogout={handleLogout}
          width={SIDEBAR_WIDTH}
        />
        <View style={styles.desktopContent}>{tabs}</View>
      </View>
    );
  }

  // Mobile: regular bottom tabs
  return tabs;
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bgPrimary,
  },
  desktopContent: {
    flex: 1,
    overflow: 'hidden' as any,
  },
});
