import { View, Text, Pressable } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { colors, spacing } from "@/lib/theme";

interface Props {
  onBrowse: () => void;
}

export default function SpecialistEmptyState({ onBrowse }: Props) {
  return (
    <View
      className="bg-white rounded-2xl"
      style={{
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 16,
      }}
    >
      <View style={{ gap: 6 }}>
        <Text
          className="text-text-base font-extrabold"
          style={{ fontSize: 20 }}
        >
          Найдите клиентов в вашем регионе
        </Text>
        <Text
          className="text-text-mute"
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          Просмотрите открытые запросы от клиентов и начните диалог
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Смотреть запросы"
        onPress={onBrowse}
        className="rounded-xl flex-row items-center justify-center"
        style={{
          backgroundColor: colors.success,
          paddingVertical: 14,
          paddingHorizontal: 20,
          gap: 8,
        }}
      >
        <ArrowRight size={18} color={colors.white} />
        <Text className="font-bold text-white" style={{ fontSize: 15 }}>
          Смотреть запросы
        </Text>
      </Pressable>
    </View>
  );
}
