import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Unified secure storage adapter.
// - Web: localStorage (synchronous API wrapped in Promises)
// - Native (iOS/Android): expo-secure-store (Keychain / Keystore)
//
// Note: SecureStore on iOS has a ~2048-byte value limit per key.
// Values exceeding this will throw; the adapter catches and re-throws
// with a descriptive message so callers can handle it gracefully.

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // localStorage may be unavailable in private mode — swallow silently
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      // Most common cause: value exceeds 2048-byte iOS Keychain limit
      console.warn(`[secureStorage] setItem failed for key "${key}":`, err);
      throw err;
    }
  },

  // SecureStore uses deleteItemAsync, not removeItem
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        // swallow
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Key may not exist — treat as success
    }
  },
};

export { secureStorage };
