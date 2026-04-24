import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";
import { colors } from "@/lib/theme";

/**
 * Tiny inline SVG icon set used by landing sections. Each icon uses a
 * two-tone "duotone" style: a soft filled shape (20% primary) behind
 * crisper primary strokes. Keeps the whole landing visually coherent
 * without shipping an icon-font dependency.
 */

type IconName =
  | "document-search"
  | "stamp"
  | "phone-clock"
  | "shield-check"
  | "clipboard"
  | "handshake"
  | "alert-triangle"
  | "clock";

interface DuotoneIconProps {
  name: IconName;
  size?: number;
  color?: string;
  softColor?: string;
}

export default function DuotoneIcon({
  name,
  size = 48,
  color = colors.primary,
  softColor = colors.accentSoft,
}: DuotoneIconProps) {
  const content = renderIcon(name, color, softColor);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      accessibilityRole="image"
    >
      {content}
    </Svg>
  );
}

function renderIcon(name: IconName, stroke: string, soft: string) {
  switch (name) {
    case "document-search":
      return (
        <G>
          <Rect x={8} y={6} width={24} height={30} rx={3} fill={soft} />
          <Path
            d="M12 14h14M12 20h14M12 26h10"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx={32} cy={32} r={7} fill={colors.white} stroke={stroke} strokeWidth={2.5} />
          <Path
            d="M37 37l5 5"
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </G>
      );
    case "stamp":
      return (
        <G>
          <Rect x={8} y={10} width={28} height={22} rx={3} fill={soft} />
          <Path
            d="M12 16h20M12 22h14M12 28h18"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx={36} cy={34} r={6} fill={colors.white} stroke={stroke} strokeWidth={2.5} />
          <Path
            d="M33 34l2 2 4-4"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      );
    case "phone-clock":
      return (
        <G>
          <Path
            d="M11 8h9l3 8-4 3a18 18 0 0 0 10 10l3-4 8 3v9a3 3 0 0 1-3 3A30 30 0 0 1 8 11a3 3 0 0 1 3-3z"
            fill={soft}
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Circle cx={36} cy={14} r={7} fill={colors.white} stroke={stroke} strokeWidth={2.5} />
          <Path
            d="M36 11v3l2 2"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
      );
    case "shield-check":
      return (
        <G>
          <Path
            d="M24 6l14 5v10c0 9-6 16-14 19-8-3-14-10-14-19V11l14-5z"
            fill={soft}
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M17 24l5 5 9-11"
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      );
    case "clipboard":
      return (
        <G>
          <Rect x={10} y={8} width={28} height={32} rx={3} fill={soft} />
          <Rect x={18} y={6} width={12} height={6} rx={2} fill={colors.white} stroke={stroke} strokeWidth={2} />
          <Path
            d="M16 20h16M16 26h16M16 32h10"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
      );
    case "handshake":
      return (
        <G>
          <Path
            d="M6 22l8-8 5 5 5-5 5 5 5-5 8 8v8l-13 10-10-7-13-3v-8z"
            fill={soft}
          />
          <Path
            d="M14 22l6 6M34 22l-6 6M24 19l-4 4 4 4M24 19l4 4-4 4"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      );
    case "alert-triangle":
      return (
        <G>
          <Path
            d="M24 6l20 34H4L24 6z"
            fill={soft}
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M24 18v10"
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Circle cx={24} cy={33} r={1.8} fill={stroke} />
        </G>
      );
    case "clock":
      return (
        <G>
          <Circle cx={24} cy={24} r={18} fill={soft} stroke={stroke} strokeWidth={2} />
          <Path
            d="M24 14v10l7 4"
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      );
  }
}
