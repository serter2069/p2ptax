import { useState } from "react";
import { View, Text, TextInput, Platform, type TextInputProps, type ViewStyle } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { colors, fontSizeValue, spacing } from "../../lib/theme";

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

  // Line-style: only bottom border changes color on focus/error.
  const borderColor = error
    ? colors.error
    : focused
      ? colors.accent
      : colors.borderStrong;

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
          // Line-style: no top/left/right border, no radius, transparent bg.
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: focused ? 2 : 1,
          borderBottomColor: borderColor,
          backgroundColor: "transparent",
          paddingHorizontal: 0,
          paddingBottom: 2,
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
