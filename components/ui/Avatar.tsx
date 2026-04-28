import { View, Text, Image } from "react-native";
import { colors } from "../../lib/theme";

export type AvatarSize = "sm" | "md" | "lg" | "xl" | "xxl" | number;

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  /** Override background tint when no imageUrl. Defaults to accentSoft. */
  tint?: string;
  /** Override initials text color. Defaults to accentSoftInk. */
  inkColor?: string;
}

const sizeMap = {
  sm: 36,
  md: 44,
  lg: 64,
  xl: 96,
  xxl: 160,
} as const;

function resolveSize(size: AvatarSize): number {
  if (typeof size === "number") return size;
  return sizeMap[size];
}

function textClassFor(wh: number): string {
  if (wh >= 120) return "text-4xl font-bold";
  if (wh >= 80) return "text-3xl font-bold";
  if (wh >= 60) return "text-xl font-semibold";
  if (wh >= 40) return "text-sm font-semibold";
  return "text-xs font-semibold";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  name,
  imageUrl,
  size = "md",
  tint,
  inkColor,
}: AvatarProps) {
  const wh = resolveSize(size);
  const textClass = textClassFor(wh);
  const bg = tint ?? colors.primary;
  const ink = inkColor ?? colors.white;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        accessibilityLabel={name}
        style={{
          width: wh,
          height: wh,
          borderRadius: wh / 2,
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: wh,
        height: wh,
        backgroundColor: bg,
      }}
    >
      <Text className={textClass} style={{ color: ink }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
