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

// One proportional formula across every size — no per-bucket classes.
// fontSize ≈ 42% of diameter is a near-universal initials ratio (matches
// Material/iOS/Google Chat). Min 11px keeps double-letter initials
// legible inside very small avatars (≤22px).
function fontSizeFor(wh: number): number {
  return Math.max(11, Math.round(wh * 0.42));
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
  const initialsFontSize = fontSizeFor(wh);
  const bg = tint ?? colors.primary;
  const ink = inkColor ?? colors.white;

  if (imageUrl) {
    // Single rounded wrapper with overflow:hidden does the clipping; the
    // inner <Image> fills it (no secondary borderRadius needed). The
    // previous double-radius approach with a 2px border was eating the
    // image surface and reading 'square' at small sizes / on certain
    // DPRs. Now: clean circle, image cropped by parent's overflow:hidden.
    return (
      <View
        style={{
          width: wh,
          height: wh,
          borderRadius: wh / 2,
          overflow: "hidden",
          backgroundColor: colors.surface2,
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          accessibilityLabel={name}
          style={{ width: wh, height: wh }}
          {...(Platform.OS === "web" ? ({ loading: "lazy" } as object) : {})}
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
      <Text
        // Use direct style for both fontSize and fontWeight so the
        // proportions are deterministic across platforms (NativeWind
        // text-* classes can quietly diverge between web and iOS).
        style={{
          color: ink,
          fontSize: initialsFontSize,
          fontWeight: "600",
          // Web only: the default rendering can cause one initial to
          // sit visually higher than the other when the font has
          // varying ascender heights (Cyrillic).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(typeof window !== "undefined" ? ({ lineHeight: initialsFontSize } as any) : {}),
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
