import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect, useCallback } from "react";
import HeaderBack from "@/components/HeaderBack";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const CODE_LENGTH = 6;

export default function AuthOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signIn } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length !== CODE_LENGTH) return;
      setIsLoading(true);
      setError("");

      try {
        const data = await api<{
          accessToken: string;
          refreshToken: string;
          user: UserData;
        }>("/api/auth/verify-otp", {
          method: "POST",
          body: { email, code },
          noAuth: true,
        });

        await signIn(data.accessToken, data.refreshToken, data.user);

        // Route based on role
        if (!data.user.role) {
          // New user, no role yet
          router.replace("/auth/email" as never);
          return;
        }

        switch (data.user.role) {
          case "CLIENT":
            router.replace("/(client-tabs)/dashboard" as never);
            break;
          case "SPECIALIST":
            router.replace("/(specialist-tabs)/dashboard" as never);
            break;
          case "ADMIN":
            router.replace("/(admin-tabs)/dashboard" as never);
            break;
          default:
            router.replace("/(client-tabs)/dashboard" as never);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Wrong code";
        setError(msg);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [email, router, signIn]
  );

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on last digit
    if (value && index === CODE_LENGTH - 1) {
      const code = newDigits.join("");
      if (code.length === CODE_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email },
        noAuth: true,
      });
      setResendTimer(60);
    } catch {
      setError("Failed to resend code");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Verification" />
      <View className="flex-1 px-8" style={{ paddingTop: "13%" }}>
        <Text className="text-base text-slate-900 text-center mb-6">
          Code sent to {email}
        </Text>

        <View className="flex-row justify-center gap-2 mb-4">
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                borderWidth: error ? 1 : 1,
                borderColor: error ? "#dc2626" : "#e2e8f0",
                backgroundColor: error ? "#fef2f2" : "#f8fafc",
                textAlign: "center",
                fontSize: 20,
                fontWeight: "700",
                color: "#0f172a",
              }}
              value={digit}
              onChangeText={(v) => handleDigitChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!isLoading}
            />
          ))}
        </View>

        {error ? (
          <Text className="text-xs text-red-600 text-center mb-4">{error}</Text>
        ) : null}

        <Pressable
          onPress={() => handleVerify(digits.join(""))}
          disabled={isLoading || digits.join("").length !== CODE_LENGTH}
          className={`h-12 rounded-xl items-center justify-center mt-4 ${
            isLoading || digits.join("").length !== CODE_LENGTH
              ? "bg-blue-900 opacity-50"
              : "bg-blue-900 active:bg-slate-900"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-base font-semibold">Verify</Text>
          )}
        </Pressable>

        <Pressable onPress={handleResend} disabled={resendTimer > 0} className="mt-4">
          <Text className="text-sm text-slate-400 text-center">
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
