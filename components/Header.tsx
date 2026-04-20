import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import MobileMenu from "./MobileMenu";
import { colors } from "@/lib/theme";

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
            <FontAwesome name="bars" size={20} color={colors.text} />
          </Pressable>

          <Text className="text-lg font-bold text-blue-900">P2PTax</Text>

          {isAuthenticated ? (
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Уведомления"
                onPress={() => router.push("/notifications" as never)}
                className="w-11 h-11 items-center justify-center"
              >
                <FontAwesome name="bell-o" size={18} color={colors.text} />
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
                className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center"
              >
                <Text className="text-sm font-bold text-blue-900">{initials}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Войти"
              onPress={() => router.push("/auth/email" as never)}
              className="px-4 h-11 rounded-lg bg-blue-900 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-white">Sign In</Text>
            </Pressable>
          )}
        </View>

        <MobileMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </>
    );
  }

  // Desktop header
  return (
    <View className="flex-row items-center justify-between px-6 h-16 bg-white border-b border-slate-100">
      <Pressable accessibilityRole="button" accessibilityLabel="Главная" onPress={() => router.push("/" as never)}>
        <Text className="text-xl font-bold text-blue-900">P2PTax</Text>
      </Pressable>

      {isAuthenticated ? (
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Уведомления"
            onPress={() => router.push("/notifications" as never)}
            className="w-11 h-11 rounded-lg items-center justify-center active:bg-slate-100"
          >
            <FontAwesome name="bell-o" size={18} color={colors.text} />
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
            className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center"
          >
            <Text className="text-sm font-bold text-blue-900">{initials}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Войти"
          onPress={() => router.push("/auth/email" as never)}
          className="px-5 h-11 rounded-lg bg-blue-900 items-center justify-center active:bg-slate-900"
        >
          <Text className="text-sm font-semibold text-white">Sign In</Text>
        </Pressable>
      )}
    </View>
  );
}
