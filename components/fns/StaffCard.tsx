import { useState } from "react";
import { Pressable, View, Text, Platform } from "react-native";
import { ArrowRight, Crown, Mail } from "lucide-react-native";
import { useRouter } from "expo-router";
import Avatar from "@/components/ui/Avatar";
import CopyableValue from "@/components/ui/CopyableValue";
import { colors } from "@/lib/theme";

interface ChiefBadgeProps {
  size: number;
  title: string;
}

/**
 * Корона с быстрым кастомным tooltip-ом. Раньше использовали нативный
 * атрибут `title` — у браузера встроенная задержка ~700ms, пользователь
 * жаловался что tooltip появляется очень долго. Здесь — наш собственный
 * View, появляется мгновенно по hover/focus.
 */
export function ChiefBadge({ size, title }: ChiefBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const icon = (
    <Crown
      size={size}
      color={colors.warning ?? "#f5a623"}
      fill={colors.warning ?? "#f5a623"}
    />
  );
  if (Platform.OS !== "web") {
    return <View accessibilityLabel={title}>{icon}</View>;
  }
  const hoverProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };
  return (
    <View
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={{ position: "relative", alignSelf: "flex-start", cursor: "help" as any }}
      {...(hoverProps as object)}
      accessibilityLabel={title}
    >
      {icon}
      {hovered && (
        <View
          // Tooltip-плашка над иконкой. zIndex большой, чтобы
          // перекрывала соседние карточки в списках. whiteSpace на
          // web нужен чтобы текст не переносился, на native свойство
          // игнорируется — поэтому as any.
          style={{
            position: "absolute",
            bottom: size + 6,
            left: -4,
            paddingHorizontal: 8,
            paddingVertical: 5,
            backgroundColor: "rgba(17, 17, 17, 0.92)",
            borderRadius: 6,
            zIndex: 1000,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...({ whiteSpace: "nowrap", pointerEvents: "none" } as any),
          }}
        >
          <Text
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={{
              color: "#fff",
              fontSize: 11,
              fontWeight: "600",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...({ whiteSpace: "nowrap" } as any),
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  );
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
  // У начальников должность дублирует корону + отдел («Начальник
  // правового отдела» = корона + «правовой отдел»). Текст должности
  // показываем только не-начальникам, у них корона не рендерится.
  const showPositionText = !isChief;

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
                title={staff.position}
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
