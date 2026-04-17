import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHome from "@/components/HeaderHome";

export default function SpecialistThreads() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold text-slate-900">My Threads</Text>
        <Text className="text-sm text-slate-400 mt-2">Coming in Batch 1</Text>
      </View>
    </SafeAreaView>
  );
}
