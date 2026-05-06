import { useState } from "react";
import { Pressable, View, Text, Platform } from "react-native";
import { ArrowRight, Crown, Mail, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import Avatar from "@/components/ui/Avatar";
import CopyableValue from "@/components/ui/CopyableValue";
import { colors } from "@/lib/theme";

export interface StaffCardData {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  position: string;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  cachedAvgRating?: number | null;
  cachedReviewsCount?: number | null;
}

interface StaffCardProps {
  staff: StaffCardData;
  /** Компактный режим — только аватар, имя, должность (для коллег). */
  compact?: boolean;
}

/**
 * Карточка сотрудника ИФНС. Кликается → /fns-staff/{id}.
 * - Hover (web): синяя рамка + чуть выше тень — как в каталоге специалистов.
 * - Корона у начальника инспекции/отдела (position содержит «начальник»).
 * - Рейтинг рядом с именем (если есть отзывы).
 * - Email/телефон копируются по клику.
 */
export default function StaffCard({ staff, compact }: StaffCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const fullName = `${staff.lastName} ${staff.firstName} ${staff.middleName ?? ""}`.trim();
  const isChief = /начальник/i.test(staff.position);

  const hoverProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        }
      : {};

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Профиль ${fullName}`}
      onPress={() => router.push(`/fns-staff/${staff.id}` as never)}
      style={({ pressed }) => [
        {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: hovered ? colors.primary : colors.border,
          borderRadius: 12,
          padding: compact ? 12 : 14,
          gap: compact ? 8 : 10,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transitionProperty: "border-color, box-shadow" as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transitionDuration: "150ms" as any,
          shadowColor: "#000",
          shadowOpacity: hovered ? 0.08 : 0.04,
          shadowOffset: { width: 0, height: hovered ? 4 : 1 },
          shadowRadius: hovered ? 10 : 4,
          elevation: hovered ? 3 : 1,
        },
        pressed && { opacity: 0.88 },
      ]}
      {...hoverProps}
    >
      <View
        className="flex-row items-start"
        style={{ gap: 12 }}
      >
        <Avatar name={fullName} imageUrl={staff.photoUrl ?? undefined} size={compact ? "sm" : "md"} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: compact ? 13 : 14,
                fontWeight: "700",
                color: colors.text,
                flexShrink: 1,
              }}
              numberOfLines={2}
            >
              {fullName}
            </Text>
            {isChief && (
              <Crown
                size={compact ? 12 : 14}
                color={colors.warning ?? "#f5a623"}
                fill={colors.warning ?? "#f5a623"}
              />
            )}
          </View>
          <Text
            style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: "600" }}
            numberOfLines={2}
          >
            {staff.position}
          </Text>
          {staff.cachedAvgRating != null && staff.cachedReviewsCount != null && staff.cachedReviewsCount > 0 && (
            <View className="flex-row items-center" style={{ gap: 4, marginTop: 4 }}>
              <Star size={11} color={colors.warning ?? "#f5a623"} fill={colors.warning ?? "#f5a623"} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {staff.cachedAvgRating.toFixed(1)}
                </Text>
                {" · "}
                {staff.cachedReviewsCount}{" "}
                {staff.cachedReviewsCount === 1 ? "отзыв" : "отзывов"}
              </Text>
            </View>
          )}
        </View>
        <ArrowRight size={14} color={hovered ? colors.primary : colors.textMuted} />
      </View>
      {!compact && (staff.phone || staff.email) && (
        <View style={{ gap: 4, paddingLeft: 4 }} onStartShouldSetResponder={() => true}>
          {staff.phone && (
            <CopyableValue
              value={staff.phone}
              oneLine
              icon={<Text style={{ fontSize: 12 }}>📞</Text>}
            />
          )}
          {staff.email && (
            <CopyableValue
              value={staff.email}
              oneLine
              primaryColor
              icon={<Mail size={12} color={colors.textMuted} />}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}
