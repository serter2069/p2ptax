import { useState } from "react";
import { View, Text, TextInput, type TextInputProps, type ViewStyle } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "../../lib/theme";

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
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
  icon,
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
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <View
        style={[{
          flexDirection: "row",
          alignItems: "center",
          height: multiline ? undefined : 48,
          minHeight: multiline ? 96 : undefined,
          borderRadius: 12,
          borderWidth: 1,
          borderColor,
          backgroundColor: bgColor,
          paddingHorizontal: 12,
        }, containerStyle]}
      >
        {icon && (
          <FontAwesome
            name={icon}
            size={18}
            color={colors.placeholder}
            style={{ marginRight: 8 }}
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
            fontSize: 16,
            color: colors.text,
            paddingVertical: multiline ? 8 : 0,
            borderWidth: 0,
            outlineWidth: 0,
            outlineStyle: 'none' as any,
            backgroundColor: 'transparent',
          }}
        />
      </View>
      {error && (
        <Text className="text-xs text-red-600 mt-1">{error}</Text>
      )}
    </View>
  );
}
