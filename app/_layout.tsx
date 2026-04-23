import "../global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppShell>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public */}
        <Stack.Screen name="index" />

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

        {/* Public screens */}
        <Stack.Screen name="requests/index" />
        <Stack.Screen name="requests/new" />
        <Stack.Screen name="requests/[id]/index" />
        <Stack.Screen name="requests/[id]/detail" />
        <Stack.Screen name="requests/[id]/messages" />
        <Stack.Screen name="specialists/index" />
        <Stack.Screen name="specialists/[id]" />

        {/* Chat */}
        <Stack.Screen name="threads/[id]" />

        {/* Specialist flow */}
        <Stack.Screen name="requests/[id]/write" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings/client" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="brand" />

        {/* Admin detail screens */}
        <Stack.Screen name="admin/settings" />
            <Stack.Screen name="requests/[id]" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="specialists" />
      </Stack>
      </AppShell>
    </AuthProvider>
  );
}
