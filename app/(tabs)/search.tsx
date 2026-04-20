import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/lib/theme";

const RECENT_SEARCHES = [
  "iPhone 15",
  "Apartment Tbilisi",
  "Toyota",
  "MacBook",
];

const POPULAR_CATEGORIES = [
  { id: "1", name: "Electronics", count: "12,453 ads", icon: "laptop" as const, color: "#eff6ff" },
  { id: "2", name: "Vehicles", count: "8,291 ads", icon: "car" as const, color: "#fef2f2" },
  { id: "3", name: "Real Estate", count: "5,872 ads", icon: "building" as const, color: "#f0fdf4" },
  { id: "4", name: "Fashion", count: "9,104 ads", icon: "shopping-bag" as const, color: "#fefce8" },
  { id: "5", name: "Sports & Outdoors", count: "3,455 ads", icon: "futbol-o" as const, color: "#fdf4ff" },
  { id: "6", name: "Home & Garden", count: "6,789 ads", icon: "home" as const, color: "#f0fdfa" },
];

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-gray-900">Search</Text>
        </View>

        {/* Search Input */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center h-12 rounded-xl bg-gray-100 px-4">
            <FontAwesome name="search" size={16} color={colors.textSecondary} />
            <TextInput
              accessibilityLabel="Поиск"
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="What are you looking for?"
              placeholderTextColor={colors.textSecondary}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Фильтры" className="ml-2 w-11 h-11 rounded-lg bg-blue-600 items-center justify-center">
              <FontAwesome name="sliders" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Recent Searches */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-900">Recent Searches</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Очистить историю поиска">
              <Text className="text-sm text-blue-600">Clear</Text>
            </Pressable>
          </View>
          {RECENT_SEARCHES.map((search, index) => (
            <Pressable
              accessibilityRole="button"
              key={index}
              accessibilityLabel={search}
              className="flex-row items-center py-3 border-b border-gray-100"
            >
              <FontAwesome name="clock-o" size={16} color={colors.textSecondary} />
              <Text className="flex-1 ml-3 text-base text-gray-700">{search}</Text>
              <FontAwesome name="arrow-right" size={12} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* Popular Categories */}
        <View className="px-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Popular Categories</Text>
          {POPULAR_CATEGORIES.map((cat) => (
            <Pressable
              accessibilityRole="button"
              key={cat.id}
              accessibilityLabel={cat.name}
              className="flex-row items-center p-3 rounded-xl mb-2"
              style={{ backgroundColor: cat.color }}
            >
              <View className="w-10 h-10 rounded-lg bg-white items-center justify-center">
                <FontAwesome name={cat.icon} size={18} color="#4b5563" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-gray-900">{cat.name}</Text>
                <Text className="text-xs text-gray-500">{cat.count}</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
