import { View, Text, Pressable, Image } from "react-native";
import { colors, overlay } from "@/lib/theme";

interface LandingHeaderProps {
  isDesktop: boolean;
  onHome: () => void;
  onCatalog: () => void;
  onLogin: () => void;
  onCreateRequest: () => void;
  transparent?: boolean;
  onFindSpecialist?: () => void;
  isAuthenticated?: boolean;
  onOpenDashboard?: () => void;
}

/**
 * Lightweight public header for the landing screen only. The app's
 * authenticated {@link AppHeader} never renders here because landing is
 * the pre-auth surface.
 */
export default function LandingHeader({
  isDesktop,
  onHome,
  onCatalog,
  onLogin,
  onCreateRequest,
  transparent = true,
  onFindSpecialist,
  isAuthenticated = false,
  onOpenDashboard,
}: LandingHeaderProps) {
  return (
    <View
      className="w-full"
      style={{
        backgroundColor: transparent ? overlay.white85 : colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        className="flex-row items-center"
        style={{
          height: 64,
          width: "100%",
          maxWidth: 1280,
          marginHorizontal: "auto",
          paddingHorizontal: isDesktop ? 32 : 16,
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="P2PTax — главная"
          onPress={onHome}
          className="flex-row items-center"
        >
          <Image
            source={require("@/assets/images/logo.png")}
            resizeMode="contain"
            style={{ height: 32, width: 110 }}
            accessibilityLabel="P2PTax"
          />
        </Pressable>

        <View className="flex-row items-center" style={{ gap: isDesktop ? 8 : 4 }}>
          {isDesktop ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Каталог специалистов"
              onPress={onCatalog}
              className="min-h-[44px] items-center justify-center px-3"
            >
              <Text className="font-medium" style={{ color: colors.textSecondary, fontSize: 14 }}>
                Специалисты
              </Text>
            </Pressable>
          ) : (onFindSpecialist ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Найти специалиста"
              onPress={onFindSpecialist}
              className="min-h-[44px] items-center justify-center px-2"
            >
              <Text className="font-medium" style={{ color: colors.primary, fontSize: 14 }}>
                Найти специалиста
              </Text>
            </Pressable>
          ) : null)}
          {isAuthenticated ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Перейти в личный кабинет"
              onPress={onOpenDashboard ?? onLogin}
              className="min-h-[44px] items-center justify-center px-3"
            >
              <Text className="font-medium" style={{ color: colors.text, fontSize: 14 }}>
                Личный кабинет
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Войти"
              onPress={onLogin}
              className="min-h-[44px] items-center justify-center px-3"
            >
              <Text className="font-medium" style={{ color: colors.textSecondary, fontSize: 14 }}>
                Войти
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать запрос"
            onPress={onCreateRequest}
            className="rounded-xl items-center justify-center"
            style={{
              height: 44,
              paddingHorizontal: isDesktop ? 18 : 14,
              backgroundColor: colors.primary,
            }}
          >
            <Text className="text-white font-semibold" style={{ fontSize: 14 }}>
              Создать запрос
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
