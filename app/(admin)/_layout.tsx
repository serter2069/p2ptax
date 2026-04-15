import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { isAdmin } from '../../lib/adminEmails';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';

const ADMIN_ITEMS: Array<{
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  route: string;
  segment: string;
}> = [
  { id: 'dashboard', icon: 'bar-chart-2', label: 'Statistika', route: '/(admin)', segment: 'index' },
  { id: 'users', icon: 'users', label: 'Polzovateli', route: '/(admin)/users', segment: 'users' },
  { id: 'requests', icon: 'file-text', label: 'Zayavki', route: '/(admin)/requests', segment: 'requests' },
  { id: 'moderation', icon: 'shield', label: 'Moderaciya', route: '/(admin)/moderation', segment: 'moderation' },
  { id: 'reviews', icon: 'star', label: 'Otzyvy', route: '/(admin)/reviews', segment: 'reviews' },
  { id: 'promotions', icon: 'gift', label: 'Promo', route: '/(admin)/promotions', segment: 'promotions' },
];

function AdminNavBar() {
  const router = useRouter();
  const segments = useSegments();

  function isActive(segment: string): boolean {
    return segments.includes(segment as any);
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      paddingHorizontal: Spacing.lg,
      backgroundColor: Colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderLight,
      gap: Spacing.xl,
      ...Platform.select({
        web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
        default: { ...Shadows.sm },
      }),
    }}>
      <Text style={{
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
      }}>Nalogovik Admin</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 2,
          flex: 1,
          flexWrap: 'wrap',
        }}
      >
        {ADMIN_ITEMS.map((item) => {
          const active = isActive(item.segment);
          return (
            <Pressable
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 6,
                borderRadius: BorderRadius.md,
                ...(active ? { backgroundColor: Colors.bgSecondary } : {}),
              }}
              onPress={() => router.push(item.route as any)}
            >
              <Feather
                name={item.icon}
                size={14}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              <Text style={{
                fontSize: Typography.fontSize.xs,
                fontWeight: active ? Typography.fontWeight.semibold : Typography.fontWeight.medium,
                color: active ? Colors.brandPrimary : Colors.textMuted,
              }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isAdmin(user.email)) {
      router.replace('/(dashboard)');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !isAdmin(user.email)) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <AdminNavBar />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
