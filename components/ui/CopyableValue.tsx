import { useState, useCallback } from "react";
import { Pressable, Text, View, Platform } from "react-native";
import { Copy, Check } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface CopyableValueProps {
  value: string;
  /** Что копировать в буфер. По умолчанию = value. */
  copyValue?: string;
  /** Иконка-префикс (например, ✉ или 📞). */
  icon?: React.ReactNode;
  /** Подсветка цветом (для email/phone — primary). */
  primaryColor?: boolean;
  /** Урезать значение в одну строку. */
  oneLine?: boolean;
}

/**
 * Текст с одношаговым копированием в буфер при клике. Подходит
 * для email и телефонов: пользователь жмёт, видит «Скопировано»
 * на 1.5 секунды.
 */
export default function CopyableValue({
  value,
  copyValue,
  icon,
  primaryColor,
  oneLine,
}: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (Platform.OS !== "web" || typeof navigator === "undefined") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(copyValue ?? value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* clipboard unavailable */
    }
  }, [value, copyValue]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Скопировать ${value}`}
      onPress={handleCopy}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        pressed && { opacity: 0.6 },
      ]}
    >
      {icon}
      <Text
        style={{
          fontSize: 13,
          color: primaryColor ? colors.primary : colors.text,
          fontWeight: primaryColor ? "600" : "400",
          flexShrink: 1,
        }}
        numberOfLines={oneLine ? 1 : undefined}
      >
        {value}
      </Text>
      {copied ? (
        <Check size={13} color={colors.success} />
      ) : (
        <Copy size={12} color={colors.textMuted} />
      )}
      {copied && (
        <Text style={{ fontSize: 11, color: colors.success, fontWeight: "600" }}>
          Скопировано
        </Text>
      )}
    </Pressable>
  );
}
