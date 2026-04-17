import { useState } from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../../lib/theme";

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
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
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.accent
      : '#e2e8f0';
  const bgColor = error ? '#fef2f2' : '#FFFFFF';

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: multiline ? undefined : 48,
          minHeight: multiline ? 96 : undefined,
          borderRadius: 12,
          borderWidth: 1,
          borderColor,
          backgroundColor: bgColor,
          paddingHorizontal: 12,
        }}
      >
        {icon && (
          <Feather
            name={icon}
            size={18}
            color="#94a3b8"
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.text,
            paddingVertical: multiline ? 12 : 0,
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
