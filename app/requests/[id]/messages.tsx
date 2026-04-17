import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBack from "@/components/HeaderBack";

export default function RequestMessages() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Сообщения" />
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold text-slate-900">Сообщения</Text>
        <Text className="text-sm text-slate-400 mt-2">Coming in Batch 4</Text>
      </View>
    </SafeAreaView>
  );
}
