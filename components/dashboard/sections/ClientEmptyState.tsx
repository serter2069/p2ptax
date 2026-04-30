import { View, Text, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { colors, spacing } from "@/lib/theme";

interface Props {
  onCreate: () => void;
}

export default function ClientEmptyState({ onCreate }: Props) {
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
          Создайте первый запрос
        </Text>
        <Text
          className="text-text-mute"
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          Опишите вашу налоговую ситуацию — специалисты в вашем регионе откликнутся в течение 24 часов
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Создать запрос"
        onPress={onCreate}
        className="rounded-xl flex-row items-center justify-center"
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 14,
          paddingHorizontal: 20,
          gap: 8,
        }}
      >
        <Plus size={18} color={colors.white} />
        <Text className="font-bold text-white" style={{ fontSize: 15 }}>
          Создать запрос
        </Text>
      </Pressable>
    </View>
  );
}
