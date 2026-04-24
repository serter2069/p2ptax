import { useEffect } from "react";
import { View, useWindowDimensions, Platform } from "react-native";
import { usePathname } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import SidebarNav, { detectSidebarGroup } from "./SidebarNav";

/**
 * Install a web-only <style> tag once — gives TextInput a visible focus ring
 * without touching every component. RN Web renders <input>/<textarea>; the
 * rule below adds a 3px accent-soft box-shadow on :focus. Style audits
 * (naked-input / no-focus-ring) rely on that diff.
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

/**
 * AppShell — desktop-first layout container.
 *
 * - Mobile (<768px): pass-through, no container, no sidebar.
 * - Tablet (768..1024px): centered column, max-width 1280px.
 * - Desktop (>=1024px): LEFT sidebar with role-aware navigation + content card.
 *
 * Sidebar visibility is route-aware (via usePathname): role-based links are
 * shown only when the user is inside a tab group. Outside those groups (auth,
 * onboarding, landing "/") the shell falls back to a plain centered column so
 * public pages don't grow a stray sidebar.
 */

interface AppShellProps {
  children: React.ReactNode;
}

const MAX_WIDTH = 1280;
const TABLET_BP = 768;
const DESKTOP_BP = 1024;

export default function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (Platform.OS === "web") installFocusRingCSS();
  }, []);

  // Native platforms: pass-through (mobile UX preserved).
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const isTablet = width >= TABLET_BP;
  const isDesktop = width >= DESKTOP_BP;

  // Mobile web: pass-through — preserve bottom-tab mobile UX.
  if (!isTablet) {
    return <>{children}</>;
  }

  const group = detectSidebarGroup(pathname);
  const showSidebar = isDesktop && group !== null;

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        alignItems: "center",
        backgroundColor: colors.surface2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          maxWidth: MAX_WIDTH,
          flex: 1,
          paddingHorizontal: isDesktop ? spacing.xl : spacing.lg,
          paddingVertical: spacing.lg,
        }}
      >
        {showSidebar && <SidebarNav group={group} />}
        <View
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
