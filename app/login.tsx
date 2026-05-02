import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { Mail } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useOtpRequest } from "@/lib/hooks/useOtpRequest";
import { colors } from "@/lib/theme";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/brand/Logo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthEmailScreen() {
  const router = useRouter()
  const nav = useTypedRouter();
  const { isAuthenticated, user } = useAuth();
  const params = useLocalSearchParams<{ returnTo?: string; intent?: string }>();
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
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const { request: requestOtp, loading: isLoading, error: otpError } = useOtpRequest();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (returnTo) {
        nav.replaceAny(returnTo);
        return;
      }
      // Iter11 — unified (tabs) replaces split client/specialist groups.
      if (user.role === "ADMIN") {
        nav.replaceRoutes.adminDashboard();
      } else {
        nav.replaceRoutes.dashboard();
      }
    }
  }, [isAuthenticated, user, router, returnTo]);

  const handleContinue = async () => {
    setLocalError("");
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setLocalError("Некорректный email");
      return;
    }
    const ok = await requestOtp(trimmed);
    if (ok) {
      nav.any({
        pathname: "/otp",
        params: {
          email: trimmed,
          ...(returnTo ? { returnTo } : {}),
          ...(intent ? { intent } : {}),
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View style={{ width: "100%", maxWidth: 400 }}>
          {/* Wordmark — tapping navigates home */}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="P2PTax — главная"
            onPress={() => nav.replaceRoutes.home()}
          >
            <Logo size="xl" style={{ alignSelf: "center", marginBottom: 40 }} />
          </Pressable>

          {/* Header */}
          <Text
            className="text-text-base font-extrabold text-center"
            style={{ fontSize: 28, lineHeight: 34, marginBottom: 8 }}
          >
            Вход
          </Text>
          <Text
            className="text-text-mute text-center"
            style={{ fontSize: 14, lineHeight: 20, marginBottom: returnTo ? 16 : 28 }}
          >
            Введите email — отправим код подтверждения
          </Text>

          {/*
            Issues #1515 / #1520 — when the user reached /login via the
            auth gate (useRequireAuth), surface the original target so
            the screen no longer reads as a dead end / wrong destination.
            Without this hint, deep-links to /onboarding/name and other
            protected routes silently rendered as /login with no clue
            that login was an intermediate step.
          */}
          {returnTo ? (
            <View
              accessibilityRole="alert"
              testID="auth-return-hint"
              className="rounded-xl mb-6 px-4 py-3"
              style={{
                backgroundColor: colors.accentSoft,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
            >
              <Text
                className="font-semibold text-accent"
                style={{ fontSize: 13, lineHeight: 18, marginBottom: 2 }}
              >
                Войдите, чтобы продолжить
              </Text>
              <Text
                className="text-text-base"
                style={{ fontSize: 12, lineHeight: 18 }}
                numberOfLines={2}
              >
                После входа мы вернём вас на запрошенную страницу.
              </Text>
            </View>
          ) : null}

          {/* Email input with leading icon */}
          <View style={{ marginBottom: 16 }}>
            <Input
              variant="bordered"
              accessibilityLabel="Email адрес"
              placeholder="your@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (localError) setLocalError("");
              }}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
              onSubmitEditing={handleContinue}
              error={localError || otpError || undefined}
            />
          </View>

          {/* CTA */}
          <Button
            label="Продолжить"
            onPress={handleContinue}
            disabled={isLoading || !email.trim()}
            loading={isLoading}
            testID="send-otp"
          />

          {/* Trust microcopy */}
          <Text
            className="text-text-mute text-center mt-4"
            style={{ fontSize: 12, lineHeight: 18 }}
          >
            Без паролей. 6-значный код на email.
          </Text>

          {/* Terms link */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Условия использования"
            onPress={() => nav.routes.legalTerms()}
            className="mt-4 min-h-[44px] items-center justify-center"
          >
            <Text className="text-text-mute text-center underline" style={{ fontSize: 13 }}>
              Условия использования
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
