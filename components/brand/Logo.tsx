import { Image, Platform, type ImageStyle } from "react-native";

export type LogoVariant = "dark" | "white" | "icon";
export type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  style?: ImageStyle;
}

const SOURCES = {
  // On web, prefer WebP for smaller file size (~30% vs PNG). Metro bundles both;
  // modern browsers (Chrome 32+, Safari 14+, Firefox 65+) support WebP natively.
  // On native (iOS/Android), RN Image supports WebP since RN 0.60 — keep PNG
  // to avoid any potential decode edge-cases on older OS versions.
  dark: Platform.OS === "web"
    ? require("@/assets/images/logo.webp")
    : require("@/assets/images/logo.png"),
  // White silhouette stays PNG — needs lossless alpha channel.
  white: require("@/assets/images/logo-white.png"),
  icon: require("@/assets/images/logo-icon-1024.png"),
};

const SIZES: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 96, height: 28 },
  md: { width: 110, height: 36 },
  lg: { width: 130, height: 42 },
  xl: { width: 180, height: 60 },
};

const ICON_SIZES: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 28, height: 28 },
  md: { width: 36, height: 36 },
  lg: { width: 48, height: 48 },
  xl: { width: 72, height: 72 },
};

export default function Logo({ variant = "dark", size = "md", style }: LogoProps) {
  const dim = variant === "icon" ? ICON_SIZES[size] : SIZES[size];
  return (
    <Image
      source={SOURCES[variant]}
      style={[dim, style]}
      resizeMode="contain"
      accessibilityLabel="P2PTax"
    />
  );
}
