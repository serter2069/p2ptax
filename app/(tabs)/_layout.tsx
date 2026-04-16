import React from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';

// Mapping from BottomNav tab ids to expo-router route names
const CLIENT_TAB_MAP: Record<string, string> = {
  home: 'dashboard',
  requests: 'requests',
  messages: 'messages',
  profile: 'profile',
};

const SPECIALIST_TAB_MAP: Record<string, string> = {
  dashboard: 'specialist-dashboard',
  responses: 'my-responses',
  messages: 'messages',
  profile: 'profile',
};

// Reverse mapping: route name -> tab id
const CLIENT_ROUTE_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(CLIENT_TAB_MAP).map(([k, v]) => [v, k]),
);
const SPECIALIST_ROUTE_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(SPECIALIST_TAB_MAP).map(([k, v]) => [v, k]),
);

function getInitials(user: { firstName?: string; lastName?: string; email?: string } | null): string {
  if (!user) return '??';
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return '??';
}

export default function TabsLayout() {
  const { user, role, isAuthenticated } = useAuth();
  const router = useRouter();
  const isSpecialist = role === 'specialist';

  const routeToTab = isSpecialist ? SPECIALIST_ROUTE_TO_TAB : CLIENT_ROUTE_TO_TAB;
  const tabMap = isSpecialist ? SPECIALIST_TAB_MAP : CLIENT_TAB_MAP;

  return (
    <View className="flex-1">
      <Header
        variant={isAuthenticated ? 'auth' : 'guest'}
        initials={getInitials(user)}
        onLogin={() => router.push('/(auth)/email')}
        onProfile={() => router.push('/(tabs)/profile')}
        onBurgerLink={(label) => {
          if (label === 'Главная') router.push('/');
          if (label === 'Специалисты') router.push('/specialists' as any);
          if (label === 'Тарифы') router.push('/tariffs' as any);
        }}
      />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={({ state, navigation }) => {
          const currentRoute = state.routes[state.index]?.name ?? '';
          const activeId = routeToTab[currentRoute] ?? currentRoute;

          return (
            <BottomNav
              activeId={activeId}
              variant={isSpecialist ? 'specialist' : 'client'}
              onTabPress={(id) => {
                const routeName = tabMap[id];
                if (routeName) {
                  navigation.navigate(routeName);
                }
              }}
            />
          );
        }}
      >
        {/* Client tabs */}
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="requests" options={{ title: 'Requests' }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

        {/* Specialist tabs */}
        <Tabs.Screen name="specialist-dashboard" options={{ title: 'Specialist Dashboard' }} />
        <Tabs.Screen name="my-responses" options={{ title: 'My Responses' }} />

        {/* Hidden tabs — exist as files but not shown in nav */}
        <Tabs.Screen name="feed" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="specialist-settings" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
