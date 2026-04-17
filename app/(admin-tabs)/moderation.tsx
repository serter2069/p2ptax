import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHome from "@/components/HeaderHome";
import EmptyState from "@/components/EmptyState";

export default function AdminModeration() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome />
      <View className="flex-1">
        <EmptyState
          icon="check-circle"
          title="Всё чисто"
          subtitle="Нет элементов, требующих модерации"
        />
      </View>
    </SafeAreaView>
  );
}
