import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import HeaderBack from "@/components/HeaderBack";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function OnboardingNameScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const firstNameTrimmed = firstName.trim();
  const lastNameTrimmed = lastName.trim();
  const firstNameError = firstNameTrimmed.length > 0 && firstNameTrimmed.length < 2
    ? "Минимум 2 символа"
    : firstNameTrimmed.length > 50
      ? "Максимум 50 символов"
      : "";
  const lastNameError = lastNameTrimmed.length > 0 && lastNameTrimmed.length < 2
    ? "Минимум 2 символа"
    : lastNameTrimmed.length > 50
      ? "Максимум 50 символов"
      : "";
  const firstNameValid = firstNameTrimmed.length >= 2 && firstNameTrimmed.length <= 50;
  const lastNameValid = lastNameTrimmed.length >= 2 && lastNameTrimmed.length <= 50;
  const canProceed = firstNameValid && lastNameValid && agreed;

  const handleNext = async () => {
    if (!canProceed || isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const data = await api<{
        user: { id: string; email: string; role: string; firstName: string; lastName: string };
      }>("/api/onboarding/name", {
        method: "PUT",
        body: { firstName: firstNameTrimmed, lastName: lastNameTrimmed },
      });

      updateUser({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: "SPECIALIST",
      });

      router.push("/onboarding/work-area" as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="" />
      <ResponsiveContainer>
        <View className="flex-1 pt-10">
          <Text className="text-sm text-amber-700 text-center mb-2">
            Шаг 1 из 3
          </Text>
          <Text className="text-2xl font-bold text-slate-900 text-center mb-6">
            Ваше имя
          </Text>

          <View className="mb-3">
            <Input
              label="Имя"
              placeholder="Иван"
              value={firstName}
              onChangeText={setFirstName}
              error={firstNameError}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>

          <View className="mb-4">
            <Input
              label="Фамилия"
              placeholder="Петров"
              value={lastName}
              onChangeText={setLastName}
              error={lastNameError}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>

          {/* Terms checkbox */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Принять условия использования"
            onPress={() => setAgreed(!agreed)}
            className="flex-row items-start mb-6"
          >
            <View
              className={`w-5 h-5 rounded border mt-0.5 items-center justify-center ${
                agreed
                  ? "bg-blue-900 border-blue-900"
                  : "border-slate-300 bg-white"
              }`}
            >
              {agreed && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
            <Text className="flex-1 ml-3 text-sm text-slate-500 leading-5">
              Я принимаю{" "}
              <Text
                className="text-blue-900 underline"
                onPress={() => router.push("/legal/terms" as never)}
              >
                Условия использования
              </Text>
            </Text>
          </Pressable>

          {error ? (
            <Text className="text-xs text-red-600 text-center mb-4">
              {error}
            </Text>
          ) : null}

          <Button
            label="Далее"
            onPress={handleNext}
            disabled={!canProceed || isLoading}
            loading={isLoading}
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
