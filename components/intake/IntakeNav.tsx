import { View, Pressable, Text, ActivityIndicator } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors, gray } from "@/lib/theme";

interface IntakeNavProps {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  /** Disable Next when current step is invalid. */
  nextDisabled: boolean;
  /** Submitting flag — applies to the final step's "Отправить запрос" press. */
  submitting?: boolean;
  /**
   * Override the next-button label. Final step = "Отправить запрос";
   * intermediate steps = "Далее".
   */
  nextLabel?: string;
}

/**
 * Sticky bottom nav. Back disabled on step 1. Next either advances or, on the
 * last step, triggers submit (parent decides via onNext).
 */
export default function IntakeNav({
  step,
  total,
  onBack,
  onNext,
  nextDisabled,
  submitting = false,
  nextLabel,
}: IntakeNavProps) {
  const backDisabled = step === 1;
  const isFinal = step === total;
  const label = nextLabel ?? (isFinal ? "Отправить запрос" : "Далее");

  return (
    <View
      className="flex-row gap-3 px-4 py-3 border-t border-border bg-white"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Назад"
        accessibilityState={{ disabled: backDisabled }}
        onPress={onBack}
        disabled={backDisabled}
        className="flex-row items-center justify-center rounded-xl px-4"
        style={{
          minHeight: 48,
          minWidth: 100,
          backgroundColor: backDisabled ? gray[100] : colors.surface,
          borderWidth: 1,
          borderColor: backDisabled ? gray[200] : colors.border,
          opacity: backDisabled ? 0.6 : 1,
        }}
      >
        <ChevronLeft size={18} color={backDisabled ? gray[400] : colors.text} />
        <Text
          className="text-base font-medium ml-1"
          style={{ color: backDisabled ? gray[400] : colors.text }}
        >
          Назад
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: nextDisabled || submitting, busy: submitting }}
        onPress={onNext}
        disabled={nextDisabled || submitting}
        className="flex-1 flex-row items-center justify-center rounded-xl px-4"
        style={{
          minHeight: 48,
          backgroundColor:
            nextDisabled && !submitting ? gray[200] : colors.primary,
          shadowColor:
            !nextDisabled && !submitting ? colors.primary : "transparent",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: !nextDisabled && !submitting ? 0.2 : 0,
          shadowRadius: 4,
        }}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text
              className="text-base font-semibold"
              style={{ color: nextDisabled ? gray[600] : colors.white }}
            >
              {label}
            </Text>
            {!isFinal && (
              <ChevronRight
                size={18}
                color={nextDisabled ? gray[600] : colors.white}
                style={{ marginLeft: 4 }}
              />
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}
