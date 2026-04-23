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
import { Mail } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { colors, radiusValue, fontSizeValue } from "@/lib/theme";

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
  const isSubmitting = useRef(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Guard: if no email param, defer redirect so Root Layout is mounted first
  useEffect(() => {
    if (!email) {
      const t = setTimeout(() => router.replace('/auth/email' as never), 0);
      return () => clearTimeout(t);
    }
  }, [email, router]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!email) return;
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, [email]);

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
      if (isSubmitting.current) return;
      isSubmitting.current = true;
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
        isSubmitting.current = false;
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
      // CLIENT — go to dashboard
      router.replace("/(client-tabs)/dashboard" as never);
    }
  };

  const isCodeFull = digits.join("").length === CODE_LENGTH;

  // ── Role choice (new user, shown after OTP verified) ──
  if (showRoleChoice) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ResponsiveContainer>
          <View className="flex-1 justify-center px-2">
            <View className="items-center mb-10">
              <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center" style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                <Text className="text-xl font-bold text-white">P2P</Text>
              </View>
            </View>

            <Text className="text-2xl font-bold text-text-base text-center mb-2">
              Кто вы?
            </Text>
            <Text className="text-base text-text-mute text-center mb-8 leading-6">
              Выберите, как вы будете использовать сервис
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Мне нужна помощь с налоговой"
              onPress={() => handleRoleChoice("CLIENT")}
              className="border-2 border-border rounded-2xl p-5 mb-3 active:bg-surface2"
            >
              <Text className="text-base font-semibold text-text-base text-center mb-1">
                Мне нужна помощь с налоговой
              </Text>
              <Text className="text-sm text-text-mute text-center leading-5">
                Ищу специалиста для решения налоговых вопросов
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Я налоговый специалист"
              onPress={() => handleRoleChoice("SPECIALIST")}
              className="rounded-2xl p-5 active:opacity-90"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-base font-semibold text-white text-center mb-1">
                Я налоговый специалист
              </Text>
              <Text className="text-sm text-center leading-5" style={{ color: colors.accentSoft }}>
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
            <View className="flex-1" style={{ paddingTop: 48 }}>
              {/* Heading */}
              <Text className="text-2xl font-bold text-text-base text-center mb-2">
                Введите код
              </Text>
              <Text className="text-base text-text-mute text-center leading-6 mb-1">
                Код отправлен на
              </Text>
              <Text className="text-base font-semibold text-text-base text-center mb-8">
                {email}
              </Text>

              {/* 6 separate digit inputs */}
              <View className="flex-row justify-center gap-3 mb-2">
                {digits.length === 0 ? (
                  <EmptyState icon={Mail} title="Код недоступен" subtitle="Не удалось инициализировать поля ввода" />
                ) : (
                  digits.map((digit, i) => (
                    <TextInput
                      key={i}
                      accessibilityLabel={`Цифра ${i + 1} кода подтверждения`}
                      ref={(ref) => {
                        inputRefs.current[i] = ref;
                      }}
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: radiusValue.md,
                        borderWidth: error ? 2 : digit ? 2 : 1.5,
                        borderColor: error
                          ? colors.error
                          : digit
                            ? colors.primary
                            : colors.border,
                        backgroundColor: error
                          ? colors.errorBg
                          : digit
                            ? colors.accentSoft
                            : colors.surface2,
                        textAlign: "center",
                        fontSize: fontSizeValue.xl,
                        fontWeight: "700",
                        color: error ? colors.error : colors.text,
                        outlineWidth: 0,
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
                  ))
                )}
              </View>

              {/* Error / spacer */}
              {error ? (
                <Text className="text-sm text-danger text-center mt-3 mb-4 leading-5">
                  {error}
                </Text>
              ) : (
                <View style={{ height: 28, marginBottom: 16 }} />
              )}

              {/* Verify button */}
              <Button
                label="Подтвердить"
                onPress={() => handleVerify(digits.join(""))}
                disabled={isLoading || !isCodeFull}
                loading={isLoading}
                testID="verify-otp"
              />

              {/* Resend link with countdown */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  resendTimer > 0
                    ? `Повторная отправка через ${resendTimer} секунд`
                    : "Отправить код повторно"
                }
                onPress={handleResend}
                disabled={resendTimer > 0 || isResending}
                className="mt-5 py-3 items-center"
              >
                {isResending ? (
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : resendTimer > 0 ? (
                  <Text className="text-sm text-text-mute text-center leading-5">
                    Отправить повторно через{" "}
                    <Text className="font-semibold text-text-base">
                      {resendTimer} сек
                    </Text>
                  </Text>
                ) : (
                  <Text className="text-base text-accent font-semibold text-center">
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
