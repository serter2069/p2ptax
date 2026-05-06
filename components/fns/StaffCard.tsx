import { createElement, useState } from "react";
import { Pressable, View, Text, Platform } from "react-native";
import { ArrowRight, Crown, Mail, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import Avatar from "@/components/ui/Avatar";
import CopyableValue from "@/components/ui/CopyableValue";
import { colors } from "@/lib/theme";

interface ChiefBadgeProps {
  size: number;
  title: string;
}

/**
 * Иконка-корона с tooltip. На web рендерим в `<div title="…">` —
 * React Native View не пробрасывает `title`, и нативный браузерный
 * tooltip работает только через настоящий DOM-элемент.
 */
export function ChiefBadge({ size, title }: ChiefBadgeProps) {
  const icon = (
    <Crown
      size={size}
      color={colors.warning ?? "#f5a623"}
      fill={colors.warning ?? "#f5a623"}
    />
  );
  if (Platform.OS === "web") {
    return createElement(
      "div",
      {
        title,
        style: {
          display: "inline-flex",
          alignItems: "center",
          cursor: "help",
        },
      },
      icon,
    );
  }
  return <View accessibilityLabel={title}>{icon}</View>;
}

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
  // На web (десктоп) — корона вместо текста должности (с tooltip).
  // На native/мобильном — оставляем текст, иначе непонятно.
  const showPositionText = !(Platform.OS === "web" && isChief);

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
          <View className="flex-row items-center" style={{ gap: 6 }}>
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
              <ChiefBadge
                size={compact ? 12 : 15}
                title={`Начальник: ${staff.position.toLowerCase()}${staff.department ? ` · ${staff.department}` : ""}`}
              />
            )}
          </View>
          {/* Отдел — главное (под именем), у всех сотрудников. */}
          {staff.department && (
            <Text
              style={{
                fontSize: compact ? 12 : 13,
                color: colors.primary,
                marginTop: 2,
                fontWeight: "700",
              }}
              numberOfLines={2}
            >
              {staff.department}
            </Text>
          )}
          {/* Должность — менее заметным. На десктопе у начальника
              достаточно короны + отдела (текст должности скрываем —
              иначе дубль), на мобильном — оставляем. */}
          {showPositionText && (
            <Text
              style={{ fontSize: compact ? 11 : 12, color: colors.textSecondary, marginTop: 2 }}
              numberOfLines={1}
            >
              {staff.position}
            </Text>
          )}
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
