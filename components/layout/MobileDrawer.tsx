import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { useRouter, usePathname, useSegments } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { X, LogOut, Settings } from "lucide-react-native";
import { colors, spacing, roleAccent, type RoleAccentKey } from "@/lib/theme";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import RoleBadge from "./RoleBadge";
import {
  detectSidebarGroup,
  type SidebarGroup,
} from "./SidebarNav";
import {
  type MatchContext,
  itemsForGroup,
} from "@/lib/nav-items";

/**
 * MobileDrawer — slide-in left rail for mobile (<768px).
 *
 * Mirrors SidebarNav nav items exactly (shared via lib/nav-items.ts).
 * Opened by the burger button in AppHeader; closed by: overlay tap, X button,
 * or a nav tap.
 *
 * Implementation: React Native Animated (no 3rd-party libs), Modal for
 * overlay. Slide animation: translateX -280 → 0.
 */

const DRAWER_WIDTH = 280;

function toAccentKey(role: UserRole, isSpecialist: boolean): RoleAccentKey {
  if (role === "ADMIN") return "admin";
  if (isSpecialist) return "specialist";
  return "client";
}

// ─────────────────────────────────────────── component

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const router = useRouter()
  const nav = useTypedRouter();
  const pathname = usePathname() ?? "";
  const segments = useSegments();
  const { user, isSpecialistUser, signOut } = useAuth();

  // Slide animation — translateX: -DRAWER_WIDTH (hidden) → 0 (visible)
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: open ? 0 : -DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [open, translateX]);

  const matchCtx: MatchContext = {
    path: pathname,
    segments: segments as readonly string[],
  };

  const group = detectSidebarGroup(pathname, segments as readonly string[], user?.role ?? null);
  const accentKey = toAccentKey(user?.role ?? null, isSpecialistUser);
  const accent = roleAccent[accentKey];
  const items = itemsForGroup(group, user?.role ?? null, isSpecialistUser);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "Пользователь";
  const initials =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const handleNav = (href: string) => {
    onClose();
    nav.any(href);
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    nav.replaceRoutes.login();
  };

  const settingsPath = user?.role === "ADMIN" ? "/admin/settings" : "/settings";

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Закрыть меню"
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      />

      {/* Drawer panel */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: accent.soft,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          transform: [{ translateX }],
          // Ensure drawer sits above overlay
          zIndex: 10,
        }}
      >
        {/* Close button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть меню"
          onPress={onClose}
          style={{
            position: "absolute",
            top: spacing.md,
            right: spacing.md,
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
          }}
        >
          <X size={20} color={colors.textSecondary} />
        </Pressable>

        {/* Brand */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="P2PTax — главная"
          onPress={() => handleNav("/")}
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
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
            P2P<Text style={{ color: accent.strong }}>Tax</Text>
          </Text>
        </Pressable>

        {/* Role badge */}
        <View style={{ paddingHorizontal: spacing.sm, marginBottom: spacing.md }}>
          <RoleBadge role={user?.role ?? null} isSpecialist={isSpecialistUser} size="sm" />
        </View>

        {/* Nav items */}
        <View style={{ gap: 2, flex: 1 }}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.match(matchCtx);
            return (
              <Pressable
                key={item.href}
                accessibilityRole="link"
                accessibilityLabel={item.label}
                onPress={() => handleNav(item.href)}
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
            gap: 2,
          }}
        >
          {/* Settings row */}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Настройки"
            onPress={() => handleNav(settingsPath)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 44,
              paddingLeft: spacing.md,
              paddingRight: spacing.sm,
              borderRadius: 8,
            }}
          >
            <Settings size={16} color={colors.textSecondary} />
            <Text
              style={{
                marginLeft: spacing.sm + 4,
                fontSize: 14,
                fontWeight: "500",
                color: colors.text,
              }}
            >
              Настройки
            </Text>
          </Pressable>

          {/* Identity row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              borderRadius: 10,
              marginTop: 2,
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
          </View>

          {/* Logout */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Выйти"
            onPress={handleLogout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 44,
              paddingLeft: spacing.md,
              paddingRight: spacing.sm,
              borderRadius: 8,
            }}
          >
            <LogOut size={16} color={colors.danger} />
            <Text
              style={{
                marginLeft: spacing.sm + 4,
                fontSize: 14,
                fontWeight: "500",
                color: colors.danger,
              }}
            >
              Выйти
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
