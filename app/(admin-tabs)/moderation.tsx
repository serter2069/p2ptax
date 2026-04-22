import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { colors } from "@/lib/theme";

export default function AdminModeration() {
  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      {/* Header */}
      <View className="bg-accent px-4 h-14 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-white">Модерация</Text>
      </View>

      {/* Section separator */}
      <View className="bg-white border-b border-border px-4 py-3">
        <Text className="text-sm text-text-mute">
          Контент, требующий проверки перед публикацией
        </Text>
      </View>

      <ResponsiveContainer>
        <View className="flex-1">
          <EmptyState
            icon={CheckCircle}
            title="Всё чисто"
            subtitle="Нет элементов, требующих модерации"
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
