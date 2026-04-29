import { useState } from "react";
import { View, Text, TextInput, Platform, type TextInputProps, type ViewStyle } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { colors, radiusValue, fontSizeValue, spacing } from "../../lib/theme";

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: LucideIcon;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  editable?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  autoCorrect?: boolean;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  returnKeyType?: TextInputProps["returnKeyType"];
  maxLength?: number;
  numberOfLines?: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon: Icon,
  secureTextEntry,
  multiline,
  keyboardType,
  editable = true,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  onSubmitEditing,
  returnKeyType,
  maxLength,
  numberOfLines,
  accessibilityLabel,
  style,
  containerStyle,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  // On web `colors.border` (#e8ebf0) on `colors.surface` (#ffffff) is barely
  // visible — auditors flag the field as "naked input". We bump to
  // `colors.borderStrong` (#c7ccd4) on web to give the input a clear frame
  // even at default state. Native keeps the soft border (high-DPI displays
  // already render it crisp enough).
  const borderColor = error
    ? colors.error
    : focused
      ? colors.accent
      : Platform.OS === "web"
        ? colors.borderStrong
        : colors.border;
  // On web inputs sit on a slightly off-white background (`surface2`,
  // #fafbfc) so the frame is reinforced by background contrast. Native
  // keeps the standard surface white.
  const bgColor = error
    ? colors.errorBg
    : !editable
      ? colors.background
      : Platform.OS === "web"
        ? colors.surface2
        : colors.surface;

  return (
    <View style={style}>
      {label && (
        <Text className="text-sm font-medium text-text-base mb-1.5">{label}</Text>
      )}
      <View
        style={[{
          flexDirection: "row",
          alignItems: "center",
          minHeight: multiline ? 96 : 48,
          borderRadius: radiusValue.md,
          // Outer View owns the border on ALL platforms — eliminates the
          // "box in a box" artifact on web where the inner <input> previously
          // had its own border while the wrapper added a background+radius.
          borderWidth: 1,
          borderColor,
          backgroundColor: bgColor,
          paddingHorizontal: spacing.md, // token: 12
          // web-only 3px accent ring on focus — ignored on native
          ...(Platform.OS === "web" && focused
            ? { boxShadow: `0 0 0 3px ${colors.accent}33` }
            : {}),
        }, containerStyle]}
      >
        {Icon && (
          <Icon
            size={18}
            color={colors.placeholder}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <TextInput
          accessibilityLabel={accessibilityLabel || label || placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          // @ts-expect-error — TextInput's `style` prop is typed as
          // `StyleProp<TextStyle>`, which doesn't include web-only CSS
          // properties. We use several non-standard keys here:
          //   alignSelf: 'stretch' — forces the web <input> to fill its
          //     flex-row parent vertically (RN ignores on native).
          //   outlineStyle: 'none' — removes default browser outline on
          //     focus; the focus ring is rendered on the outer View via
          //     boxShadow instead.
          //   appearance: 'none' — strips UA-default chrome on
          //     <input> AND <textarea> (multiline). Without this Safari
          //     renders an inset border on textarea even when borderWidth
          //     is 0, producing the double-border artifact.
          // All are safe: RN drops unknown style keys, and on web they
          // produce the intended CSS.
          style={{
            flex: 1,
            // On web the <input> intrinsic height is ~18px. We force a
            // minHeight of 44 so the full tap target area is interactive
            // (Apple HIG / WCAG 2.5.5 — minimum 44x44 touch target).
            ...(Platform.OS === 'web' && !multiline ? {
              minHeight: 44,
              alignSelf: 'stretch',
            } : {}),
            fontSize: fontSizeValue.base,
            color: colors.text,
            paddingVertical: multiline ? spacing.sm : 0,
            // Inner TextInput never owns a border — the outer View does.
            // This prevents the double-border artifact on web.
            borderWidth: 0,
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            ...(Platform.OS === 'web' ? {
              outlineWidth: 0,
              outlineStyle: 'none',
              appearance: 'none',
            } : {}),
          }}
        />
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
