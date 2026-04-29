import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import HeaderBack from "@/components/HeaderBack";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import { colors, radiusValue, textStyle } from "@/lib/theme";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

type PendingAuth = {
  accessToken: string;
  refreshToken: string;
  user: UserData;
};

function maskEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local.charAt(0)}***@${domain}`;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AuthOtpScreen() {
  const router = useRouter()
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ email: string; returnTo?: string; intent?: string }>();
  const email =
    typeof params.email === "string"
      ? params.email
      : Array.isArray(params.email)
        ? params.email[0]
        : "";
  const returnTo =
    typeof params.returnTo === "string"
      ? params.returnTo
      : Array.isArray(params.returnTo)
        ? params.returnTo[0]
        : undefined;
  const intent =
    typeof params.intent === "string"
      ? params.intent
      : Array.isArray(params.intent)
        ? params.intent[0]
        : undefined;
  const { signIn } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    if (!email) return;
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, [email]);

  const routeByRole = useCallback(
    (user: UserData) => {
      // Landing CTA "Я специалист" passes intent=specialist through the auth
      // chain. If the authenticated user is not yet a specialist, drop them
      // into the specialist onboarding (name -> work-area) instead of the
      // generic dashboard. Existing specialists fall through to the regular
      // resume-onboarding / tabs logic below.
      if (intent === "specialist" && !user.isSpecialist) {
        nav.replaceAny({
          pathname: "/onboarding/name",
          params: { role: "specialist" },
        });
        return;
      }
      // If there's a returnTo param, navigate there after login
      if (returnTo) {
        nav.replaceAny(returnTo);
        return;
      }
      // Iter11 — unified (tabs) replaces split client/specialist groups.
      if (user.role === "ADMIN") {
        nav.replaceRoutes.adminDashboard();
        return;
      }
      // Resume incomplete specialist onboarding. The previous check used
      // `!user.firstName`, which only catches users who quit before step 1.
      // Specialists who finish step 1 (firstName set) but abandon before
      // step 3 are stranded — they have no profile, are invisible in the
      // catalog, and cannot write threads. `specialistProfileCompletedAt`
      // is the authoritative gate: it's set only after `/api/onboarding/profile`
      // succeeds, so any falsy value means onboarding is incomplete.
      if (user.isSpecialist && !user.specialistProfileCompletedAt) {
        nav.replaceRoutes.onboardingName();
        return;
      }
      nav.replaceRoutes.tabs();
    },
    [router, returnTo, intent]
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

  useEffect(() => {
    if (digits.every(d => d !== "") && !isLoading) {
      handleVerify(digits.join(""));
    }
  }, [digits, isLoading, handleVerify]);

  const handleDigitChange = (index: number, value: string) => {
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

    setDigits(prev => {
      const newDigits = [...prev];
      newDigits[index] = value.slice(-1);
      return newDigits;
    });
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
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

  // Iter11 PR 3 — new-user type picker. Calls /api/auth/set-role which
  // writes role=USER and toggles `isSpecialist` server-side (the legacy
  // "CLIENT"/"SPECIALIST" strings remain accepted by the endpoint for
  // compatibility with older clients).
  const handleTypeChoice = async (becomeSpecialist: boolean) => {
    if (!pendingAuth) return;
    const { accessToken, refreshToken, user: baseUser } = pendingAuth;
    const optimisticUser: UserData = {
      ...baseUser,
      role: "USER",
      isSpecialist: becomeSpecialist,
    };
    await signIn(accessToken, refreshToken, optimisticUser);
    // Fire-and-forget: persist the choice. If this fails the next /me call
    // will return the still-null role and the user will land back on the
    // picker, which is the correct behaviour.
    try {
      await api("/api/auth/set-role", {
        method: "POST",
        body: { role: becomeSpecialist ? "SPECIALIST" : "USER" },
      });
    } catch {
      // Silent: optimistic update keeps the UI responsive.
    }
    if (becomeSpecialist) {
      nav.replaceRoutes.onboardingName();
    } else if (returnTo) {
      nav.replaceAny(returnTo);
    } else {
      nav.replaceRoutes.tabs();
    }
  };

  const isCodeFull = digits.join("").length === CODE_LENGTH;

  if (showRoleChoice) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View style={{ width: "100%", maxWidth: 400 }}>
            <Text
              className="text-center font-extrabold text-accent mb-10"
              style={{ fontSize: 32, letterSpacing: -0.5 }}
            >
              P2PTax
            </Text>
            <Text
              style={{ ...textStyle.h2, color: colors.text, textAlign: "center", marginBottom: 8 }}
            >
              Кто вы?
            </Text>
            <Text
              style={{ ...textStyle.body, color: colors.textSecondary, textAlign: "center", marginBottom: 32 }}
            >
              Выберите, как вы будете использовать сервис
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Мне нужна помощь с налоговой"
              onPress={() => handleTypeChoice(false)}
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
              onPress={() => handleTypeChoice(true)}
              className="rounded-2xl p-5 active:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-semibold text-white text-center mb-1">
                Я налоговый специалист
              </Text>
              <Text className="text-sm text-center leading-5" style={{ color: colors.accentSoft }}>
                Помогаю клиентам с налоговыми вопросами
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const canResend = resendTimer <= 0;

  // Iter11-b — if the user landed here without an email query param (direct
  // URL / session lost), show a distinct notice state with a CTA back to
  // /login instead of silently redirecting. The silent redirect made
  // /otp render identical to /login in audits, which hides the
  // screen and caused the "identical render" critique finding.
  if (!email) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderBack title="" />
        <View className="flex-1 items-center justify-center px-6">
          <View style={{ width: "100%", maxWidth: 400 }}>
            <Text
              className="text-center font-extrabold text-accent mb-10"
              style={{ fontSize: 32, letterSpacing: -0.5 }}
            >
              P2PTax
            </Text>
            <Text
              className="text-text-base font-extrabold text-center"
              style={{ fontSize: 28, lineHeight: 34, marginBottom: 8 }}
            >
              Сессия истекла
            </Text>
            <Text
              className="text-text-mute text-center"
              style={{ fontSize: 14, lineHeight: 20, marginBottom: 24 }}
            >
              Чтобы получить новый 6-значный код, вернитесь на шаг ввода email.
            </Text>
            <Button
              label="Ввести email"
              onPress={() => nav.replaceRoutes.login()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title="" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          <View style={{ width: "100%", maxWidth: 400 }}>
            <Text
              className="text-center font-extrabold text-accent mb-10"
              style={{ fontSize: 32, letterSpacing: -0.5 }}
            >
              P2PTax
            </Text>

            <Text
              className="text-text-base font-extrabold text-center"
              style={{ fontSize: 28, lineHeight: 34, marginBottom: 8 }}
            >
              Введите код
            </Text>
            <Text
              className="text-text-mute text-center"
              style={{ fontSize: 14, lineHeight: 20, marginBottom: 6 }}
            >
              Код отправлен на{" "}
              <Text className="text-text-base font-semibold">{maskEmail(email)}</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Изменить email"
              onPress={() => nav.replaceRoutes.login()}
              className="mb-7"
            >
              <Text className="text-accent text-center font-medium" style={{ fontSize: 13 }}>
                изменить
              </Text>
            </Pressable>

            <View className="flex-row justify-center gap-2 mb-4">
              {digits.length === 0 ? null : digits.map((digit, i) => (
                // Outer View owns border/bg — prevents double-input on web
                // (NativeWind wraps TextInput in extra div when className is present;
                // keeping className off TextInput and visual styling on parent View
                // avoids the double-box artifact).
                <View
                  key={i}
                  style={{
                    width: 48,
                    height: 56,
                    borderRadius: radiusValue.md,
                    borderWidth: error ? 2 : digit ? 2 : 1.5,
                    borderColor: error
                      ? colors.error
                      : digit
                        ? colors.accent
                        : colors.border,
                    backgroundColor: error
                      ? colors.errorBg
                      : digit
                        ? colors.accentSoft
                        : colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TextInput
                    accessibilityLabel={`Цифра ${i + 1} кода подтверждения`}
                    ref={(ref) => {
                      inputRefs.current[i] = ref;
                    }}
                    // @ts-expect-error — outlineStyle/appearance are web-only CSS; RN drops unknown style keys safely
                    style={{
                      width: 48,
                      height: 56,
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: "700",
                      color: error ? colors.error : colors.text,
                      borderWidth: 0,
                      backgroundColor: "transparent",
                      ...(Platform.OS === "web" ? {
                        borderColor: "transparent",
                        outlineStyle: "none",
                        outlineWidth: 0,
                        appearance: "none",
                      } : {}),
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
                </View>
              ))}
            </View>

            {error ? (
              <Text className="text-sm text-danger text-center mb-4" style={{ fontSize: 13 }}>
                {error}
              </Text>
            ) : (
              <View style={{ height: 20, marginBottom: 4 }} />
            )}

            <Button
              label="Подтвердить"
              onPress={() => handleVerify(digits.join(""))}
              disabled={isLoading || !isCodeFull}
              loading={isLoading}
              testID="verify-otp"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                canResend
                  ? "Отправить код повторно"
                  : `Повторная отправка через ${resendTimer} секунд`
              }
              onPress={handleResend}
              disabled={!canResend || isResending}
              className="mt-5 py-2 items-center"
            >
              {isResending ? (
                <ActivityIndicator color={colors.textSecondary} size="small" />
              ) : canResend ? (
                <Text className="text-sm text-accent font-semibold">
                  Отправить снова
                </Text>
              ) : (
                <Text className="text-sm text-text-mute">
                  Новый код через{" "}
                  <Text className="font-semibold text-text-base">
                    {formatCountdown(resendTimer)}
                  </Text>
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
