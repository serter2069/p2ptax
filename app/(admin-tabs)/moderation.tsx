import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { colors, overlay } from "@/lib/theme";

export default function AdminModeration() {
  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      {/* Accent hero header */}
      <View className="bg-accent px-4 pt-4 pb-4">
        <Text className="text-2xl font-bold text-white">Модерация</Text>
        <Text
          className="text-sm mt-1"
          style={{ color: overlay.white75 }}
        >
          Управление контентом платформы
        </Text>
      </View>

      {/* Section separator */}
      <View
        className="bg-white border-b border-border px-4 py-3"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
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
