import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/EmptyState";

export default function AdminModeration() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome />
      <ResponsiveContainer>
        <View className="flex-1">
          <EmptyState
            icon="check-circle"
            title="Всё чисто"
            subtitle="Нет элементов, требующих модерации"
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
