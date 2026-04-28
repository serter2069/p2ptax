import { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, Platform } from "react-native";
import { useRouter, usePathname, useSegments } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { Settings, LogOut } from "lucide-react-native";
import { colors, spacing, roleAccent, type RoleAccentKey } from "@/lib/theme";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";
import RoleBadge from "./RoleBadge";
import {
  type MatchContext,
  itemsForGroup,
} from "@/lib/nav-items";

/**
 * SidebarNav — persistent left-rail navigation for authenticated routes.
 *
 * Triggered by multi-model critique (2026-04-24, 4/4 consensus P0):
 *   "Implement a persistent left sidebar navigation (240px) for all
 *    authenticated routes, push content to max-width 960px container."
 *
 * Design:
 *   - 240px wide, full-height, sticky to left edge.
 *   - Role-tinted background (blue client / emerald specialist / amber admin).
 *   - 3 zones: brand + role badge · primary nav · bottom identity/settings.
 *   - Active item: tint bg + left 2px accent border + bold label.
 *
 * Mobile (<768px): component is NOT rendered. AppShell bypasses on mobile
 * and falls back to the existing bottom-tab + burger pattern.
 */

export type SidebarGroup =
  | "user"
  | "admin"
  | "main"
  | null;

// ─────────────────────────────────────────── classification helpers

function toAccentKey(
  role: UserRole,
  isSpecialist: boolean
): RoleAccentKey {
  if (role === "ADMIN") return "admin";
  // Iter11 PR 3 — isSpecialist is the single source of truth now that
  // legacy CLIENT/SPECIALIST enum values have been removed.
  if (isSpecialist) return "specialist";
  return "client";
}

/**
 * Classify current Expo-Router location to a tab group. Returns null for
 * public chrome (auth, onboarding, landing, legal) so AppShell can fall
 * back to its no-sidebar layout.
 *
 * Why both `pathname` AND `segments`?
 *   - `usePathname()` strips group parens, so `/(tabs)/dashboard`
 *     reports as `/dashboard` — we can't recover the group from it.
 *   - `useSegments()` keeps raw segments including `(tabs)` —
 *     that's the authoritative source of group membership.
 *
 * Role-guard: if pathname starts with `/(admin-tabs)` but the user is
 * not ADMIN, we return the regular "user" group instead of "admin" so
 * non-admins never see the admin sidebar.
 */
export function detectSidebarGroup(
  pathname: string,
  segments: readonly string[] = [],
  role?: UserRole
): SidebarGroup {
  if (!pathname) return null;

  // Segments are authoritative — check them FIRST before pathname heuristics.
  // Critical: (tabs)/index resolves to pathname="/" which would otherwise be
  // caught by the public-chrome guard, hiding the sidebar on the dashboard.
  const first = segments[0] ?? "";
  if (first === "(tabs)") return "user";
  if (first === "(admin-tabs)") {
    return role === "ADMIN" ? "admin" : "user";
  }

  // Public-chrome screens own their own layout.
  if (pathname === "/") return null;
  if (pathname.startsWith("/auth")) return null;
  if (pathname.startsWith("/legal")) return null;
  if (pathname.startsWith("/onboarding")) return null;
  if (pathname === "/brand") return null;

  // Fallback: pathname-based match for route transitions when segments
  // haven't settled yet.
  if (pathname.includes("/admin-tabs/") || pathname.includes("(admin-tabs)")) {
    return role === "ADMIN" ? "admin" : "user";
  }

  // Top-level authenticated screens reachable from sidebar (requests,
  // specialists, notifications, threads, settings): show a generic "main"
  // sidebar scoped to the user's role.
  if (
    pathname.startsWith("/specialists") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/threads") ||
    pathname.startsWith("/settings")
  ) {
    return "main";
  }

  return null;
}

export const SIDEBAR_WIDTH = 240;

interface SidebarNavProps {
  group: SidebarGroup;
}

export default function SidebarNav({ group }: SidebarNavProps) {
  const router = useRouter()
  const nav = useTypedRouter();
  const pathname = usePathname() ?? "";
  const segments = useSegments();
  const { user, isSpecialistUser, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiGet<{ count: number }>("/api/messages/unread-count")
      .then((r) => setUnreadCount(r.count))
      .catch(() => {});
    const interval = setInterval(() => {
      apiGet<{ count: number }>("/api/messages/unread-count")
        .then((r) => setUnreadCount(r.count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const matchCtx: MatchContext = {
    path: pathname,
    segments: segments as readonly string[],
  };

  const accentKey = toAccentKey(user?.role ?? null, isSpecialistUser);
  const accent = roleAccent[accentKey];
  const items = itemsForGroup(group, user?.role ?? null, isSpecialistUser);
  if (items.length === 0) return null;

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "Пользователь";
  const initials =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    nav.replaceRoutes.login();
  };

  const settingsPath =
    user?.role === "ADMIN" ? "/admin/settings" : "/settings";

  return (
    <View
      accessibilityRole="menubar"
      style={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        backgroundColor: accent.soft,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        ...(Platform.OS === "web"
          ? ({
              position: "fixed",
              top: 56,
              left: 0,
              height: "calc(100vh - 56px)",
              overflowY: "auto",
            } as object)
          : {}),
      }}
    >
      {/* Brand + role badge */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="P2PTax — главная"
        onPress={() => nav.routes.home()}
        style={{
          height: 48,
          paddingHorizontal: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: accent.strong,
            marginRight: spacing.sm,
          }}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
          }}
        >
          P2P
          <Text style={{ color: accent.strong }}>Tax</Text>
        </Text>
      </Pressable>

      <View style={{ paddingHorizontal: spacing.sm, marginBottom: spacing.md }}>
        <RoleBadge role={user?.role ?? null} isSpecialist={isSpecialistUser} size="sm" />
      </View>

      {/* Primary nav */}
      <View style={{ gap: 2, flex: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(matchCtx);
          return (
            <Pressable
              key={item.href}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              onPress={() => nav.any(item.href)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                minHeight: 44,
                paddingLeft: spacing.md,
                paddingRight: spacing.sm,
                borderRadius: 8,
                backgroundColor: active ? accent.strong : "transparent",
                borderLeftWidth: 2,
                borderLeftColor: active ? accent.strong : "transparent",
              }}
            >
              <Icon
                size={18}
                color={active ? accent.ink : colors.textSecondary}
              />
              <Text
                style={{
                  marginLeft: spacing.sm + 4,
                  fontSize: 14,
                  fontWeight: active ? "700" : "500",
                  color: active ? accent.ink : colors.text,
                  flexShrink: 1,
                  flex: 1,
                }}
              >
                {item.label}
              </Text>
              {unreadCount > 0 && item.href === "/(tabs)/messages" && (
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.danger,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 4,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Bottom identity cluster */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
          marginTop: spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть меню профиля"
          onPress={() => setDropdownOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.sm,
            borderRadius: 10,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: accent.strong,
              alignItems: "center",
              justifyContent: "center",
              marginRight: spacing.sm,
            }}
          >
            <Text style={{ color: accent.ink, fontSize: 13, fontWeight: "700" }}>
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: "600", color: colors.text }}
            >
              {displayName}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, color: colors.textSecondary }}
            >
              {user?.email ?? ""}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Dropdown modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть меню"
          onPress={() => setDropdownOpen(false)}
          style={{ flex: 1 }}
        >
          <View
            style={{
              position: "absolute",
              bottom: 72,
              left: spacing.md,
              width: SIDEBAR_WIDTH - spacing.md * 2,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.xs,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Настройки"
              onPress={() => {
                setDropdownOpen(false);
                nav.any(settingsPath);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
                borderRadius: 8,
              }}
            >
              <Settings size={16} color={colors.textSecondary} />
              <Text
                style={{
                  marginLeft: spacing.sm,
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                Настройки
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выйти"
              onPress={handleLogout}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
                borderRadius: 8,
              }}
            >
              <LogOut size={16} color={colors.danger} />
              <Text
                style={{
                  marginLeft: spacing.sm,
                  fontSize: 14,
                  color: colors.danger,
                }}
              >
                Выйти
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
