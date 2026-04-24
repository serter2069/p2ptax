import { View, Text } from "react-native";
import RatingStars from "@/components/ui/RatingStars";
import { colors } from "@/lib/theme";

export interface SpecialistReviewData {
  id: string;
  authorName: string;
  rating: number;
  date: string; // ISO
  text: string;
  categoryChips: string[];
}

export interface ReviewCardProps {
  review: SpecialistReviewData;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Social-proof review card. Shows author initials, 5-star rating, review
 * date, full testimonial text (not truncated), and linked category chips.
 */
export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 mb-3"
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* Header row */}
      <View className="flex-row items-center mb-2" style={{ gap: 10 }}>
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.accentSoft,
          }}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.accentSoftInk }}
          >
            {getInitials(review.authorName)}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className="font-semibold text-sm"
            style={{ color: colors.text }}
          >
            {review.authorName}
          </Text>
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {formatDate(review.date)}
          </Text>
        </View>
        <RatingStars rating={review.rating} size={14} />
      </View>

      {/* Text */}
      <Text
        className="text-sm leading-6 mb-3"
        style={{ color: colors.text }}
      >
        «{review.text}»
      </Text>

      {/* Category chips */}
      {review.categoryChips.length > 0 && (
        <View className="flex-row flex-wrap" style={{ gap: 6 }}>
          {review.categoryChips.map((chip) => (
            <View
              key={chip}
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: colors.surface2 }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                {chip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
