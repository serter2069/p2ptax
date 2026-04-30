import { View, Text, Image, Pressable, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { Mail } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import Button from "@/components/ui/Button";

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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

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
      nav.any({
        pathname: "/otp",
        params: {
          email: email.trim().toLowerCase(),
          ...(returnTo ? { returnTo } : {}),
          ...(intent ? { intent } : {}),
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Logo — top-left corner, links to landing */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Перейти на главную"
        onPress={() => router.push("/" as never)}
        className="absolute top-4 left-4 z-10 min-h-[44px] items-start justify-center"
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 110, height: 46 }}
          resizeMode="contain"
          accessibilityLabel="P2PTax"
        />
      </Pressable>

      <View className="flex-1 items-center justify-center bg-white px-6">
        <View style={{ width: "100%", maxWidth: 400 }}>

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

          {/* Email input — line-style (bottom border only) */}
          <View
            className="flex-row items-center"
            style={{
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: focused ? 2 : 1,
              borderBottomColor: error ? colors.error : focused ? colors.accent : colors.borderStrong,
              paddingBottom: 2,
              marginBottom: error ? 6 : 16,
            }}
          >
            <Mail size={18} color={focused ? colors.accent : colors.placeholder} />
            <TextInput
              accessibilityLabel="Email адрес"
              placeholder="your@email.com"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
              onSubmitEditing={handleContinue}
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 15,
                color: colors.text,
                borderWidth: 0,
                backgroundColor: "transparent",
                ...(Platform.OS === "web" ? {
                  minHeight: 44,
                  alignSelf: "stretch" as never,
                  borderColor: "transparent",
                  outlineStyle: "none" as never,
                  outlineWidth: 0,
                  appearance: "none" as never,
                } : {}),
              }}
            />
          </View>

          {error ? (
            <Text className="text-sm text-danger mb-3" style={{ fontSize: 13 }}>
              {error}
            </Text>
          ) : null}

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
