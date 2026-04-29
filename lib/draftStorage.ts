import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Cross-platform key/value storage shim.
 * Uses localStorage on web, AsyncStorage on native.
 */
export const draftStorage = {
  get: async (k: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(k) : null;
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(k);
  },
  set: async (k: string, v: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(k, v);
      } catch {
        /* quota / private mode — fall back silently */
      }
      return;
    }
    await AsyncStorage.setItem(k, v);
  },
  del: async (k: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") window.localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
      return;
    }
    await AsyncStorage.removeItem(k);
  },
};
