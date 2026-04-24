import { useEffect } from "react";
import { View, useWindowDimensions, Platform } from "react-native";
import { usePathname, useSegments } from "expo-router";
import { colors } from "@/lib/theme";
import SidebarNav, { detectSidebarGroup, SIDEBAR_WIDTH } from "./SidebarNav";

/**
 * AppShell — desktop-first authenticated shell (iter10 Phase 3a).
 *
 * Triggered by multi-model critique (2026-04-24, 4/4 consensus P0):
 *   "Implement a persistent left sidebar navigation (240px) for all
 *    authenticated routes, push content to a max-width 960px container."
 *
 * Layout contract:
 *   - Mobile  (<768px)  : pass-through. Existing bottom-tab + burger UX.
 *   - Desktop (>=768px) : flex-row root with fixed {@link SidebarNav} on
 *     the left (240px) and a scrollable main pane on the right. The main
 *     pane hosts AppHeader + page content; page content is constrained
 *     to 960px by {@link DesktopScreen} and its descendants.
 *   - Native platforms  : pass-through (mobile UX preserved).
 *
 * Public-chrome routes (/, /auth/*, /onboarding/*, /legal/*, /brand) also
 * bypass the sidebar because {@link detectSidebarGroup} returns `null`.
 * Those screens keep their own marketing chrome.
 */

const FOCUS_RING_STYLE_ID = "p2ptax-focus-ring";
function installFocusRingCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById(FOCUS_RING_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = FOCUS_RING_STYLE_ID;
  style.textContent = `
    input:focus, textarea:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(34, 86, 194, 0.2);
      border-radius: 10px;
    }
  `;
  document.head.appendChild(style);
}

interface AppShellProps {
  children: React.ReactNode;
}

const SIDEBAR_BREAKPOINT = 768;

export default function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname() ?? "";
  const segments = useSegments();

  useEffect(() => {
    if (Platform.OS === "web") installFocusRingCSS();
  }, []);

  // Native: preserve mobile UX.
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const isDesktop = width >= SIDEBAR_BREAKPOINT;
  const group = detectSidebarGroup(pathname, segments as readonly string[]);
  const showSidebar = isDesktop && group !== null;

  // Mobile web or public-chrome routes: pass-through.
  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        flexDirection: "row",
        backgroundColor: colors.surface2,
        minHeight: "100%",
      }}
    >
      <SidebarNav group={group} />
      <View
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: "100%",
          // The main pane is the scroll container — pages keep their own
          // ScrollView for pull-to-refresh, but the shell provides the
          // top-level overflow on desktop web.
          ...(Platform.OS === "web"
            ? ({ overflowY: "auto", maxWidth: `calc(100% - ${SIDEBAR_WIDTH}px)` } as object)
            : {}),
        }}
      >
        {children}
      </View>
    </View>
  );
}
