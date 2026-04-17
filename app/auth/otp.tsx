import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect, useCallback } from "react";
import HeaderBack from "@/components/HeaderBack";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { colors } from "@/lib/theme";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

type PendingAuth = {
  accessToken: string;
  refreshToken: string;
  user: UserData;
};

export default function AuthOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email =
    typeof params.email === "string"
      ? params.email
      : Array.isArray(params.email)
        ? params.email[0]
        : "";
  const { signIn } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  // New users: show inline role choice before completing signIn
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-focus first input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const routeByRole = useCallback(
    (user: UserData) => {
      if (user.role === "CLIENT") {
        router.replace("/(client-tabs)/dashboard" as never);
      } else if (user.role === "SPECIALIST") {
        if (!user.firstName) {
          router.replace("/onboarding/name" as never);
        } else {
          router.replace("/(specialist-tabs)/dashboard" as never);
        }
      } else if (user.role === "ADMIN") {
        router.replace("/(admin-tabs)/dashboard" as never);
      } else {
        router.replace("/(client-tabs)/dashboard" as never);
      }
    },
    [router]
  );

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

        if (!data.user.role) {
          // New user — defer signIn, show role choice first
          setPendingAuth(data);
          setShowRoleChoice(true);
          return;
        }

        await signIn(data.accessToken, data.refreshToken, data.user);
        routeByRole(data.user);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Неверный код";
        setError(msg);
        setDigits(Array(CODE_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } finally {
        setIsLoading(false);
      }
    },
    [email, signIn, routeByRole]
  );

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of full 6-digit code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
      const newDigits = Array(CODE_LENGTH)
        .fill("")
        .map((_, i) => pasted[i] ?? "");
      setDigits(newDigits);
      setError("");
      const lastIdx = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[lastIdx]?.focus();
      if (pasted.length === CODE_LENGTH) {
        handleVerify(pasted);
      }
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6th digit entered
    if (index === CODE_LENGTH - 1 && value) {
      const code = newDigits.join("");
      if (code.length === CODE_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError("");
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email },
        noAuth: true,
      });
      setResendTimer(RESEND_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError("Не удалось отправить код. Попробуйте ещё раз.");
    } finally {
      setIsResending(false);
    }
  };

  const handleRoleChoice = async (role: "CLIENT" | "SPECIALIST") => {
    if (!pendingAuth) return;
    const user: UserData = { ...pendingAuth.user, role };
    await signIn(pendingAuth.accessToken, pendingAuth.refreshToken, user);
    if (role === "SPECIALIST") {
      router.replace("/onboarding/name" as never);
    } else {
      // CLIENT — go to new request creation
      router.replace("/requests/new" as never);
    }
  };

  const isCodeFull = digits.join("").length === CODE_LENGTH;

  // ── Role choice (new user, shown after OTP verified) ──
  if (showRoleChoice) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ResponsiveContainer>
          <View className="flex-1 justify-center">
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-blue-900 items-center justify-center">
                <Text className="text-xl font-bold text-white">P2P</Text>
              </View>
            </View>

            <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
              Кто вы?
            </Text>
            <Text className="text-sm text-slate-400 text-center mb-8">
              Выберите, как вы будете использовать сервис
            </Text>

            <Pressable
              accessibilityLabel="Мне нужна помощь с налоговой"
              onPress={() => handleRoleChoice("CLIENT")}
              className="border-2 border-slate-200 rounded-2xl p-5 mb-4 active:bg-slate-50"
            >
              <Text className="text-base font-semibold text-slate-900 text-center mb-1">
                Мне нужна помощь с налоговой
              </Text>
              <Text className="text-sm text-slate-400 text-center">
                Ищу специалиста для решения налоговых вопросов
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Я налоговый специалист"
              onPress={() => handleRoleChoice("SPECIALIST")}
              className="bg-blue-900 rounded-2xl p-5 active:bg-blue-800"
              style={{
                shadowColor: "#1e3a8a",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text className="text-base font-semibold text-white text-center mb-1">
                Я налоговый специалист
              </Text>
              <Text className="text-sm text-blue-300 text-center">
                Помогаю клиентам с налоговыми вопросами
              </Text>
            </Pressable>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  // ── OTP entry screen ──
  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Подтверждение" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <ResponsiveContainer>
            <View className="flex-1" style={{ paddingTop: "12%" }}>
              <Text className="text-base text-slate-900 text-center mb-1">
                Код отправлен на
              </Text>
              <Text className="text-base font-semibold text-slate-900 text-center mb-8">
                {email}
              </Text>

              {/* 6 separate digit inputs */}
              <View className="flex-row justify-center gap-2 mb-4">
                {digits.map((digit, i) => (
                  <TextInput
                    key={i}
                    accessibilityLabel={`Цифра ${i + 1} кода подтверждения`}
                    ref={(ref) => {
                      inputRefs.current[i] = ref;
                    }}
                    style={{
                      width: 48,
                      height: 52,
                      borderRadius: 12,
                      borderWidth: error ? 1.5 : 1,
                      borderColor: error
                        ? colors.error
                        : digit
                          ? colors.primary
                          : "#e2e8f0",
                      backgroundColor: error
                        ? "#fef2f2"
                        : digit
                          ? "#eff6ff"
                          : "#f8fafc",
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: "700",
                      color: error ? colors.error : colors.text,
                    }}
                    value={digit}
                    onChangeText={(v) => handleDigitChange(i, v)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(i, nativeEvent.key)
                    }
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    editable={!isLoading}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? (
                <Text className="text-sm text-red-600 text-center mb-4">
                  {error}
                </Text>
              ) : (
                <View style={{ height: 20, marginBottom: 16 }} />
              )}

              {/* Verify button */}
              <Pressable
                accessibilityLabel="Подтвердить"
                onPress={() => handleVerify(digits.join(""))}
                disabled={isLoading || !isCodeFull}
                className={`h-12 rounded-xl items-center justify-center ${
                  isLoading || !isCodeFull
                    ? "bg-blue-900 opacity-50"
                    : "bg-blue-900 active:bg-blue-800"
                }`}
                style={
                  isCodeFull && !isLoading
                    ? {
                        shadowColor: "#1e3a8a",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 3,
                      }
                    : undefined
                }
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Подтвердить
                  </Text>
                )}
              </Pressable>

              {/* Resend link with countdown */}
              <Pressable
                accessibilityLabel={
                  resendTimer > 0
                    ? `Повторная отправка через ${resendTimer} секунд`
                    : "Отправить код повторно"
                }
                onPress={handleResend}
                disabled={resendTimer > 0 || isResending}
                className="mt-4 py-3 items-center"
              >
                {isResending ? (
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : resendTimer > 0 ? (
                  <Text className="text-sm text-slate-400 text-center">
                    Отправить повторно через{" "}
                    <Text className="font-medium text-slate-500">
                      {resendTimer} сек
                    </Text>
                  </Text>
                ) : (
                  <Text className="text-sm text-blue-900 font-medium underline text-center">
                    Отправить код повторно
                  </Text>
                )}
              </Pressable>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
