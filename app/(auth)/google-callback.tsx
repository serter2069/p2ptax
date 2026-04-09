import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { setRefreshToken } from '../../lib/api';
import { Colors } from '../../constants/Colors';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    isNewUser?: string;
    userId?: string;
    email?: string;
    role?: string;
    username?: string;
  }>();
  const { login, clearNewUser } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      const { accessToken, refreshToken, isNewUser, userId, email, role, username } = params;

      if (!accessToken || !userId || !email || !role) {
        // Invalid callback — redirect to login
        router.replace('/(auth)/email');
        return;
      }

      if (refreshToken) {
        await setRefreshToken(refreshToken);
      }

      const isNew = isNewUser === 'true';

      await login(accessToken, {
        userId,
        email,
        role,
        username: username || null,
        isNewUser: isNew,
      });

      if (isNew) {
        if (role === 'SPECIALIST') {
          router.replace('/(onboarding)/username');
        } else {
          await clearNewUser();
          router.replace('/(dashboard)');
        }
      } else {
        router.replace('/(dashboard)');
      }
    }

    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.brandPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
