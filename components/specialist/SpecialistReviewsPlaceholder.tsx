import { View, Text, ViewStyle } from "react-native";
import { colors, gray } from "@/lib/theme";

interface SpecialistReviewsPlaceholderProps {
  cardShadow: ViewStyle;
}

/**
 * Reviews placeholder (SA-3): real reviews come post-MVP.
 */
export default function SpecialistReviewsPlaceholder({
  cardShadow,
}: SpecialistReviewsPlaceholderProps) {
  return (
    <View className="mt-8">
      <Text
        className="uppercase mb-3"
        style={{
          fontSize: 12,
          letterSpacing: 3,
          color: colors.textSecondary,
          fontWeight: "600",
        }}
      >
        Отзывы клиентов
      </Text>
      <View
        className="rounded-2xl border border-border p-5"
        style={{ backgroundColor: colors.surface, ...cardShadow }}
      >
        <Text className="text-sm text-center" style={{ color: gray[400] }}>
          Раздел отзывов скоро появится
        </Text>
      </View>
    </View>
  );
}
