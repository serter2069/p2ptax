import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from "react-native";
import { textStyle, TextVariant, colors } from "@/lib/theme";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /**
   * Token shortcut — use colour name instead of style.color.
   *   "default" → colors.text
   *   "muted"   → colors.textSecondary
   *   "dim"     → colors.textMuted
   *   "accent"  → colors.primary
   *   "danger"  → colors.danger
   *   "success" → colors.success
   */
  tone?: "default" | "muted" | "dim" | "accent" | "danger" | "success" | "white";
}

const TONE_COLOR: Record<NonNullable<TextProps["tone"]>, string> = {
  default: colors.text,
  muted: colors.textSecondary,
  dim: colors.textMuted,
  accent: colors.primary,
  danger: colors.danger,
  success: colors.success,
  white: colors.white,
};

/**
 * Typed Text component — applies typography scale from lib/theme.
 *
 * Wraps React Native's Text. Any `style` prop is merged AFTER the variant
 * so callers can override individual properties (e.g. color) without
 * losing the rest of the scale.
 *
 *   <Text variant="h1">Hero heading</Text>
 *   <Text variant="body" tone="muted">Description line</Text>
 *   <Text variant="caption" className="uppercase tracking-wider">Label</Text>
 */
export default function Text({
  variant,
  tone,
  style,
  ...rest
}: TextProps) {
  const base: StyleProp<TextStyle> = variant ? textStyle[variant] : undefined;
  const toneStyle: StyleProp<TextStyle> = tone ? { color: TONE_COLOR[tone] } : undefined;
  return <RNText {...rest} style={[base, toneStyle, style]} />;
}
