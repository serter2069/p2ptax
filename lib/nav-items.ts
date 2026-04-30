/**
 * nav-items.ts — single source of truth for sidebar/drawer navigation.
 *
 * Both SidebarNav and MobileDrawer import from here. No duplication.
 */

import {
  LayoutGrid,
  FileText,
  MessageCircle,
  BarChart2,
  Users,
  Shield,
  Flag,
  Settings,
  Inbox,
  Bookmark,
  type LucideIcon,
} from "lucide-react-native";
import type { SidebarGroup } from "@/components/layout/SidebarNav";
import type { UserRole } from "@/contexts/AuthContext";

// ─────────────────────────────────────────── types

export interface MatchContext {
  /** Browser path (groups stripped), e.g. `/dashboard` for `/(tabs)/dashboard`. */
  path: string;
  /** Raw Expo-Router segments including groups, e.g. `["(tabs)", "dashboard"]`. */
  segments: readonly string[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (ctx: MatchContext) => boolean;
}

// ─────────────────────────────────────────── match helpers

/**
 * usePathname() strips group-parens, so `/(tabs)/dashboard` reports as
 * `/dashboard`. We use segments to know which group the user is in — that
 * disambiguates colliding paths like `/requests` that exist both as
 * `/(tabs)/requests.tsx` and `/requests/index.tsx`.
 */
export const groupMatch = (
  ctx: MatchContext,
  group: "(tabs)" | "(admin-tabs)",
  leaf: string
): boolean => {
  if (ctx.segments[0] === group && ctx.segments[1] === leaf) return true;
  // Safety net when segments are empty (route transitions).
  return (
    ctx.path.includes(`${group}/${leaf}`) ||
    ctx.path.includes(`${group.replace(/[()]/g, "")}/${leaf}`)
  );
};

export const topLevelMatch = (ctx: MatchContext, prefix: string): boolean => {
  // Active for `/prefix` or `/prefix/*` only when NOT inside a role-tab group
  // (e.g. client's `/requests` screen shares URL with public `/requests`).
  const first = ctx.segments[0] ?? "";
  const inGroup = first.startsWith("(") && first.endsWith(")") && first !== "(tabs)";
  if (inGroup) return false;
  return ctx.path === prefix || ctx.path.startsWith(`${prefix}/`);
};

// ─────────────────────────────────────────── nav item arrays

// Iter11 — unified USER nav (client-like items always present).
export const USER_BASE_ITEMS: NavItem[] = [
  {
    label: "Дашборд",
    href: "/(tabs)",
    icon: LayoutGrid,
    match: (ctx) =>
      groupMatch(ctx, "(tabs)", "index") ||
      (ctx.segments[0] === "(tabs)" && !ctx.segments[1]),
  },
  {
    label: "Мои заявки",
    href: "/(tabs)/requests",
    icon: FileText,
    match: (ctx) => groupMatch(ctx, "(tabs)", "requests"),
  },
  {
    label: "Сообщения",
    href: "/(tabs)/messages",
    icon: MessageCircle,
    match: (ctx) => groupMatch(ctx, "(tabs)", "messages"),
  },
];

// Client-only addition: injected after "Мои заявки" for non-specialist users.
export const USER_CLIENT_EXTRA: NavItem[] = [
  {
    label: "Специалисты",
    href: "/specialists",
    icon: Users,
    match: (ctx) => topLevelMatch(ctx, "/specialists"),
  },
  {
    label: "Избранные",
    href: "/saved-specialists",
    icon: Bookmark,
    match: (ctx) => topLevelMatch(ctx, "/saved-specialists"),
  },
];

// Specialist-only addition: appended to USER_BASE when isSpecialist=true.
export const USER_SPECIALIST_EXTRA: NavItem[] = [
  {
    label: "Открытые заявки",
    href: "/(tabs)/public-requests",
    icon: Inbox,
    // Only match the public-requests tab — do NOT match "/requests" which is
    // "Мои заявки" (the client-side tab). Previously this had an erroneous
    // topLevelMatch("/requests") that highlighted the wrong item.
    match: (ctx) => groupMatch(ctx, "(tabs)", "public-requests"),
  },
];

export const USER_TAIL_ITEMS: NavItem[] = [];

export const ADMIN_ITEMS: NavItem[] = [
  {
    label: "Дашборд",
    href: "/(admin-tabs)/dashboard",
    icon: BarChart2,
    match: (ctx) => groupMatch(ctx, "(admin-tabs)", "dashboard"),
  },
  {
    label: "Пользователи",
    href: "/(admin-tabs)/users",
    icon: Users,
    match: (ctx) => groupMatch(ctx, "(admin-tabs)", "users"),
  },
  {
    label: "Модерация",
    href: "/(admin-tabs)/moderation",
    icon: Shield,
    match: (ctx) => groupMatch(ctx, "(admin-tabs)", "moderation"),
  },
  {
    label: "Жалобы",
    href: "/(admin-tabs)/complaints",
    icon: Flag,
    match: (ctx) => groupMatch(ctx, "(admin-tabs)", "complaints"),
  },
  {
    label: "Настройки системы",
    href: "/admin/settings",
    icon: Settings,
    match: (ctx) => ctx.path.startsWith("/admin/settings"),
  },
];

// ─────────────────────────────────────────── build helpers

export function buildUserItems(isSpecialist: boolean): NavItem[] {
  return isSpecialist
    ? [...USER_BASE_ITEMS, ...USER_SPECIALIST_EXTRA, ...USER_TAIL_ITEMS]
    : [...USER_BASE_ITEMS, ...USER_CLIENT_EXTRA, ...USER_TAIL_ITEMS];
}

export function itemsForGroup(
  group: SidebarGroup,
  role: UserRole,
  isSpecialist: boolean
): NavItem[] {
  if (group === "admin" || role === "ADMIN") return ADMIN_ITEMS;
  switch (group) {
    case "user":
    case "main":
      return buildUserItems(isSpecialist);
    default:
      return [];
  }
}
