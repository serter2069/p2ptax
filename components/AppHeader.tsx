import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

function LogoBlock() {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-7 w-7 items-center justify-center rounded-md bg-brandPrimary">
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text className="text-lg font-bold text-textPrimary">Налоговик</Text>
    </View>
  );
}

function NotifBell({ hasNotif = false }: { hasNotif?: boolean }) {
  return (
    <Pressable onPress={() => {}}>
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {hasNotif && (
        <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-statusError" />
      )}
    </Pressable>
  );
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <View
      className="h-8 w-8 items-center justify-center rounded-full border bg-bgSecondary"
      style={{ borderColor: Colors.border }}
    >
      <Text className="text-xs font-bold text-brandPrimary">{initials}</Text>
    </View>
  );
}

// Variant: back navigation header for detail/inner pages
export function BackHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View
      className="h-14 flex-row items-center justify-between border-b bg-bgCard px-4"
      style={{ borderBottomColor: Colors.borderLight }}
    >
      <Pressable className="flex-row items-center gap-2" onPress={onBack}>
        <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
        <Text className="text-base font-semibold text-textPrimary">{title}</Text>
      </Pressable>
      <Pressable>
        <Feather name="more-vertical" size={20} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

// Main authenticated header with logo, bell, avatar
export function AppHeader({
  initials = 'EV',
  hasNotif = false,
}: {
  initials?: string;
  hasNotif?: boolean;
}) {
  return (
    <View
      className="h-14 flex-row items-center justify-between border-b bg-bgCard px-4"
      style={{ borderBottomColor: Colors.borderLight }}
    >
      <LogoBlock />
      <View className="flex-row items-center gap-3">
        <NotifBell hasNotif={hasNotif} />
        <AvatarCircle initials={initials} />
      </View>
    </View>
  );
}
