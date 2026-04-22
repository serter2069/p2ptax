import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Menu, Bell } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import MobileMenu from "./MobileMenu";
import { colors } from "@/lib/theme";

const NAV_LINKS = [
  { label: "Специалисты", href: "/specialists" },
  { label: "Ситуации", href: "/situations" },
  { label: "Покрытие", href: "/coverage" },
  { label: "Для специалистов", href: "/for-specialists" },
];

export default function Header() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  if (isMobile) {
    return (
      <>
        <View className="flex-row items-center justify-between px-4 h-14 bg-white border-b border-slate-100">
          <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню" onPress={() => setMenuOpen(true)} className="w-11 h-11 items-center justify-center">
            <Menu size={20} color={colors.text} />
          </Pressable>

          <Text className="text-lg font-bold" style={{ color: colors.primary }}>P2PTax</Text>

          {isAuthenticated ? (
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Уведомления"
                onPress={() => router.push("/notifications" as never)}
                className="w-11 h-11 items-center justify-center"
              >
                <Bell size={18} color={colors.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Профиль"
                onPress={() => {
                  const settingsPath = user?.role === "SPECIALIST"
                    ? "/settings/specialist"
                    : "/settings/client";
                  router.push(settingsPath as never);
                }}
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <Text className="text-sm font-bold" style={{ color: colors.primary }}>{initials}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Войти"
              onPress={() => router.push("/auth/email" as never)}
              className="px-4 h-11 rounded-lg items-center justify-center"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>Войти</Text>
            </Pressable>
          )}
        </View>

        <MobileMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </>
    );
  }

  // Desktop header
  return (
    <View className="flex-row items-center justify-between px-6 h-16 bg-white border-b" style={{ borderBottomColor: colors.border }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Главная" onPress={() => router.push("/" as never)} className="h-11 items-center justify-center">
        <Text className="text-xl font-bold" style={{ color: colors.primary }}>P2PTax</Text>
      </Pressable>

      {/* Desktop nav links */}
      <View className="flex-row items-center gap-6">
        {NAV_LINKS.map((link) => (
          <Pressable
            key={link.href}
            accessibilityRole="button"
            accessibilityLabel={link.label}
            onPress={() => router.push(link.href as never)}
            className="h-11 px-2 items-center justify-center"
          >
            <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>{link.label}</Text>
          </Pressable>
        ))}
      </View>

      {isAuthenticated ? (
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Уведомления"
            onPress={() => router.push("/notifications" as never)}
            className="w-11 h-11 rounded-lg items-center justify-center active:bg-surface2"
          >
            <Bell size={18} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Профиль"
            onPress={() => {
              const settingsPath = user?.role === "SPECIALIST"
                ? "/settings/specialist"
                : "/settings/client";
              router.push(settingsPath as never);
            }}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.primary }}>{initials}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Войти"
            onPress={() => router.push("/auth/email" as never)}
            className="px-5 h-11 rounded-lg items-center justify-center"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>Войти</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать заявку"
            onPress={() => router.push("/requests/new" as never)}
            className="px-5 h-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-semibold text-white">Создать заявку</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
