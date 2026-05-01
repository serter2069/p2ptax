import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

interface IntakeProgressProps {
  step: number;
  total: number;
}

/**
 * Sticky top progress bar. "Шаг N из M" + filled bar — purely decorative,
 * no interactivity (back/next nav lives in IntakeNav).
 */
export default function IntakeProgress({ step, total }: IntakeProgressProps) {
  const pct = Math.max(0, Math.min(1, step / total));
  return (
    <View className="px-4 pt-3 pb-3 bg-surface2 border-b border-border">
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider">
          Шаг {step} из {total}
        </Text>
        <Text className="text-xs text-text-dim">
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View
        className="rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: colors.border }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: colors.primary,
          }}
        />
      </View>
    </View>
  );
}
