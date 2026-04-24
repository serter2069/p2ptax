import { View, Text } from "react-native";
import { Star, StarHalf } from "lucide-react-native";
import { colors } from "@/lib/theme";

export interface RatingStarsProps {
  rating: number; // 0..5, supports halves (4.5 etc.)
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
  color?: string;
}

/**
 * Reusable 5-star rating display. Used on specialist cards, review cards,
 * and profile hero. Supports half-star granularity.
 */
export default function RatingStars({
  rating,
  size = 14,
  showNumber = false,
  reviewCount,
  color = "#f59e0b",
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75;
  const rounded = hasHalf ? full + 0.5 : Math.round(clamped);
  const fullStars = Math.floor(rounded);
  const halfStar = rounded - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <View className="flex-row items-center" style={{ gap: 2 }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`f${i}`} size={size} color={color} fill={color} />
      ))}
      {halfStar && <StarHalf size={size} color={color} fill={color} />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`e${i}`} size={size} color={colors.borderStrong} />
      ))}
      {showNumber && (
        <Text
          className="text-sm font-semibold ml-1"
          style={{ color: colors.text }}
        >
          {clamped.toFixed(1)}
        </Text>
      )}
      {reviewCount !== undefined && (
        <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
          ({reviewCount}{" "}
          {reviewCount === 1
            ? "отзыв"
            : reviewCount < 5
            ? "отзыва"
            : "отзывов"}
          )
        </Text>
      )}
    </View>
  );
}
