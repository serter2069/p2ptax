import { View, Text, Pressable } from "react-native";
import { Bookmark, MessageSquare } from "lucide-react-native";
import { colors, textStyle } from "@/lib/theme";

interface SpecialistContactCTAProps {
  firstName: string | null;
  isAuthenticated: boolean;
  isSpecialist: boolean;
  savedBookmark: boolean;
  onWritePress: () => void;
  onSavePress: () => void;
}

/**
 * Sticky sidebar CTA on desktop. "Написать <name>" + bookmark toggle.
 */
export default function SpecialistContactCTA({
  firstName,
  isAuthenticated,
  isSpecialist,
  savedBookmark,
  onWritePress,
  onSavePress,
}: SpecialistContactCTAProps) {
  return (
    <View
      className="rounded-2xl border border-border p-5"
      style={{
        backgroundColor: colors.surface,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <Text style={{ ...textStyle.h3, color: colors.text, marginBottom: 8 }}>
        Написать {firstName ?? "специалисту"}
      </Text>
      <Text
        className="text-sm leading-5 mb-2"
        style={{ color: colors.textSecondary }}
      >
        Ваш запрос будет прочитана в течение рабочего дня.
      </Text>
      <View
        className="flex-row items-center px-2.5 py-1.5 rounded-md self-start mb-4"
        style={{ backgroundColor: colors.greenSoft, gap: 6 }}
      >
        <View
          className="rounded-full"
          style={{ width: 6, height: 6, backgroundColor: colors.success }}
        />
        <Text
          className="text-xs font-semibold"
          style={{ color: colors.success }}
        >
          Первое сообщение — бесплатно
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Написать"
        onPress={onWritePress}
        className="items-center justify-center rounded-xl flex-row"
        style={{
          backgroundColor: colors.primary,
          height: 56,
          gap: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <MessageSquare size={18} color="white" />
        <Text className="text-white font-semibold text-base">Написать</Text>
      </Pressable>

      {isAuthenticated && !isSpecialist && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={savedBookmark ? "Убрать из сохранённых" : "Сохранить"}
          onPress={onSavePress}
          className="items-center justify-center rounded-xl flex-row mt-2 border border-border"
          style={{ backgroundColor: colors.surface, height: 44, gap: 6 }}
        >
          <Bookmark
            size={14}
            color={savedBookmark ? colors.primary : colors.textSecondary}
            fill={savedBookmark ? colors.primary : "none"}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: savedBookmark ? colors.primary : colors.textSecondary }}
          >
            {savedBookmark ? "Сохранено" : "Сохранить"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
