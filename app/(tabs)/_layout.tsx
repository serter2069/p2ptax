import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../stores/authStore';

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
  { name: 'requests', title: 'Заявки', icon: 'file-text' },
  { name: 'messages', title: 'Сообщения', icon: 'message-circle' },
  { name: 'dashboard', title: 'Профиль', icon: 'user' },
  { name: 'settings', title: 'Настройки', icon: 'settings' },
];

const ALL_TAB_NAMES = ['dashboard', 'requests', 'messages', 'settings', 'feed'];

export default function TabsLayout() {
  const { user } = useAuth();
  const isSpecialist = user?.role === 'SPECIALIST';
  const activeTabs = isSpecialist ? SPECIALIST_TABS : CLIENT_TABS;
  const activeNames = new Set(activeTabs.map((t) => t.name));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bgPrimary,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
        },
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
}
