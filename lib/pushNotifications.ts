import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { client } from './api/client';
import { router } from 'expo-router';

// Configure notification handler (show notifications when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request permissions and get Expo push token */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Web doesn't support Expo push tokens
  if (Platform.OS === 'web') {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Android: set notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return tokenData.data;
}

/** Save push token to backend */
export async function savePushTokenToBackend(token: string): Promise<void> {
  const platform = Platform.OS; // 'ios' | 'android' | 'web'
  try {
    await client.post('/users/me/push-token', { token, platform });
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

/** Remove push token from backend (call on logout) */
export async function removePushTokenFromBackend(token: string): Promise<void> {
  try {
    await client.delete('/users/me/push-token', { data: { token } });
  } catch (err) {
    console.error('Failed to remove push token:', err);
  }
}

/** Handle notification tap — navigate to relevant screen */
export function setupNotificationResponseListener() {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (!data) return;

      if (data.threadId) {
        router.push(`/chat/${data.threadId}` as any);
      } else if (data.requestId) {
        router.push(`/requests/${data.requestId}` as any);
      } else if (data.reviewId) {
        router.push('/profile/reviews' as any);
      }
    },
  );

  return subscription;
}
