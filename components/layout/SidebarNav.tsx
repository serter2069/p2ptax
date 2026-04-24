import { View, Text, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  LayoutGrid,
  FileText,
  MessageCircle,
  List,
  Rocket,
  BarChart2,
  Users,
  Shield,
  Flag,
  Home,
  Search,
  PlusSquare,
  User,
  Settings,
  Bell,
  type LucideIcon,
} from "lucide-react-native";
import { colors, spacing, typography } from "@/lib/theme";
import { useAuth } from "@/contexts/AuthContext";

export type SidebarGroup =
  | "client"
  | "specialist"
  | "admin"
  | "main"
  | null;

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

const CLIENT_ITEMS: NavItem[] = [
  {
    label: "Обзор",
    href: "/(client-tabs)/dashboard",
    icon: LayoutGrid,
    match: (p) => p === "/dashboard" || p.endsWith("/client-tabs/dashboard") || p === "/(client-tabs)/dashboard",
  },
  {
    label: "Мои заявки",
    href: "/(client-tabs)/requests",
    icon: FileText,
    match: (p) => p.includes("/client-tabs/requests") || p === "/(client-tabs)/requests",
  },
  {
    label: "Сообщения",
    href: "/(client-tabs)/messages",
    icon: MessageCircle,
    match: (p) => p.includes("/client-tabs/messages") || p === "/(client-tabs)/messages",
  },
];

const SPECIALIST_ITEMS: NavItem[] = [
  {
    label: "Дашборд",
    href: "/(specialist-tabs)/dashboard",
    icon: LayoutGrid,
    match: (p) => p.includes("/specialist-tabs/dashboard"),
  },
  {
    label: "Заявки",
    href: "/(specialist-tabs)/requests",
    icon: List,
    match: (p) => p.includes("/specialist-tabs/requests"),
  },
  {
    label: "Переписки",
    href: "/(specialist-tabs)/threads",
    icon: MessageCircle,
    match: (p) => p.includes("/specialist-tabs/threads"),
  },
  {
    label: "Продвижение",
    href: "/(specialist-tabs)/promotion",
    icon: Rocket,
    match: (p) => p.includes("/specialist-tabs/promotion"),
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/(admin-tabs)/dashboard",
    icon: BarChart2,
    match: (p) => p.includes("/admin-tabs/dashboard"),
  },
  {
    label: "Пользователи",
    href: "/(admin-tabs)/users",
    icon: Users,
    match: (p) => p.includes("/admin-tabs/users"),
  },
  {
    label: "Модерация",
    href: "/(admin-tabs)/moderation",
    icon: Shield,
    match: (p) => p.includes("/admin-tabs/moderation"),
  },
  {
    label: "Жалобы",
    href: "/(admin-tabs)/complaints",
    icon: Flag,
    match: (p) => p.includes("/admin-tabs/complaints"),
  },
];

const MAIN_ITEMS: NavItem[] = [
  {
    label: "Главная",
    href: "/(tabs)",
    icon: Home,
    match: (p) => p === "/" || p === "/(tabs)" || p.endsWith("/tabs/index") || p === "/(tabs)/index",
  },
  {
    label: "Поиск",
    href: "/(tabs)/search",
    icon: Search,
    match: (p) => p.includes("/tabs/search"),
  },
  {
    label: "Создать",
    href: "/(tabs)/create",
    icon: PlusSquare,
    match: (p) => p.includes("/tabs/create"),
  },
  {
    label: "Сообщения",
    href: "/(tabs)/messages",
    icon: MessageCircle,
    match: (p) => p.includes("/tabs/messages") && !p.includes("client-tabs") && !p.includes("specialist-tabs"),
  },
  {
    label: "Профиль",
    href: "/(tabs)/profile",
    icon: User,
    match: (p) => p.includes("/tabs/profile"),
  },
];

/**
 * Classify current Expo-Router pathname to a tab group. Returns null when the
 * current screen is outside any role-based group (auth, onboarding, landing, ...).
 */
export function detectSidebarGroup(pathname: string): SidebarGroup {
  if (!pathname) return null;
  if (pathname.includes("(client-tabs)") || pathname.includes("/client-tabs/")) return "client";
  if (pathname.includes("(specialist-tabs)") || pathname.includes("/specialist-tabs/")) return "specialist";
  if (pathname.includes("(admin-tabs)") || pathname.includes("/admin-tabs/")) return "admin";
  // Generic "tabs" group — but only when we're actually inside it. We rely on
  // the path literal to disambiguate (landing "/" is NOT in the tabs group).
  if (pathname.includes("(tabs)") || pathname.includes("/tabs/")) return "main";
  return null;
}

function itemsForGroup(group: SidebarGroup): NavItem[] {
  switch (group) {
    case "client":
      return CLIENT_ITEMS;
    case "specialist":
      return SPECIALIST_ITEMS;
    case "admin":
      return ADMIN_ITEMS;
    case "main":
      return MAIN_ITEMS;
    default:
      return [];
  }
}

const SIDEBAR_WIDTH = 240;

interface SidebarNavProps {
  group: SidebarGroup;
}

export default function SidebarNav({ group }: SidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { user } = useAuth();

  const items = itemsForGroup(group);
  if (items.length === 0) return null;

  const settingsPath =
    group === "admin"
      ? "/admin/settings"
      : user?.role === "SPECIALIST"
      ? "/settings/specialist"
      : "/settings/client";

  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        paddingRight: spacing.lg,
      }}
    >
      {/* Brand mark */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="P2PTax — главная"
        onPress={() => router.push("/" as never)}
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
      </Pressable>

      {/* Primary nav */}
      <View style={{ gap: 4 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Pressable
              key={item.href}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              onPress={() => router.push(item.href as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: 8,
                backgroundColor: active ? colors.accentSoft : "transparent",
                minHeight: 40,
              }}
            >
              <Icon
                size={18}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text
                style={{
                  marginLeft: spacing.md,
                  color: active ? colors.primary : colors.text,
                  fontSize: 14,
                  fontWeight: active ? "600" : "500",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Divider + utility links */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginVertical: spacing.lg,
        }}
      />

      <View style={{ gap: 4 }}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Уведомления"
          onPress={() => router.push("/notifications" as never)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: 8,
            minHeight: 40,
          }}
        >
          <Bell size={18} color={colors.textSecondary} />
          <Text
            style={{
              marginLeft: spacing.md,
              color: colors.text,
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            Уведомления
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Настройки"
          onPress={() => router.push(settingsPath as never)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: 8,
            minHeight: 40,
          }}
        >
          <Settings size={18} color={colors.textSecondary} />
          <Text
            style={{
              marginLeft: spacing.md,
              color: colors.text,
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            Настройки
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export { SIDEBAR_WIDTH };
