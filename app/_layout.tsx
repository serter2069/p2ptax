import '../global.css';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { AuthProvider, useAuth } from '../stores/authStore';
import { isAdmin } from '../lib/adminEmails';
import { Colors } from '../constants/Colors';
import { tryRefreshTokens } from '../lib/api';

const PROACTIVE_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes
const VISIBILITY_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

function useProactiveRefresh(isAuthenticated: boolean) {
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;

    async function refresh() {
      await tryRefreshTokens();
      lastRefreshRef.current = Date.now();
    }

    // 20-minute interval refresh
    const interval = setInterval(refresh, PROACTIVE_INTERVAL_MS);

    if (Platform.OS === 'web') {
      // Web: listen for tab visibility changes
      const onVisibilityChange = () => {
        if (
          document.visibilityState === 'visible' &&
          Date.now() - lastRefreshRef.current >= VISIBILITY_THRESHOLD_MS
        ) {
          refresh();
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    } else {
      // Native: listen for AppState changes (background → active)
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (
          nextState === 'active' &&
          Date.now() - lastRefreshRef.current >= VISIBILITY_THRESHOLD_MS
        ) {
          refresh();
        }
      });
      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }
  }, [isAuthenticated]);
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useProactiveRefresh(!!user);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDashboardGroup = segments[0] === '(dashboard)';
    const inAdminGroup = segments[0] === '(admin)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    // Public routes that guests can access freely
    const isPublicRoute =
      segments[0] === 'specialists' || segments[0] === 'requests' || segments[0] === 'pricing';

    // New user must complete onboarding before accessing anything else
    if (user && user.isNewUser && !inOnboardingGroup) {
      router.replace('/(onboarding)/username');
      return;
    }

    if (!user && !inAuthGroup && !isPublicRoute && segments[0] !== undefined) {
      // Not authenticated and trying to access a protected route → landing
      router.replace('/');
    } else if (user && inAuthGroup) {
      // Already authenticated and still in auth group → dashboard
      router.replace('/(dashboard)');
    } else if (user && !inDashboardGroup && !isPublicRoute && segments[0] === undefined) {
      // Authenticated user on landing → redirect to dashboard
      router.replace('/(dashboard)');
    } else if (user && inAdminGroup && !isAdmin(user.email)) {
      // Non-admin trying to access admin section → redirect to dashboard
      router.replace('/(dashboard)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Налоговик — поиск налоговых специалистов</title>
        <meta name="description" content="Найдите налогового специалиста или получите заявки от клиентов" />
        <meta property="og:title" content="Налоговик" />
        <meta property="og:description" content="Сервис поиска налоговых специалистов" />
        <meta property="og:type" content="website" />
      </Head>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </>
  );
}
