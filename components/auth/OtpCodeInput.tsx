import { View, TextInput, Platform } from "react-native";
import { useRef, useEffect } from "react";
import { colors, radiusValue } from "@/lib/theme";

interface OtpCodeInputProps {
  /** Current 6-character code (may be padded with empty slots). */
  code: string;
  /** Fired with the next 6-char string (empty slots = ""). */
  onChange: (next: string) => void;
  /** Fired once when the user fills all 6 digits (autosubmit hint). */
  onSubmit?: (code: string) => void;
  /** Render error styling on the boxes. */
  error?: boolean;
  /** Disable inputs (e.g. during verification). */
  disabled?: boolean;
  /** Length of the code. Default 6. */
  length?: number;
}

/**
 * 6-box OTP code input with auto-focus, paste support and Backspace navigation.
 * Visual styling lives on the outer View to avoid the NativeWind double-input
 * artifact on web (className wraps TextInput in an extra div).
 */
export default function OtpCodeInput({
  code,
  onChange,
  onSubmit,
  error = false,
  disabled = false,
  length = 6,
}: OtpCodeInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Normalise the controlled value to an array of `length` slots.
  const digits = Array.from({ length }, (_, i) => code[i] ?? "");

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const emit = (next: string[]) => {
    onChange(next.join(""));
  };

  const handleDigitChange = (index: number, value: string) => {
    // Paste: split into digits and fill from current position.
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, length);
      const newDigits = Array.from({ length }, (_, i) => pasted[i] ?? "");
      emit(newDigits);
      const lastIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[lastIdx]?.focus();
      if (pasted.length === length) {
        onSubmit?.(newDigits.join(""));
      }
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    emit(newDigits);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      onSubmit?.(newDigits.join(""));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      emit(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row justify-center gap-2 mb-4">
      {digits.map((digit, i) => (
        // Outer View owns border/bg — prevents double-input on web
        // (NativeWind wraps TextInput in extra div when className is present;
        // keeping className off TextInput and visual styling on parent View
        // avoids the double-box artifact).
        <View
          key={i}
          style={{
            width: 48,
            height: 56,
            borderRadius: radiusValue.md,
            borderWidth: error ? 2 : digit ? 2 : 1.5,
            borderColor: error
              ? colors.error
              : digit
                ? colors.accent
                : colors.border,
            backgroundColor: error
              ? colors.errorBg
              : digit
                ? colors.accentSoft
                : colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextInput
            accessibilityLabel={`Цифра ${i + 1} кода подтверждения`}
            ref={(ref) => {
              inputRefs.current[i] = ref;
            }}
            // @ts-expect-error — outlineStyle/appearance are web-only CSS; RN drops unknown style keys safely
            style={{
              width: 48,
              height: 56,
              textAlign: "center",
              fontSize: 24,
              fontWeight: "700",
              color: error ? colors.error : colors.text,
              borderWidth: 0,
              backgroundColor: "transparent",
              ...(Platform.OS === "web"
                ? {
                    borderColor: "transparent",
                    outlineStyle: "none",
                    outlineWidth: 0,
                    appearance: "none",
                  }
                : {}),
            }}
            value={digit}
            onChangeText={(v) => handleDigitChange(i, v)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={length}
            editable={!disabled}
            selectTextOnFocus
          />
        </View>
      ))}
    </View>
  );
}
