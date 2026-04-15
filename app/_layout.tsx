import '../global.css';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { AuthProvider, useAuth } from '../stores/authStore';
import { isAdmin } from '../lib/adminEmails';
import { Colors } from '../constants/Colors';
import { tryRefreshTokens } from '../lib/api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ToastContainer } from '../components/Toast';

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
  const isRedirectingRef = useRef(false);

  useProactiveRefresh(!!user);

  useEffect(() => {
    if (isLoading) return;
    if (isRedirectingRef.current) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDashboardGroup = segments[0] === '(dashboard)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inPublicGroup = segments[0] === '(public)';
    // Public routes that guests can access freely
    const isPublicRoute =
      segments[0] === 'specialists' || segments[0] === 'requests' || segments[0] === 'pricing' || segments[0] === 'v2' || segments[0] === 'proto' || inPublicGroup;
    const inProtectedArea = inDashboardGroup || inTabsGroup;

    // New user must complete onboarding (specialist) or goes to dashboard (client)
    if (user && user.isNewUser && !inOnboardingGroup && !inAuthGroup) {
      isRedirectingRef.current = true;
      if (user.role === 'SPECIALIST') {
        router.replace('/(onboarding)/username');
      } else {
        // Client: skip onboarding entirely
        router.replace('/(tabs)/requests');
      }
      return;
    }

    if (!user && !inAuthGroup && !isPublicRoute && segments[0] !== undefined) {
      // Not authenticated and trying to access a protected route → landing
      isRedirectingRef.current = true;
      router.replace('/');
    } else if (user && inAuthGroup && !user.isNewUser) {
      // Already authenticated (and onboarded) still in auth group → tabs
      isRedirectingRef.current = true;
      router.replace('/(tabs)/requests');
    } else if (user && !inProtectedArea && !isPublicRoute && segments[0] === undefined) {
      // Authenticated user on landing → redirect to tabs
      isRedirectingRef.current = true;
      router.replace('/(tabs)/requests');
    } else if (user && inAdminGroup && !isAdmin(user.email)) {
      // Non-admin trying to access admin section → redirect to tabs
      isRedirectingRef.current = true;
      router.replace('/(tabs)/requests');
    } else {
      isRedirectingRef.current = false;
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
      <ErrorBoundary>
        <AuthProvider>
          <RootNavigator />
          <ToastContainer />
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
}
