import { View, Text } from "react-native";
import Input from "@/components/ui/Input";

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
      <Input
        label={label}
        accessibilityLabel={label}
        value={value}
        maxLength={maxLength}
        onChangeText={(t) => {
          if (t.length <= maxLength) onChange(t);
        }}
        placeholder={placeholder}
        multiline
        editable={!disabled}
        containerStyle={{ minHeight: 140, opacity: disabled ? 0.5 : 1 }}
      />

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
