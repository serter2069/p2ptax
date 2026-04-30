import { View, Text, TextInput, Platform } from "react-native";
import { colors, fontSizeValue } from "@/lib/theme";

interface MessageComposerProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Hard cap for character count. */
  maxLength: number;
  /** Optional minimum length used only for the inline hint. */
  minLength?: number;
  /** Disable input + counter visual emphasis. */
  disabled?: boolean;
  /** External error string to surface beneath the textarea. */
  error?: string | null;
  /** Optional label rendered above the textarea. */
  label?: string;
}

/**
 * Multiline message composer with character counter and min-length hint.
 * Visual styling lives on the wrapper View to dodge NativeWind's
 * double-input artifact on web.
 */
export default function MessageComposer({
  value,
  onChange,
  placeholder,
  maxLength,
  minLength,
  disabled = false,
  error,
  label = "Ваше сообщение",
}: MessageComposerProps) {
  return (
    <>
      <Text className="text-sm font-semibold text-text-base mb-2">{label}</Text>
      {/* Outer View — line-style (bottom border only). Prevents double-input on web. */}
      <View
        style={{
          minHeight: 140,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: disabled ? colors.border : colors.borderStrong,
          backgroundColor: "transparent",
          opacity: disabled ? 0.5 : 1,
          paddingBottom: 2,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          value={value}
          maxLength={maxLength}
          onChangeText={(t) => {
            if (t.length <= maxLength) onChange(t);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline
          editable={!disabled}
          style={{
            flex: 1,
            paddingHorizontal: 0,
            paddingVertical: 8,
            fontSize: fontSizeValue.base,
            color: colors.text,
            textAlignVertical: "top",
            borderWidth: 0,
            backgroundColor: "transparent",
            ...(Platform.OS === "web"
              ? {
                  borderColor: "transparent",
                  outlineStyle: "none" as never,
                  outlineWidth: 0,
                  appearance: "none" as never,
                }
              : {}),
          }}
        />
      </View>

      <View className="flex-row justify-between items-center mt-1 mb-1">
        {minLength !== undefined && value.length > 0 && value.length < minLength ? (
          <Text className="text-xs text-danger">Минимум {minLength} символов</Text>
        ) : (
          <View />
        )}
        <Text
          className={`text-xs ml-auto ${
            value.length >= maxLength ? "text-danger" : "text-text-mute"
          }`}
        >
          {value.length}/{maxLength}
        </Text>
      </View>

      {error ? <Text className="text-xs text-danger mt-1">{error}</Text> : null}
    </>
  );
}
