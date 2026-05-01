import { useState } from "react";
import { View, Text, TextInput, Platform, type TextInputProps, type ViewStyle } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { colors, inputColors, spacing } from "../../lib/theme";

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
  /** "line" = bottom-border only (default). "bordered" = full border, radius 8, padding 12/14. */
  variant?: "line" | "bordered";
  /** Called when TextInput content size changes (multiline auto-expand). */
  onContentSizeChange?: TextInputProps["onContentSizeChange"];
  /** Forwarded to TextInput.onBlur. The internal focus state is updated regardless. */
  onBlur?: TextInputProps["onBlur"];
  /** Forwarded to TextInput.onFocus. The internal focus state is updated regardless. */
  onFocus?: TextInputProps["onFocus"];
}

// Design tokens for the "bordered" variant — imported from lib/theme (spec: #1589).
const INPUT_BORDER_DEFAULT = inputColors.borderDefault;
const INPUT_BORDER_FOCUS   = inputColors.borderFocus;
const INPUT_BORDER_ERROR   = inputColors.borderError;
const INPUT_PLACEHOLDER    = inputColors.placeholder;
const INPUT_TEXT           = inputColors.text;

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
  variant = "line",
  onContentSizeChange,
  onBlur,
  onFocus,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? (variant === "bordered" ? INPUT_BORDER_ERROR : colors.error)
    : focused
      ? (variant === "bordered" ? INPUT_BORDER_FOCUS : colors.accent)
      : (variant === "bordered" ? INPUT_BORDER_DEFAULT : colors.borderStrong);

  // Unified rhythm (#1716): single-line inputs are 40px tall (h-10) across the
  // app — search bars, form fields, dropdowns. This matches the search-bar
  // height already used by CityFnsCascade and the filter chips, so one
  // <Input>'s height never differs from another input on a different page.
  // Multiline keeps minHeight 80 (≈4 rows) so descriptions feel like a
  // textarea, not a single-line that wraps.
  const wrapperStyle: ViewStyle = variant === "bordered"
    ? {
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        minHeight: multiline ? 80 : 40,
        width: "100%",
        borderWidth: 1,
        borderColor,
        borderRadius: 8,
        backgroundColor: editable ? inputColors.bgEditable : inputColors.bgReadOnly,
        paddingHorizontal: 12,
        paddingVertical: multiline ? 8 : 0,
      }
    : {
        flexDirection: "row",
        alignItems: "center",
        minHeight: multiline ? 80 : 40,
        // Line-style: no top/left/right border, no radius, transparent bg.
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: focused ? 2 : 1,
        borderBottomColor: borderColor,
        backgroundColor: "transparent",
        paddingHorizontal: 0,
        paddingBottom: 2,
      };

  return (
    <View style={[{ width: "100%" }, style]}>
      {label && (
        <Text className="text-sm font-medium text-text-base mb-1.5">{label}</Text>
      )}
      <View
        style={[wrapperStyle, containerStyle]}
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
          placeholderTextColor={variant === "bordered" ? INPUT_PLACEHOLDER : colors.textSecondary}
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
          onContentSizeChange={onContentSizeChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          // data-line-input: web-only attribute that tells AppShell's global
          // focus CSS to skip box-shadow for this input. The wrapper View
          // already renders a border focus indicator, so the global
          // ring would produce a double-border artifact.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(Platform.OS === "web" ? { "data-line-input": true } as any : {})}
          style={{
            flex: 1,
            // On web the <input> intrinsic height is ~18px. Stretch to fill the
            // 40px wrapper so the full surface is interactive. (Native already
            // gets a tall touch target via the wrapper minHeight.)
            ...(Platform.OS === "web" && !multiline ? {
              minHeight: 40,
              alignSelf: "stretch",
            } : {}),
            fontSize: 14,
            color: variant === "bordered" ? INPUT_TEXT : colors.text,
            lineHeight: multiline ? 20 : undefined,
            // On web multiline, explicit paddingTop ensures the cursor renders
            // at the right vertical position when wrapper uses flex-start.
            paddingTop: multiline ? spacing.sm : 0,
            paddingBottom: multiline ? spacing.sm : 0,
            // Inner TextInput never owns a border — the outer View does.
            borderWidth: 0,
            borderColor: "transparent",
            backgroundColor: "transparent",
            paddingHorizontal: 0,
            ...(Platform.OS === "web" ? {
              outlineWidth: 0,
              outlineStyle: "none",
              appearance: "none",
              // Disable manual resize handle on multiline web textarea.
              ...(multiline ? { resize: "none" } : {}),
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
