import { ReactNode } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { colors, textStyle } from "@/lib/theme";

export interface OnboardingShellProps {
  /** Onboarding step (1=name, 2=work-area, 3=profile). */
  step: 1 | 2 | 3;
  /** Title shown directly under the progress bar — preserves route identity. */
  title: string;
  /** Optional subtitle / one-line description. */
  subtitle?: string;
  /** When true, render a spinner under the title instead of `children`. */
  loading?: boolean;
  /** Optional `onBack` override — defaults to `router.back()` upstream. */
  onBack?: () => void;
  /** Hide the progress bar (used by /onboarding/work-area when fromSettings). */
  hideProgress?: boolean;
  /** Custom max content width — `name`/`profile` use 640, `work-area` uses 720. */
  maxWidth?: number;
  children?: ReactNode;
}

/**
 * Shared chrome for /onboarding/{name,work-area,profile} so that route
 * identity (back button + Шаг N/3 progress + page title) is visible even
 * while the screen is still resolving auth/specialist state.
 *
 * Issues #1515 / #1520 / #1522 — previously the screens returned a bare
 * `<LoadingState />` (spinner only) while `useRequireAuth()` was still
 * loading or while the screen-level effect was bouncing a non-specialist
 * back to /tabs. Mosaic snapshots taken during that window had no signal
 * that the route was "/onboarding/<step>" at all, which read as the
 * route silently rendering a generic auth/login shell. Shipping the
 * chrome unconditionally keeps the route self-identifying.
 */
export default function OnboardingShell({
  step,
  title,
  subtitle,
  loading = false,
  onBack,
  hideProgress = false,
  maxWidth = 640,
  children,
}: OnboardingShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {onBack ? (
        <View className="px-6 pt-4 pb-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Назад"
            onPress={onBack}
            className="flex-row items-center"
            style={{ minHeight: 44 }}
          >
            <ChevronLeft size={20} color={colors.text} />
            <Text className="text-text-base ml-1">Назад</Text>
          </Pressable>
        </View>
      ) : null}

      {!hideProgress && (
        <View className="px-6 pb-4">
          <OnboardingProgress step={step} />
        </View>
      )}

      <View
        style={{
          width: "100%",
          maxWidth,
          alignSelf: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            ...textStyle.h1,
            color: colors.text,
            fontSize: 32,
            lineHeight: 38,
            marginTop: 16,
            marginBottom: subtitle ? 12 : 24,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...textStyle.body,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
              marginBottom: loading ? 24 : 32,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {loading ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Загрузка"
            className="items-center justify-center"
            style={{ paddingVertical: 48 }}
          >
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : null}
      </View>

      {!loading ? children : null}
    </SafeAreaView>
  );
}
