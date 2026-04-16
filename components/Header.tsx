import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../lib/auth';
import { notifications } from '../lib/api/endpoints';

const BURGER_LINKS: { icon: 'home' | 'users'; label: string; route: string }[] = [
  { icon: 'home', label: 'Главная', route: '/' },
  { icon: 'users', label: 'Специалисты', route: '/specialists' },
];

function LogoBlock() {
  return (
    <Pressable className="flex-row items-center gap-2" onPress={() => router.push('/')}>
      <View className="h-7 w-7 items-center justify-center rounded-md bg-brandPrimary">
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text className="text-lg font-bold text-textPrimary">Налоговик</Text>
    </Pressable>
  );
}

function BurgerDrawer({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  if (!open) return null;
  return (
    <>
      <Pressable
        className="absolute bottom-0 left-0 right-0"
        style={{ top: 56, backgroundColor: 'rgba(15,36,71,0.4)', zIndex: 1 }}
        onPress={onToggle}
      />
      <View
        className="absolute right-0 rounded-bl-xl border-b border-l bg-bgCard px-4 py-4"
        style={{
          top: 56,
          width: 240,
          zIndex: 2,
          borderColor: Colors.borderLight,
        }}
      >
        {BURGER_LINKS.map((link) => (
          <Pressable key={link.label} className="flex-row items-center gap-3 py-2.5" onPress={() => { onToggle(); router.push(link.route as any); }}>
            <Feather name={link.icon} size={18} color={Colors.textSecondary} />
            <Text className="text-base text-textSecondary">{link.label}</Text>
          </Pressable>
        ))}
        <View className="my-2 h-px bg-borderLight" />
        <Pressable className="flex-row items-center gap-3 py-2.5" onPress={() => { onToggle(); router.push('/(auth)/role' as any); }}>
          <Feather name="log-in" size={18} color={Colors.brandPrimary} />
          <Text className="text-base font-semibold text-brandPrimary">Войти</Text>
        </Pressable>
      </View>
    </>
  );
}

export function Header({
  variant,
  backTitle,
  hasNotif,
  onBack,
}: {
  variant: 'guest' | 'auth' | 'back';
  backTitle?: string;
  /** Optional override. If undefined, fetches unread count from /notifications/unread-count. */
  hasNotif?: boolean;
  onBack?: () => void;
}) {
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (variant !== 'auth' || !isAuthenticated || hasNotif !== undefined) return;
    let cancelled = false;
    const load = () => {
      notifications.unreadCount()
        .then((res) => {
          if (!cancelled) setUnreadCount(res.data?.count ?? 0);
        })
        .catch(() => { /* non-critical */ });
    };
    load();
    const t = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [variant, isAuthenticated, hasNotif]);

  const showNotifDot = hasNotif ?? unreadCount > 0;

  if (variant === 'back') {
    return (
      <View
        className="h-14 flex-row items-center border-b bg-bgCard px-4"
        style={{ borderBottomColor: Colors.borderLight }}
      >
        <Pressable className="flex-row items-center gap-2" onPress={onBack ?? (() => router.back())}>
          <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
          <Text className="text-base font-semibold text-textPrimary">
            {backTitle ?? 'Назад'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (variant === 'guest') {
    return (
      <View className="relative" style={{ zIndex: 10 }}>
        <View
          className="h-14 flex-row items-center justify-between border-b bg-white px-5"
          style={{ borderBottomColor: Colors.borderLight }}
        >
          <LogoBlock />
          <View className="flex-row items-center gap-4">
            <Pressable className="h-9 flex-row items-center gap-1.5 rounded-lg bg-brandPrimary px-4" onPress={() => router.push('/(auth)/role' as any)}>
              <Text className="text-sm font-semibold text-white">Войти</Text>
            </Pressable>
            <Pressable onPress={() => setBurgerOpen(!burgerOpen)}>
              <Feather
                name={burgerOpen ? 'x' : 'menu'}
                size={22}
                color={Colors.textPrimary}
              />
            </Pressable>
          </View>
        </View>
        <BurgerDrawer open={burgerOpen} onToggle={() => setBurgerOpen(false)} />
      </View>
    );
  }

  // variant === 'auth'
  const initials = user
    ? ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || 'U'
    : 'U';

  return (
    <View
      className="h-14 flex-row items-center justify-between border-b bg-bgCard px-4"
      style={{ borderBottomColor: Colors.borderLight }}
    >
      <LogoBlock />
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.push('/notifications' as any)}>
          <Feather name="bell" size={20} color={Colors.textSecondary} />
          {showNotifDot && (
            <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-statusError" />
          )}
        </Pressable>
        <View
          className="h-8 w-8 items-center justify-center rounded-full border bg-bgSecondary"
          style={{ borderColor: Colors.border }}
        >
          <Text className="text-xs font-bold text-brandPrimary">{initials}</Text>
        </View>
      </View>
    </View>
  );
}
