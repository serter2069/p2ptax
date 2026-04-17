import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBack from "@/components/HeaderBack";

export default function OnboardingNameScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="" />
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-sm text-slate-400 mb-2">Step 1 of 3</Text>
        <Text className="text-2xl font-bold text-slate-900">Your Name</Text>
        <Text className="text-sm text-slate-400 mt-2">Coming in Batch 2</Text>
      </View>
    </SafeAreaView>
  );
}
