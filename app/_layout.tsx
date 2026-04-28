import "../global.css";
import { useState } from "react";
import { useWindowDimensions, Platform, View, ActivityIndicator } from "react-native";
import { Stack, usePathname } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import AppHeader, { shouldShowAppHeader } from "@/components/layout/AppHeader";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { colors } from "@/lib/theme";

import MetroBridge from "@/components/MetroBridge";

const MOBILE_BREAKPOINT = 768;

/**
 * Thin wrapper that decides whether the persistent {@link AppHeader}
 * should render for the current route. Header is shown only for
 * authenticated users and only on routes that don't have their own
 * chrome (landing, auth, onboarding, legal).
 *
 * On mobile (<768px) the burger opens {@link MobileDrawer} — a slide-in
 * left rail that mirrors SidebarNav navigation items exactly.
 *
 * Issue GH-1285 — persistent header on every authenticated route.
 * Issue GH-1353 — mobile drawer navigation.
 * Issue GH-1367 — auth loading flash: show spinner while auth restores from storage.
 */
function AuthenticatedHeaderGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname() ?? "";
  const { width } = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Block rendering until AsyncStorage token restoration is complete.
  // Without this, authenticated users briefly see the public landing page.
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const show = isAuthenticated && shouldShowAppHeader(pathname);
  // MobileDrawer only on web mobile (native has bottom tabs; sidebar handles desktop)
  const showDrawer = Platform.OS === "web" && width < MOBILE_BREAKPOINT;
  // On desktop, AppShell's content pane already applies marginTop:56.
  // On mobile web, the fixed header needs offsetting via paddingTop on the
  // content container. Desktop web passes through here without extra padding.
  const isMobileWeb = Platform.OS === "web" && width < MOBILE_BREAKPOINT;

  return (
    <>
      {show && (
        <AppHeader
          onBurgerPress={showDrawer ? () => setDrawerOpen(true) : undefined}
        />
      )}
      {isMobileWeb && show ? (
        <View
          style={
            Platform.OS === "web"
              ? ({
                  paddingTop: 56,
                  paddingBottom: 60,
                  height: "100vh",
                  overflowY: "auto",
                } as object)
              : { flex: 1 }
          }
        >
          {children}
        </View>
      ) : (
        children
      )}
      {showDrawer && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MetroBridge />
      <AppShell>
        <AuthenticatedHeaderGate>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Public */}
            <Stack.Screen name="index" />

            {/* Iter11 PR 3 — unified authenticated tabs + admin-only tabs.
                Legacy (client-tabs)/(specialist-tabs) groups removed. */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(admin-tabs)" />

            {/* Auth flow */}
            <Stack.Screen name="login" />
            <Stack.Screen name="otp" />

            {/* Onboarding */}
            <Stack.Screen name="onboarding/name" />
            <Stack.Screen name="onboarding/work-area" />
            <Stack.Screen name="onboarding/profile" />

            {/* Public screens */}
            <Stack.Screen name="requests/index" />
            <Stack.Screen name="requests/new" />
            <Stack.Screen name="requests/create" />
            <Stack.Screen name="requests/[id]/index" />
            <Stack.Screen name="requests/[id]/detail" />
            <Stack.Screen name="requests/[id]/messages" />
            <Stack.Screen name="specialists/index" />
            <Stack.Screen name="specialists/[id]" />
            <Stack.Screen name="saved-specialists/index" />

            {/* Chat */}
            <Stack.Screen name="threads/[id]" />

            {/* Specialist flow */}
            <Stack.Screen name="requests/[id]/write" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="legal/index" options={{ headerShown: false }} />
            <Stack.Screen name="legal/privacy" />
            <Stack.Screen name="legal/terms" />
            {/* Issue GH-1293: /brand is a dev-only design-system page. */}
            {__DEV__ && <Stack.Screen name="brand" />}

            {/* Admin detail screens */}
            <Stack.Screen name="admin/settings" />
            <Stack.Screen name="requests/[id]" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="specialists" />
          </Stack>
        </AuthenticatedHeaderGate>
      </AppShell>
    </AuthProvider>
  );
}
