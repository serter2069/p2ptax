import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ResponsiveContainer from "@/components/ResponsiveContainer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthEmailScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Already authenticated — redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "CLIENT") {
        router.replace("/(client-tabs)/dashboard" as never);
      } else if (user.role === "SPECIALIST") {
        router.replace("/(specialist-tabs)/dashboard" as never);
      } else if (user.role === "ADMIN") {
        router.replace("/(admin-tabs)/dashboard" as never);
      }
    }
  }, [isAuthenticated, user, router]);

  const handleContinue = async () => {
    setError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Некорректный email");
      return;
    }

    setIsLoading(true);
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
        noAuth: true,
      });
      router.push({
        pathname: "/auth/otp" as never,
        params: { email: email.trim().toLowerCase() },
      } as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ResponsiveContainer maxWidth={520}>
        <View className="flex-1 justify-center px-6" style={{ paddingBottom: "10%" }}>
          {/* Logo */}
          <View className="self-center items-center justify-center bg-accent-soft rounded-2xl mb-6"
            style={{ width: 64, height: 64 }}
          >
            <Text className="text-xl font-extrabold text-accent">P2P</Text>
          </View>

          <Text className="text-2xl font-extrabold text-text-base text-center mb-2">
            Вход
          </Text>
          <Text className="text-base text-text-mute text-center mb-8" style={{ lineHeight: 24 }}>
            Введите email для продолжения
          </Text>

          <Input
            accessibilityLabel="Email адрес"
            placeholder="your@email.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) setError("");
            }}
            error={error}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            onSubmitEditing={handleContinue}
          />

          <View className="mt-4">
            <Button
              label="Продолжить"
              onPress={handleContinue}
              disabled={isLoading || !email.trim()}
              loading={isLoading}
              testID="send-otp"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Условия использования"
            onPress={() => router.push("/legal/terms" as never)}
            className="mt-4 py-3"
          >
            <Text className="text-sm text-text-mute text-center underline">
              Условия использования
            </Text>
          </Pressable>
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
