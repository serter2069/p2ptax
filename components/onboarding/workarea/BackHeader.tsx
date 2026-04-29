import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface Props {
  fromSettings: boolean;
  onBack: () => void;
}

export default function BackHeader({ fromSettings, onBack }: Props) {
  const label = fromSettings ? "Назад к настройкам" : "Назад";
  return (
    <View className="px-6 pt-4 pb-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onBack}
        className="flex-row items-center"
        style={{ minHeight: 44 }}
      >
        <ChevronLeft size={20} color={colors.text} />
        <Text className="text-text-base ml-1">{label}</Text>
      </Pressable>
    </View>
  );
}
