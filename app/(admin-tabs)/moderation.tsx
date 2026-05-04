import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import DesktopScreen from "@/components/layout/DesktopScreen";
import { useNoIndex } from "@/components/seo/NoIndex";

export default function AdminModeration() {
  useNoIndex();
  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <DesktopScreen
        title="Модерация"
        subtitle="Контент, требующий проверки перед публикацией"
      >
        <View className="flex-1">
          <EmptyState
            icon={CheckCircle}
            title="Всё чисто"
            subtitle="Нет элементов, требующих модерации"
          />
        </View>
      </DesktopScreen>
    </SafeAreaView>
  );
}
