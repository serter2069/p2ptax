import "../global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public */}
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />

        {/* Role-based tab groups */}
        <Stack.Screen name="(client-tabs)" />
        <Stack.Screen name="(specialist-tabs)" />
        <Stack.Screen name="(admin-tabs)" />

        {/* Legacy tabs (kept for compatibility) */}
        <Stack.Screen name="(tabs)" />

        {/* Auth flow */}
        <Stack.Screen name="auth/email" />
        <Stack.Screen name="auth/otp" />

        {/* Onboarding */}
        <Stack.Screen name="onboarding/name" />
        <Stack.Screen name="onboarding/work-area" />
        <Stack.Screen name="onboarding/profile" />

        {/* Shared screens */}
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="brand" />
      </Stack>
    </AuthProvider>
  );
}
