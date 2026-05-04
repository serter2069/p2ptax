import { View, Text, Image, Platform } from "react-native";
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
  // IMPORTANT: use plain `.toUpperCase()` (locale-agnostic). Never use
  // `toLocaleUpperCase('en')` here — it would strip Cyrillic ("С" → "C")
  // and break Russian-language fallbacks. Initials must preserve the
  // original alphabet of the user's name.
  return name
    .split(" ")
    .filter(Boolean)
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
    // Web rendering bug: when `border-radius: 9999` is applied only to the
    // outer wrapper (with overflow:hidden) the inner <img> can still bleed
    // square corners on certain DPR/browser combos — the avatar reads
    // "square". Fix: round BOTH the wrapper AND the inner image, and shrink
    // the image by `borderWidth*2` so it fits inside the bordered box
    // (instead of overflowing it and being clipped by overflow:hidden).
    const borderW = 2;
    const inner = wh - borderW * 2;
    return (
      <View
        style={{
          width: wh,
          height: wh,
          borderRadius: wh / 2,
          overflow: "hidden",
          borderWidth: borderW,
          borderColor: colors.border,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          accessibilityLabel={name}
          style={{ width: inner, height: inner, borderRadius: inner / 2 }}
          // Web only: catalogs and inbox lists render dozens of avatars
          // at once. Without lazy loading the browser fetches every
          // off-screen one immediately. RN-Web forwards arbitrary props
          // to the underlying <img>; Native ignores them safely.
          {...(Platform.OS === "web" ? ({ loading: "lazy" } as object) : {})}
          // 'cover' keeps non-square legacy avatars (uploaded under
          // fit:'inside') filling the round mask cleanly.
          resizeMode="cover"
        />
      </View>
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
