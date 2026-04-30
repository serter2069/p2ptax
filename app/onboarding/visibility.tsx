import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useSegments } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import { colors, textStyle, overlay } from "@/lib/theme";

/** AsyncStorage key for specialist public-profile preference. */
export const ONBOARDING_VISIBILITY_KEY = "onboarding_is_public_profile";

export default function OnboardingVisibilityScreen() {
  const router = useRouter();
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ from?: string; role?: string }>();
  const fromSettings = params.from === "settings";
  const role =
    typeof params.role === "string"
      ? params.role
      : Array.isArray(params.role)
        ? params.role[0]
        : undefined;
  const isSpecialistIntent = role === "specialist";
  const { ready, user } = useRequireAuth();
  const { isSpecialistUser, isAdminUser } = useAuth();
  const segments = useSegments() as string[];
  const isOnThisScreen =
    segments[0] === "onboarding" && segments[1] === "visibility";

  // Default: public profile
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!ready || !isOnThisScreen) return;
    if (isAdminUser) {
      nav.replaceRoutes.adminDashboard();
      return;
    }
    if (!isSpecialistUser && !isSpecialistIntent) {
      nav.replaceRoutes.tabs();
      return;
    }
    if (!fromSettings && user?.specialistProfileCompletedAt) {
      nav.replaceRoutes.tabs();
    }
  }, [
    ready,
    isOnThisScreen,
    isAdminUser,
    isSpecialistUser,
    isSpecialistIntent,
    user,
    fromSettings,
    nav,
  ]);

  const handleNext = async () => {
    // Persist choice so profile screen can read it
    await AsyncStorage.setItem(
      ONBOARDING_VISIBILITY_KEY,
      isPublic ? "true" : "false"
    );
    nav.replaceAny({
      pathname: "/onboarding/work-area",
      params: { role: "specialist" },
    });
  };

  if (
    !ready ||
    isAdminUser ||
    (!isSpecialistUser && !isSpecialistIntent)
  ) {
    return (
      <OnboardingShell
        step={1}
        title="Публичный профиль?"
        subtitle="Выберите, будет ли ваш профиль виден всем пользователям платформы."
        loading
        onBack={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={() => router.back()}
          className="flex-row items-center"
          style={{ minHeight: 44 }}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text className="text-text-base ml-1">Назад</Text>
        </Pressable>
      </View>

      <View className="px-6 pb-4">
        <OnboardingProgress step={1} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}>
          <Text
            style={{
              ...textStyle.h1,
              color: colors.text,
              fontSize: 32,
              lineHeight: 38,
              marginTop: 16,
              marginBottom: 12,
            }}
          >
            Видимость профиля
          </Text>
          <Text
            style={{
              ...textStyle.body,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 32,
            }}
          >
            Выберите, как клиенты будут вас находить. Изменить можно в любой момент.
          </Text>

          {/* Public option */}
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Публичный профиль"
            accessibilityState={{ checked: isPublic }}
            onPress={() => setIsPublic(true)}
            style={{
              borderWidth: 2,
              borderColor: isPublic ? colors.accent : colors.border,
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              backgroundColor: isPublic ? overlay.accent10 : colors.surface,
            }}
          >
            <View className="flex-row items-center mb-2" style={{ gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isPublic ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Eye size={20} color={colors.surface} />
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Публичный профиль
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: isPublic ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isPublic ? colors.accent : colors.surface,
                }}
              >
                {isPublic && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.surface,
                    }}
                  />
                )}
              </View>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Ваша карточка отображается в каталоге специалистов. Клиенты могут
              найти вас по городу и услугам, написать и оставить отзыв.
            </Text>
          </Pressable>

          {/* Private option */}
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Приватный профиль"
            accessibilityState={{ checked: !isPublic }}
            onPress={() => setIsPublic(false)}
            style={{
              borderWidth: 2,
              borderColor: !isPublic ? colors.accent : colors.border,
              borderRadius: 16,
              padding: 20,
              marginBottom: 32,
              backgroundColor: !isPublic ? overlay.accent10 : colors.surface,
            }}
          >
            <View className="flex-row items-center mb-2" style={{ gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: !isPublic ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EyeOff size={20} color={colors.surface} />
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Приватный профиль
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: !isPublic ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: !isPublic ? colors.accent : colors.surface,
                }}
              >
                {!isPublic && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.surface,
                    }}
                  />
                )}
              </View>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Профиль скрыт из каталога. Вы можете работать на платформе, но
              клиенты не найдут вас самостоятельно.
            </Text>
          </Pressable>

          <Button label="Далее" onPress={handleNext} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
