import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type TabDef = {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  badge?: boolean;
};

const CLIENT_TABS: TabDef[] = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'requests', icon: 'file-text', label: 'Заявки' },
  { id: 'messages', icon: 'message-circle', label: 'Сообщения', badge: true },
  { id: 'profile', icon: 'user', label: 'Профиль' },
];

const SPECIALIST_TABS: TabDef[] = [
  { id: 'dashboard', icon: 'briefcase', label: 'Кабинет' },
  { id: 'responses', icon: 'send', label: 'Отклики' },
  { id: 'messages', icon: 'message-circle', label: 'Сообщения', badge: true },
  { id: 'profile', icon: 'user', label: 'Профиль' },
];

export function BottomNav({
  activeId,
  variant = 'client',
  onTabPress,
}: {
  activeId: string;
  variant?: 'client' | 'specialist';
  onTabPress?: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  // Hide bottom nav on desktop — desktop uses top nav links
  if (width >= 640) return null;

  const tabs = variant === 'specialist' ? SPECIALIST_TABS : CLIENT_TABS;

  return (
    <View
      className="h-[60px] flex-row items-center border-t bg-bgCard"
      style={{ borderTopColor: Colors.borderLight }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            className="flex-1 items-center justify-center gap-[2px]"
            onPress={() => onTabPress?.(tab.id)}
          >
            <View>
              <Feather
                name={tab.icon}
                size={20}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              {tab.badge && (
                <View className="absolute -right-1.5 -top-[3px] h-2 w-2 rounded-full bg-statusError" />
              )}
            </View>
            <Text
              className={`font-medium ${active ? 'font-bold text-brandPrimary' : 'text-textMuted'}`}
              style={{ fontSize: 10 }}
            >
              {tab.label}
            </Text>
            {active && (
              <View className="absolute bottom-0 h-0.5 w-5 rounded-sm bg-brandPrimary" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
