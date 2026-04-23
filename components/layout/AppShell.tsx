import { useEffect } from "react";
import { View, Text, useWindowDimensions, Platform } from "react-native";
import { colors, spacing, typography } from "@/lib/theme";

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
 * - Tablet (768..1024px): centered column, max-width 1200px.
 * - Desktop (>=1024px): reserves a LEFT sidebar column (260px) as a stub
 *   for future role-aware navigation.
 *
 * Web-only max-width — native platforms always pass-through.
 *
 * Integrates at the root layout (app/_layout.tsx) so ALL screens get shell
 * on web. Existing screens keep their own paddings and are unaffected on mobile.
 */

interface AppShellProps {
  children: React.ReactNode;
}

const MAX_WIDTH = 1200;
const SIDEBAR_WIDTH = 260;
const TABLET_BP = 768;
const DESKTOP_BP = 1024;

export default function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS === "web") installFocusRingCSS();
  }, []);

  // Native platforms: pass-through (mobile UX preserved).
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const isTablet = width >= TABLET_BP;
  const isDesktop = width >= DESKTOP_BP;

  // Mobile web: pass-through too — avoid breaking mobile UX.
  if (!isTablet) {
    return <>{children}</>;
  }

  // Tablet / desktop: centered container with optional sidebar stub.
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
        {isDesktop && <SidebarStub />}
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

/**
 * Sidebar stub — reserves width, renders a brand mark + placeholder nav.
 * Real role-aware navigation arrives in a later iteration; this establishes
 * the shell.
 */
function SidebarStub() {
  const stubItems = ["Обзор", "Заявки", "Специалисты", "Сообщения", "Настройки"];
  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        paddingRight: spacing.lg,
      }}
    >
      {/* Brand mark */}
      <View
        style={{
          height: 44,
          paddingHorizontal: spacing.base,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.lg,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: colors.primary,
            marginRight: spacing.sm,
          }}
        />
        <Text className={typography.h3} style={{ color: colors.text }}>
          P2P<Text style={{ color: colors.primary }}>Tax</Text>
        </Text>
      </View>

      {/* Placeholder nav list — real router wiring comes next iteration */}
      <View style={{ gap: spacing.xs as number }}>
        {stubItems.map((label) => (
          <View
            key={label}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
