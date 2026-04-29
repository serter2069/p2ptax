import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors } from "@/lib/theme";

interface ResendCountdownProps {
  /** Seconds remaining until resend is allowed. 0 = ready to resend. */
  cooldownSec: number;
  /** Called when the user taps "Send again" while cooldown == 0. */
  onResend: () => void;
  /** Whether a resend request is in flight (shows spinner). */
  isResending?: boolean;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Countdown timer + resend button for OTP screens.
 * Shows either:
 *  - spinner while resending,
 *  - "Отправить снова" link when cooldown reaches 0,
 *  - "Новый код через M:SS" otherwise.
 */
export default function ResendCountdown({
  cooldownSec,
  onResend,
  isResending = false,
}: ResendCountdownProps) {
  const canResend = cooldownSec <= 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        canResend
          ? "Отправить код повторно"
          : `Повторная отправка через ${cooldownSec} секунд`
      }
      onPress={onResend}
      disabled={!canResend || isResending}
      className="mt-5 py-2 items-center"
    >
      {isResending ? (
        <ActivityIndicator color={colors.textSecondary} size="small" />
      ) : canResend ? (
        <Text className="text-sm text-accent font-semibold">Отправить снова</Text>
      ) : (
        <Text className="text-sm text-text-mute">
          Новый код через{" "}
          <Text className="font-semibold text-text-base">
            {formatCountdown(cooldownSec)}
          </Text>
        </Text>
      )}
    </Pressable>
  );
}
