import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import HeaderBack from "@/components/HeaderBack";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function OnboardingNameScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const firstNameValid = firstName.trim().length >= 2 && firstName.trim().length <= 50;
  const lastNameValid = lastName.trim().length >= 2 && lastName.trim().length <= 50;
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
        body: { firstName: firstName.trim(), lastName: lastName.trim() },
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
        <View className="flex-1" style={{ paddingTop: "10%" }}>
          <Text className="text-sm text-amber-700 text-center mb-2">
            Шаг 1 из 3
          </Text>
          <Text className="text-2xl font-bold text-slate-900 text-center mb-6">
            Ваше имя
          </Text>

          <Text className="text-sm text-slate-500 mb-1">Имя</Text>
          <TextInput
            accessibilityLabel="Имя"
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: firstName.length > 0 && !firstNameValid ? "#dc2626" : "#e2e8f0",
              paddingHorizontal: 16,
              fontSize: 16,
              color: "#0f172a",
              marginBottom: 4,
            }}
            placeholder="Иван"
            placeholderTextColor="#94a3b8"
            value={firstName}
            onChangeText={setFirstName}
            editable={!isLoading}
            autoCapitalize="words"
          />
          {firstName.length > 0 && !firstNameValid ? (
            <Text className="text-xs text-red-600 mb-3">От 2 до 50 символов</Text>
          ) : (
            <View className="mb-3" />
          )}

          <Text className="text-sm text-slate-500 mb-1">Фамилия</Text>
          <TextInput
            accessibilityLabel="Фамилия"
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: lastName.length > 0 && !lastNameValid ? "#dc2626" : "#e2e8f0",
              paddingHorizontal: 16,
              fontSize: 16,
              color: "#0f172a",
              marginBottom: 4,
            }}
            placeholder="Петров"
            placeholderTextColor="#94a3b8"
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading}
            autoCapitalize="words"
          />
          {lastName.length > 0 && !lastNameValid ? (
            <Text className="text-xs text-red-600 mb-4">От 2 до 50 символов</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Terms checkbox */}
          <Pressable
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
              Принимаю{" "}
              <Text
                className="text-blue-900 underline"
                onPress={() => router.push("/legal/terms" as never)}
              >
                условия использования
              </Text>
            </Text>
          </Pressable>

          {error ? (
            <Text className="text-xs text-red-600 text-center mb-4">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="Далее"
            onPress={handleNext}
            disabled={!canProceed || isLoading}
            className={`h-12 rounded-xl items-center justify-center ${
              !canProceed || isLoading
                ? "bg-blue-900 opacity-50"
                : "bg-blue-900 active:bg-slate-900"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">Далее</Text>
            )}
          </Pressable>
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
