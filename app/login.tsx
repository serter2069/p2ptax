import { View, Text, Pressable, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Iter11 — unified (tabs) replaces split client/specialist groups.
      if (user.role === "ADMIN") {
        nav.replaceRoutes.adminDashboard();
      } else {
        nav.replaceRoutes.tabs();
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
      nav.any({
        pathname: "/otp",
        params: { email: email.trim().toLowerCase() },
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
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View style={{ width: "100%", maxWidth: 400 }}>
          {/* Wordmark */}
          <Text
            className="text-center font-extrabold text-accent mb-10"
            style={{ fontSize: 32, letterSpacing: -0.5 }}
          >
            P2PTax
          </Text>

          {/* Header */}
          <Text
            className="text-text-base font-extrabold text-center"
            style={{ fontSize: 28, lineHeight: 34, marginBottom: 8 }}
          >
            Вход
          </Text>
          <Text
            className="text-text-mute text-center"
            style={{ fontSize: 14, lineHeight: 20, marginBottom: 28 }}
          >
            Введите email — отправим код подтверждения
          </Text>

          {/* Email input with leading icon */}
          <View
            className="flex-row items-center rounded-xl border bg-white"
            style={{
              borderWidth: focused ? 2 : 1,
              borderColor: error ? colors.error : focused ? colors.accent : colors.border,
              height: 48,
              paddingHorizontal: 14,
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
                // WCAG 2.5.5 — explicit 44px tap target on web; the
                // <input> intrinsic height is ~18px otherwise.
                // appearance:none + outlineStyle:none kill the default
                // browser <input> chrome that creates the double-border
                // artifact when the outer View owns the visible border.
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
