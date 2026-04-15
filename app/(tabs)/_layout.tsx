import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../stores/authStore';
import { useResponsive } from '../../lib/hooks/useResponsive';
import { useUnreadNotifications } from '../../lib/hooks/useUnreadNotifications';
import { Sidebar, NavGroup } from '../../components/Sidebar';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: FeatherIcon;
}

// Prototype: Client tabs — home, file-text, message-circle, user
const CLIENT_TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Главная', icon: 'home' },
  { name: 'requests', title: 'Заявки', icon: 'file-text' },
  { name: 'messages', title: 'Сообщения', icon: 'message-circle' },
  { name: 'profile', title: 'Профиль', icon: 'user' },
];

// Prototype: Specialist tabs — briefcase, send, message-circle, user
const SPECIALIST_TABS: TabConfig[] = [
  { name: 'feed', title: 'Кабинет', icon: 'briefcase' },
  { name: 'my-responses', title: 'Отклики', icon: 'send' },
  { name: 'messages', title: 'Сообщения', icon: 'message-circle' },
  { name: 'dashboard', title: 'Профиль', icon: 'user' },
];

const ALL_TAB_NAMES = ['dashboard', 'requests', 'messages', 'settings', 'feed', 'my-responses', 'profile'];

// Sidebar nav groups for desktop view
function buildClientSidebarNav(unreadNotifs: number): NavGroup[] {
  return [
    {
      items: [
        { label: 'Главная', icon: 'home', route: '/(tabs)/dashboard', segment: 'dashboard' },
        { label: 'Заявки', icon: 'file-text', route: '/(tabs)/requests', segment: 'requests' },
      ],
    },
    {
      label: 'Личное',
      items: [
        { label: 'Сообщения', icon: 'message-circle', route: '/(tabs)/messages', segment: 'messages' },
        { label: 'Уведомления', icon: 'bell', route: '/notifications', segment: 'notifications', badgeCount: unreadNotifs },
        { label: 'Профиль', icon: 'user', route: '/(tabs)/profile', segment: 'profile' },
        { label: 'Настройки', icon: 'settings', route: '/(tabs)/settings', segment: 'settings' },
      ],
    },
  ];
}

function buildSpecialistSidebarNav(unreadNotifs: number): NavGroup[] {
  return [
    {
      items: [
        { label: 'Кабинет', icon: 'briefcase', route: '/(tabs)/feed', segment: 'feed' },
        { label: 'Отклики', icon: 'send', route: '/(tabs)/my-responses', segment: 'my-responses' },
      ],
    },
    {
      label: 'Личное',
      items: [
        { label: 'Сообщения', icon: 'message-circle', route: '/(tabs)/messages', segment: 'messages' },
        { label: 'Уведомления', icon: 'bell', route: '/notifications', segment: 'notifications', badgeCount: unreadNotifs },
        { label: 'Профиль', icon: 'user', route: '/(tabs)/dashboard', segment: 'dashboard' },
        { label: 'Настройки', icon: 'settings', route: '/(tabs)/settings', segment: 'settings' },
      ],
    },
  ];
}

const SIDEBAR_WIDTH = 240;

export default function TabsLayout() {
  const { user, logout } = useAuth();
  const { isMobile } = useResponsive();
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();
  const isSpecialist = user?.role === 'SPECIALIST';
  const activeTabs = isSpecialist ? SPECIALIST_TABS : CLIENT_TABS;
  const activeNames = new Set(activeTabs.map((t) => t.name));

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  const sidebarNav = isSpecialist
    ? buildSpecialistSidebarNav(unreadCount)
    : buildClientSidebarNav(unreadCount);

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: isMobile
          ? {
              backgroundColor: Colors.bgCard,
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: 56,
            }
          : { display: 'none' },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          gap: 2,
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
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.bgPrimary }}>
        <Sidebar
          items={sidebarNav}
          userEmail={user?.username || user?.email?.split('@')[0]}
          onLogout={handleLogout}
          width={SIDEBAR_WIDTH}
        />
        <View style={{ flex: 1, overflow: 'hidden' as any }}>{tabs}</View>
      </View>
    );
  }

  // Mobile: regular bottom tabs
  return tabs;
}
