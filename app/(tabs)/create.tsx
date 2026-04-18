import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/lib/theme";

export default function CreateScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-gray-900">Create Listing</Text>
          <Text className="text-sm text-gray-500 mt-1">Step 1 of 3 — Photos</Text>
        </View>

        {/* Progress Bar */}
        <View className="px-4 mb-6">
          <View className="h-1.5 rounded-full bg-gray-100">
            <View className="h-1.5 rounded-full bg-blue-600 w-1/3" />
          </View>
        </View>

        {/* Photo Grid */}
        <View className="px-4 mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Add photos
          </Text>
          <Text className="text-sm text-gray-500 mb-4">
            Add up to 10 photos. First photo will be the cover.
          </Text>

          <View className="flex-row flex-wrap">
            {/* Add Photo Button */}
            <Pressable accessibilityLabel="Добавить фото" className="w-[31%] aspect-square m-[1%] rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 items-center justify-center">
              <FontAwesome name="camera" size={24} color="#3b82f6" />
              <Text className="text-xs text-blue-600 mt-1 font-medium">Add photo</Text>
            </Pressable>

            {/* Placeholder slots */}
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                className="w-[31%] aspect-square m-[1%] rounded-xl bg-gray-100 items-center justify-center"
              >
                <FontAwesome name="image" size={20} color={colors.textSecondary} />
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View className="mx-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <View className="flex-row items-center mb-2">
            <FontAwesome name="lightbulb-o" size={16} color="#d97706" />
            <Text className="text-sm font-semibold text-amber-800 ml-2">Tips for great photos</Text>
          </View>
          <Text className="text-sm text-amber-700 leading-5">
            Use natural light. Show item from multiple angles. Include close-ups of details and any defects.
          </Text>
        </View>

        {/* Next Button */}
        <View className="px-4 mt-8">
          <Pressable accessibilityLabel="Далее: детали" className="h-14 rounded-xl bg-blue-600 items-center justify-center active:bg-blue-700">
            <Text className="text-white text-base font-semibold">Next: Details</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
