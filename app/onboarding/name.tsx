import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useEffect } from "react";
import HeaderBack from "@/components/HeaderBack";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { api } from "@/lib/api";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { colors, textStyle } from "@/lib/theme";

export default function OnboardingNameScreen() {
  const router = useRouter()
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
  const { updateUser, isSpecialistUser, isAdminUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");

  useEffect(() => {
    if (!ready) return;
    if (isAdminUser) {
      nav.replaceRoutes.adminDashboard();
      return;
    }
    // Wave 1/B — landing CTA "Я специалист" routes here with ?role=specialist
    // even when isSpecialist is still false. Allow the screen to render so
    // the user can fill name first; work-area then flips isSpecialist via
    // /api/user/become-specialist.
    if (!isSpecialistUser && !isSpecialistIntent) {
      nav.replaceRoutes.tabs();
      return;
    }
    if (!fromSettings && user?.specialistProfileCompletedAt) {
      nav.replaceRoutes.tabs();
    }
  }, [ready, isAdminUser, isSpecialistUser, isSpecialistIntent, user, fromSettings]);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const firstNameTrimmed = firstName.trim();
  const lastNameTrimmed = lastName.trim();
  const firstNameError =
    firstNameTrimmed.length > 0 && firstNameTrimmed.length < 2
      ? "Минимум 2 символа"
      : firstNameTrimmed.length > 50
        ? "Максимум 50 символов"
        : "";
  const lastNameError =
    lastNameTrimmed.length > 0 && lastNameTrimmed.length < 2
      ? "Минимум 2 символа"
      : lastNameTrimmed.length > 50
        ? "Максимум 50 символов"
        : "";
  const firstNameValid =
    firstNameTrimmed.length >= 2 && firstNameTrimmed.length <= 50;
  const lastNameValid =
    lastNameTrimmed.length >= 2 && lastNameTrimmed.length <= 50;
  const canProceed = firstNameValid && lastNameValid && agreed;

  const handleNext = async () => {
    if (!canProceed || isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const data = await api<{
        user: {
          id: string;
          email: string;
          role: string;
          firstName: string;
          lastName: string;
        };
      }>("/api/onboarding/name", {
        method: "PUT",
        body: { firstName: firstNameTrimmed, lastName: lastNameTrimmed },
      });

      // Iter11 — role stays USER; specialist mode is toggled by /set-role
      // (which set `isSpecialist=true` already) and finalised by
      // /onboarding/profile setting specialistProfileCompletedAt.
      updateUser({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
      });

      if (isSpecialistIntent) {
        nav.replaceAny({
          pathname: "/onboarding/work-area",
          params: { role: "specialist" },
        });
      } else {
        nav.routes.onboardingWorkArea();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || isAdminUser || (!isSpecialistUser && !isSpecialistIntent)) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title="" />

      <View className="px-6 pb-4">
        <OnboardingProgress step={1} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
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
            Как вас зовут?
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
            Это имя увидят клиенты в карточке специалиста и в переписке. Пишите
            реальное — доверие выше.
          </Text>

          <View className="mb-4">
            <Input
              label="Имя"
              placeholder="Иван"
              value={firstName}
              onChangeText={setFirstName}
              error={firstNameError}
              editable={!isLoading}
              autoCapitalize="words"
              containerStyle={{ height: 56 }}
            />
          </View>

          <View className="mb-6">
            <Input
              label="Фамилия"
              placeholder="Петров"
              value={lastName}
              onChangeText={setLastName}
              error={lastNameError}
              editable={!isLoading}
              autoCapitalize="words"
              containerStyle={{ height: 56 }}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Принять условия использования"
            onPress={() => setAgreed(!agreed)}
            className="flex-row items-center mb-6"
            style={{ minHeight: 44 }}
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center ${
                agreed ? "bg-accent border-accent" : "border-border bg-white"
              }`}
            >
              {agreed && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
            <View className="flex-1 ml-3 flex-row flex-wrap">
              <Text className="text-xs text-text-mute leading-5">
                Я принимаю{" "}
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Условия использования"
                onPress={() => nav.routes.legalTerms()}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text className="text-accent font-medium underline text-xs leading-5">
                  Условия использования
                </Text>
              </Pressable>
            </View>
          </Pressable>

          {error ? (
            <View
              className="mb-4 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.errorBg,
                borderWidth: 1,
                borderColor: colors.danger,
              }}
            >
              <Text className="text-sm text-danger leading-5">{error}</Text>
            </View>
          ) : null}

          <Button
            label="Далее"
            onPress={handleNext}
            disabled={!canProceed || isLoading}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
