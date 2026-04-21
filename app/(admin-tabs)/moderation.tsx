import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle } from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminModeration() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome />
      <View className="flex-1 px-4 md:max-w-[520px] md:self-center md:px-0">
        <View className="flex-1">
          <EmptyState
            icon={CheckCircle}
            title="Всё чисто"
            subtitle="Нет элементов, требующих модерации"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
