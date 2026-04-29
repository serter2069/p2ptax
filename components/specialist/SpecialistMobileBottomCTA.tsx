import { View, Text, Pressable } from "react-native";
import { Bookmark, MessageSquare } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface SpecialistMobileBottomCTAProps {
  savedBookmark: boolean;
  onWritePress: () => void;
  onSavePress: () => void;
}

/**
 * Mobile-only sticky bottom action bar: Написать + Bookmark.
 */
export default function SpecialistMobileBottomCTA({
  savedBookmark,
  onWritePress,
  onSavePress,
}: SpecialistMobileBottomCTAProps) {
  return (
    <View
      className="border-t border-border"
      style={{
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 6,
      }}
    >
      <View className="flex-row" style={{ gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Написать"
          onPress={onWritePress}
          className="flex-1 items-center justify-center rounded-xl flex-row"
          style={{ backgroundColor: colors.primary, height: 52, gap: 8 }}
        >
          <MessageSquare size={18} color="white" />
          <Text className="text-white font-semibold text-base">Написать</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={savedBookmark ? "Убрать из сохранённых" : "Сохранить"}
          onPress={onSavePress}
          className="items-center justify-center rounded-xl border border-border"
          style={{ backgroundColor: colors.surface, height: 52, width: 52 }}
        >
          <Bookmark
            size={18}
            color={savedBookmark ? colors.primary : colors.textSecondary}
            fill={savedBookmark ? colors.primary : "none"}
          />
        </Pressable>
      </View>
    </View>
  );
}
