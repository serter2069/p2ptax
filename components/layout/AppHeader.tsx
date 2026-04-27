import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  useWindowDimensions,
  Modal,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Bell, Menu, Search, Settings, LogOut, User } from "lucide-react-native";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { colors, roleAccent, type RoleAccentKey, gray, spacing } from "@/lib/theme";
import MobileMenu from "@/components/MobileMenu";
import RoleBadge from "./RoleBadge";

/**
 * iter10 Phase 3a: Desktop now renders SidebarNav which owns the role-accent
 * brand/badge. AppHeader becomes a slim top-rail (search + right cluster) with
 * NO role-accent border-top. Mobile keeps its compact burger/title/bell row.
 */

/**
 * Persistent in-app header rendered on every authenticated route.
 *
 * Desktop (>= 640px): logo + breadcrumb + search input + role badge + bell + avatar dropdown.
 * Mobile  (<  640px): burger + centered title + bell, dropdown deferred to MobileMenu.
 *
 * Issue GH-1285 (persistent header), GH-1289 (role accent tint).
 *
 * The component deliberately keeps its own breadcrumb mapping small —
 * more sophisticated trails can be added later once the screen set
 * stabilises. When there is no match the breadcrumb is hidden.
 */

export interface AppHeaderProps {
  /** Optional override for the breadcrumb title. Falls back to route inference. */
  title?: string;
}

function toAccentKey(
  role: UserRole,
  isSpecialist: boolean
): RoleAccentKey {
  if (role === "ADMIN") return "admin";
  // Iter11 — isSpecialist opt-in drives the accent for USER/CLIENT/SPECIALIST.
  if (isSpecialist) return "specialist";
  return "client";
}

// Shallow breadcrumb mapping — exact-prefix first, then longest-prefix wins.
const BREADCRUMB_MAP: ReadonlyArray<{ prefix: string; label: string }> = [
  // Iter11 — unified (tabs) replaces split groups.
  { prefix: "/(tabs)/public-requests", label: "Публичные заявки" },
  { prefix: "/(tabs)/requests", label: "Мои заявки" },
  { prefix: "/(tabs)/messages", label: "Сообщения" },
  { prefix: "/(tabs)/profile", label: "Профиль" },
  { prefix: "/(tabs)", label: "Дашборд" },
  { prefix: "/(admin-tabs)/dashboard", label: "Админ · Обзор" },
  { prefix: "/(admin-tabs)/users", label: "Пользователи" },
  { prefix: "/(admin-tabs)/moderation", label: "Модерация" },
  { prefix: "/(admin-tabs)/complaints", label: "Жалобы" },
  { prefix: "/admin/settings", label: "Админ · Настройки" },
  { prefix: "/specialists", label: "Специалисты" },
  { prefix: "/requests/new", label: "Новая заявка" },
  { prefix: "/requests", label: "Заявки" },
  { prefix: "/threads", label: "Переписки" },
  { prefix: "/settings", label: "Настройки" },
  { prefix: "/notifications", label: "Уведомления" },
];

function inferBreadcrumb(pathname: string): string | null {
  if (!pathname) return null;
  const sorted = [...BREADCRUMB_MAP].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const entry of sorted) {
    // Normalise paren-group markers: Expo Router may emit either form.
    const normalised = pathname.replace(/\((admin-)?tabs\)/g, (m) => (m === "(admin-tabs)" ? "/admin-tabs/" : "/tabs/"));
    if (pathname.startsWith(entry.prefix) || normalised.includes(entry.prefix.replace(/[()]/g, ""))) {
      return entry.label;
    }
  }
  return null;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { user, isSpecialistUser, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");

  const accentKey = toAccentKey(user?.role ?? null, isSpecialistUser);
  const accent = roleAccent[accentKey];

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "Пользователь";
  const initials =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const breadcrumb = title ?? inferBreadcrumb(pathname);

  const handleSearchSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/specialists" as never);
      return;
    }
    router.push(`/specialists?q=${encodeURIComponent(trimmed)}` as never);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    router.replace("/login" as never);
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    // Iter11 — unified /settings for all non-admin USERs. Admin still has
    // its own bespoke settings page.
    const settingsPath =
      user?.role === "ADMIN" ? "/admin/settings" : "/settings";
    router.push(settingsPath as never);
  };

  // -------- Mobile --------
  if (isMobile) {
    return (
      <>
        <View
          className="flex-row items-center justify-between px-4 h-14 bg-white border-b"
          style={{ borderBottomColor: colors.border, borderTopWidth: 3, borderTopColor: accent.strong }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Открыть меню"
            onPress={() => setMenuOpen(true)}
            className="w-11 h-11 items-center justify-center"
          >
            <Menu size={20} color={colors.text} />
          </Pressable>

          <View className="flex-1 items-center">
            {breadcrumb ? (
              <Text
                numberOfLines={1}
                className="text-base font-semibold"
                style={{ color: colors.text }}
              >
                {breadcrumb}
              </Text>
            ) : (
              <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                P2PTax
              </Text>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Уведомления"
            onPress={() => router.push("/notifications" as never)}
            className="w-11 h-11 items-center justify-center"
          >
            <Bell size={18} color={colors.text} />
          </Pressable>
        </View>

        <MobileMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </>
    );
  }

  // -------- Desktop --------
  // iter10 Phase 3a: role accent moved to SidebarNav; header is a neutral
  // slim bar with breadcrumb + search + bell + avatar.
  return (
    <View
      className="flex-row items-center bg-white border-b"
      style={{
        borderBottomColor: colors.border,
        height: 56,
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
      }}
    >
      {breadcrumb ? (
        <Text
          numberOfLines={1}
          className="text-sm font-semibold"
          style={{ color: colors.text, maxWidth: 280 }}
        >
          {breadcrumb}
        </Text>
      ) : null}

      {/* Search — fills available space */}
      <View
        className="flex-row items-center rounded-lg px-3"
        style={{
          flex: 1,
          maxWidth: 480,
          height: 44,
          backgroundColor: gray[100],
          borderWidth: 1,
          borderColor: colors.border,
          marginLeft: breadcrumb ? spacing.md : 0,
        }}
      >
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Найти специалиста, заявку…"
          placeholderTextColor={colors.placeholder}
          returnKeyType="search"
          accessibilityLabel="Поиск"
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
            color: colors.text,
            backgroundColor: "transparent",
            ...(Platform.OS === "web" ? {
              minHeight: 44,
              alignSelf: "stretch" as never,
              outlineStyle: "none" as never,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
              paddingHorizontal: 8,
            } : {}),
          }}
        />
      </View>

      {/* Right cluster */}
      <View className="flex-row items-center" style={{ gap: spacing.sm, marginLeft: "auto" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Уведомления"
          onPress={() => router.push("/notifications" as never)}
          className="w-11 h-11 rounded-lg items-center justify-center"
        >
          <Bell size={18} color={colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Меню профиля"
          onPress={() => setDropdownOpen(true)}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: accent.soft, borderWidth: 1, borderColor: accent.strong }}
        >
          <Text className="text-sm font-bold" style={{ color: accent.strong }}>
            {initials}
          </Text>
        </Pressable>
      </View>

      {/* Avatar dropdown (modal anchored to top-right) */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть меню профиля"
          onPress={() => setDropdownOpen(false)}
          className="flex-1"
          style={{ backgroundColor: "transparent" }}
        >
          <View
            style={{
              position: "absolute",
              top: 56,
              right: spacing.lg,
              width: 260,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.sm,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            {/* Identity row */}
            <View
              className="flex-row items-center"
              style={{ padding: spacing.sm, gap: spacing.sm }}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: accent.soft }}
              >
                <Text className="text-sm font-bold" style={{ color: accent.strong }}>
                  {initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  className="text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  {displayName}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {user?.email}
                </Text>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: spacing.xs,
              }}
            />

            <View style={{ paddingHorizontal: spacing.xs }}>
              <RoleBadge role={user?.role ?? null} isSpecialist={isSpecialistUser} size="md" />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: spacing.xs,
              }}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Настройки"
              onPress={handleSettings}
              className="flex-row items-center rounded-md"
              style={{ padding: spacing.sm, gap: spacing.sm }}
            >
              <Settings size={16} color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.text }}>
                Настройки
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Профиль"
              onPress={() => {
                setDropdownOpen(false);
                router.push("/settings" as never);
              }}
              className="flex-row items-center rounded-md"
              style={{ padding: spacing.sm, gap: spacing.sm }}
            >
              <User size={16} color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.text }}>
                Профиль
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выйти"
              onPress={handleLogout}
              className="flex-row items-center rounded-md"
              style={{ padding: spacing.sm, gap: spacing.sm }}
            >
              <LogOut size={16} color={colors.danger} />
              <Text className="text-sm" style={{ color: colors.danger }}>
                Выйти
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Path-prefix gate: when the current route is public chrome (landing,
 * auth, onboarding, legal) we suppress AppHeader entirely — those
 * screens render their own hero/chrome.
 *
 * Iter11 — (tabs) is now authenticated USER space (dashboard, requests,
 * messages, public-requests, profile) and should show AppHeader like any
 * other authenticated route. The old marketplace /search and /create tabs
 * are gone; the remaining top-level routes (usePathname strips groups) map
 * cleanly onto authenticated screens.
 */

export function shouldShowAppHeader(pathname: string): boolean {
  if (!pathname) return false;
  // NOTE: "/" is NOT blocked here — Expo Router strips the "(tabs)" group prefix,
  // so /(tabs)/index (the authenticated dashboard) resolves to pathname="/".
  // The AuthenticatedHeaderGate already guards on isAuthenticated, so the
  // landing page (which has its own LandingHeader) is never reached while
  // the gate is active. Blocking "/" would hide the header on the dashboard tab.
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/legal")) return false;
  if (pathname.startsWith("/onboarding")) return false;
  return true;
}
