import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function EmailScreen() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = email.trim().length > 0 && agreed;

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError(data.error || "Something went wrong");
        return;
      }

      router.push({ pathname: "/(auth)/otp", params: { email: trimmedEmail } });
    } catch {
      // Backend unavailable — in dev mode, allow proceeding anyway
      if (__DEV__) {
        console.warn("[DEV] Backend unavailable, proceeding without OTP request");
        router.push({ pathname: "/(auth)/otp", params: { email: trimmedEmail } });
      } else {
        setError("Could not connect to server. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome</Text>
        <Text className="text-base text-gray-500 mb-8">
          Enter your email to continue
        </Text>

        <TextInput
          className="h-14 rounded-xl bg-gray-100 px-4 text-base text-gray-900"
          placeholder="your@email.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleContinue}
        />

        {error && (
          <Text className="text-sm text-red-500 mt-2">{error}</Text>
        )}

        {/* Privacy checkbox */}
        <Pressable
          onPress={() => setAgreed(!agreed)}
          className="flex-row items-start mt-4"
        >
          <View
            className={`w-5 h-5 rounded border mt-0.5 items-center justify-center ${
              agreed ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
            }`}
          >
            {agreed && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="flex-1 ml-3 text-sm text-gray-600 leading-5">
            I agree to the{" "}
            <Text
              className="text-blue-600 underline"
              onPress={() => router.push("/legal/privacy" as never)}
            >
              Privacy Policy
            </Text>
            {" "}and{" "}
            <Text
              className="text-blue-600 underline"
              onPress={() => router.push("/legal/terms" as never)}
            >
              Terms of Service
            </Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          disabled={!isValid || loading}
          className={`mt-6 h-14 rounded-xl items-center justify-center ${
            isValid && !loading ? "bg-blue-600 active:bg-blue-700" : "bg-gray-200"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              className={`text-base font-semibold ${isValid ? "text-white" : "text-gray-400"}`}
            >
              Continue
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
