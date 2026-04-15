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
  { name: 'dashboard', title: 'Glavnaya', icon: 'home' },
  { name: 'requests', title: 'Zayavki', icon: 'file-text' },
  { name: 'messages', title: 'Soobscheniya', icon: 'message-circle' },
  { name: 'profile', title: 'Profil', icon: 'user' },
];

// Prototype: Specialist tabs — briefcase, send, message-circle, user
const SPECIALIST_TABS: TabConfig[] = [
  { name: 'feed', title: 'Kabinet', icon: 'briefcase' },
  { name: 'my-responses', title: 'Otkliki', icon: 'send' },
  { name: 'messages', title: 'Soobscheniya', icon: 'message-circle' },
  { name: 'dashboard', title: 'Profil', icon: 'user' },
];

const ALL_TAB_NAMES = ['dashboard', 'requests', 'messages', 'settings', 'feed', 'my-responses', 'profile'];

// Sidebar nav groups for desktop view
function buildClientSidebarNav(unreadNotifs: number): NavGroup[] {
  return [
    {
      items: [
        { label: 'Glavnaya', icon: 'home', route: '/(tabs)/dashboard', segment: 'dashboard' },
        { label: 'Zayavki', icon: 'file-text', route: '/(tabs)/requests', segment: 'requests' },
      ],
    },
    {
      label: 'Lichnoe',
      items: [
        { label: 'Soobscheniya', icon: 'message-circle', route: '/(tabs)/messages', segment: 'messages' },
        { label: 'Uvedomleniya', icon: 'bell', route: '/notifications', segment: 'notifications', badgeCount: unreadNotifs },
        { label: 'Profil', icon: 'user', route: '/(tabs)/profile', segment: 'profile' },
      ],
    },
  ];
}

function buildSpecialistSidebarNav(unreadNotifs: number): NavGroup[] {
  return [
    {
      items: [
        { label: 'Kabinet', icon: 'briefcase', route: '/(tabs)/feed', segment: 'feed' },
        { label: 'Otkliki', icon: 'send', route: '/(tabs)/my-responses', segment: 'my-responses' },
      ],
    },
    {
      label: 'Lichnoe',
      items: [
        { label: 'Soobscheniya', icon: 'message-circle', route: '/(tabs)/messages', segment: 'messages' },
        { label: 'Uvedomleniya', icon: 'bell', route: '/notifications', segment: 'notifications', badgeCount: unreadNotifs },
        { label: 'Profil', icon: 'user', route: '/(tabs)/dashboard', segment: 'dashboard' },
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
              borderTopColor: Colors.borderLight,
              borderTopWidth: 1,
              height: 60,
            }
          : { display: 'none' },
        tabBarLabelStyle: {
          fontSize: 10,
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
