import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import HeaderBack from "@/components/HeaderBack";
import { api } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Invalid email");
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
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Sign In" />
      <View className="flex-1 px-8" style={{ paddingTop: "13%" }}>
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-2xl bg-blue-900 items-center justify-center mb-4">
            <Text className="text-2xl font-bold text-white">P2P</Text>
          </View>
        </View>

        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
          Sign In
        </Text>
        <Text className="text-sm text-slate-400 text-center mb-6">
          Enter your email to continue
        </Text>

        <TextInput
          style={{
            height: 48,
            borderRadius: 12,
            backgroundColor: error ? "#fef2f2" : "#f8fafc",
            borderWidth: error ? 1 : 1,
            borderColor: error ? "#dc2626" : "#e2e8f0",
            paddingHorizontal: 16,
            fontSize: 16,
            color: "#0f172a",
          }}
          placeholder="your@email.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) setError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />
        {error ? (
          <Text className="text-xs text-red-600 mt-1">{error}</Text>
        ) : null}

        <Pressable
          onPress={handleContinue}
          disabled={isLoading || !email.trim()}
          className={`h-12 rounded-xl items-center justify-center mt-6 ${
            isLoading || !email.trim() ? "bg-blue-900 opacity-50" : "bg-blue-900 active:bg-slate-900"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-base font-semibold">Continue</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/legal/terms" as never)}
          className="mt-4"
        >
          <Text className="text-sm text-slate-400 text-center">Terms of Use</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
