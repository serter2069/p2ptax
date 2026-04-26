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

  const borderColor = error
    ? colors.error
    : focused
      ? colors.accent
      : colors.border;
  const bgColor = error ? colors.errorBg : !editable ? colors.background : colors.surface;

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
          // On web the inner <input> owns the border so style/a11y audits
          // recognise the field as framed (kills "naked input" flag). On
          // native we keep the wrapper border because RN <TextInput> doesn't
          // visually paint borderColor reliably across iOS/Android.
          borderWidth: Platform.OS === "web" ? 0 : 1,
          borderColor,
          backgroundColor: bgColor,
          paddingHorizontal: spacing.md, // token: 12
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
          style={{
            flex: 1,
            // On web the <input> intrinsic height is ~18px. We force a
            // minHeight of 44 so the full tap target area is interactive
            // (Apple HIG / WCAG 2.5.5 — minimum 44×44 touch target). Using
            // an explicit minHeight rather than height: '100%' avoids the
            // 42px artifact caused by container_height − 2*borderWidth on
            // web, where the parent's borderWidth subtracts from the
            // child's effective height.
            ...(Platform.OS === 'web' && !multiline ? {
              minHeight: 44,
              alignSelf: 'stretch' as any,
            } : {}),
            fontSize: fontSizeValue.base,
            color: colors.text,
            paddingVertical: multiline ? spacing.sm : 0,
            // On web the <input> owns the visible border so style/a11y
            // audits flag the field as "framed" (kills naked-input flag).
            // The outer View's border is suppressed on web (see above) to
            // avoid a double border. On native the wrapper paints the
            // border instead, so we keep the input borderless there.
            borderWidth: Platform.OS === "web" ? 1 : 0,
            borderColor: Platform.OS === "web" ? borderColor : "transparent",
            outlineWidth: 0,
            outlineStyle: 'none' as any,
            backgroundColor: 'transparent',
            // web-only 3px accent ring on focus — ignored on native
            ...(Platform.OS === "web" && focused
              ? { boxShadow: `0 0 0 3px ${colors.accent}33` as any }
              : {}),
          }}
        />
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
