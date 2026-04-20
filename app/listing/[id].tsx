import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/lib/theme";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView className="flex-1">
        {/* Image Placeholder */}
        <View className="h-72 bg-gray-100 items-center justify-center">
          <FontAwesome name="image" size={48} color={colors.textSecondary} />
          <Text className="text-sm text-gray-400 mt-2">Listing #{id}</Text>
        </View>

        <View className="px-4 pt-4 pb-8">
          {/* Title & Price */}
          <Text className="text-2xl font-bold text-gray-900">
            iPhone 15 Pro Max 256GB
          </Text>
          <Text className="text-2xl font-bold text-blue-600 mt-1">$899</Text>

          {/* Location & Time */}
          <View className="flex-row items-center mt-3">
            <FontAwesome name="map-marker" size={14} color={colors.textSecondary} />
            <Text className="text-sm text-gray-500 ml-1.5">Tbilisi, Georgia</Text>
            <Text className="text-sm text-gray-300 mx-2">|</Text>
            <FontAwesome name="clock-o" size={14} color={colors.textSecondary} />
            <Text className="text-sm text-gray-500 ml-1.5">2 hours ago</Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-100 my-4" />

          {/* Description */}
          <Text className="text-base font-semibold text-gray-900 mb-2">Description</Text>
          <Text className="text-base text-gray-600 leading-6">
            Brand new iPhone 15 Pro Max in Natural Titanium. 256GB storage.
            Bought last month, selling because I received two as gifts.
            Original box and all accessories included. Battery health 100%.
            No scratches or dents — used with case and screen protector since day one.
          </Text>

          {/* Divider */}
          <View className="h-px bg-gray-100 my-4" />

          {/* Seller */}
          <Text className="text-base font-semibold text-gray-900 mb-3">Seller</Text>
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
              <Text className="text-lg font-bold text-blue-600">A</Text>
            </View>
            <View className="ml-3">
              <Text className="text-base font-medium text-gray-900">Alex K.</Text>
              <View className="flex-row items-center mt-0.5">
                <FontAwesome name="star" size={12} color="#f59e0b" />
                <Text className="text-sm text-gray-500 ml-1">4.8 (15 reviews)</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row px-4 py-3 border-t border-gray-100 gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel="Написать продавцу" className="flex-1 h-12 rounded-xl bg-blue-600 items-center justify-center active:bg-blue-700">
          <Text className="text-white text-base font-semibold">Message Seller</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Добавить в избранное" className="w-12 h-12 rounded-xl border border-gray-200 items-center justify-center active:bg-gray-50">
          <FontAwesome name="heart-o" size={20} color="#6b7280" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
