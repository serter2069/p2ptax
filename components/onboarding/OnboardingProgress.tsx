import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

interface Props {
  /** Current step: 1, 2, or 3 (matches Имя / Работа / Профиль). */
  step: 1 | 2 | 3;
}

const STEPS: { label: string }[] = [
  { label: "Имя" },
  { label: "Работа" },
  { label: "Профиль" },
];

/**
 * Persistent top-of-screen progress indicator for onboarding.
 *
 * Renders a thin 4px bar with a filled portion proportional to `step`,
 * a dot on the current step, and three named labels underneath.
 */
export default function OnboardingProgress({ step }: Props) {
  const percent = (step / STEPS.length) * 100;

  return (
    <View style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}>
      {/* Bar */}
      <View
        className="rounded-full overflow-hidden"
        style={{
          height: 4,
          backgroundColor: colors.border,
          position: "relative",
        }}
      >
        <View
          className="bg-accent"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent}%`,
            borderRadius: 999,
          }}
        />
      </View>

      {/* Step labels with dot on current */}
      <View className="flex-row justify-between mt-3">
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const isCurrent = idx === step;
          const isDone = idx < step;
          return (
            <View
              key={s.label}
              className="flex-row items-center"
              style={{ gap: 6 }}
            >
              <View
                className="rounded-full"
                style={{
                  width: isCurrent ? 8 : 6,
                  height: isCurrent ? 8 : 6,
                  backgroundColor:
                    isCurrent || isDone ? colors.accent : colors.border,
                }}
              />
              <Text
                className={
                  isCurrent
                    ? "font-semibold text-accent"
                    : isDone
                      ? "font-medium text-text-base"
                      : "text-text-mute"
                }
                style={{ fontSize: 12 }}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
