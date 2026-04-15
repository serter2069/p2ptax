import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../stores/authStore';
import { Colors } from '../constants/Colors';

/**
 * Root index — routing hub.
 * Unauthenticated users → public landing page.
 * Authenticated users → tabs (handled by _layout.tsx redirect).
 */
export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/(public)/landing');
    }
    // Authenticated users are redirected by _layout.tsx to /(tabs)/requests
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={Colors.brandPrimary} />
    </View>
  );
}
