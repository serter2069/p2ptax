import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search, SlidersHorizontal, Clock, ArrowRight, ChevronRight,
  Laptop, Car, Building2, ShoppingBag, Dumbbell, Home, type LucideIcon
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/ui/EmptyState";

const RECENT_SEARCHES = [
  "iPhone 15",
  "Apartment Tbilisi",
  "Toyota",
  "MacBook",
];

const POPULAR_CATEGORIES: { id: string; name: string; count: string; Icon: LucideIcon; color: string }[] = [
  { id: "1", name: "Electronics", count: "12,453 ads", Icon: Laptop, color: colors.accentSoft },
  { id: "2", name: "Vehicles", count: "8,291 ads", Icon: Car, color: colors.dangerSoft },
  { id: "3", name: "Real Estate", count: "5,872 ads", Icon: Building2, color: colors.limeSoft },
  { id: "4", name: "Fashion", count: "9,104 ads", Icon: ShoppingBag, color: colors.yellowSoft },
  { id: "5", name: "Sports & Outdoors", count: "3,455 ads", Icon: Home, color: colors.pinkSoft },
  { id: "6", name: "Home & Garden", count: "6,789 ads", Icon: Home, color: colors.cyanSoft },
];

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ResponsiveContainer>
          {/* Header */}
          <View className="pt-2 pb-3">
            <Text className="text-2xl font-bold text-gray-900">Search</Text>
          </View>

          {/* Search Input */}
          <View className="mb-6">
            <View className="flex-row items-center h-12 rounded-xl bg-gray-100 px-4">
              <Search size={16} color={colors.textSecondary} />
              <TextInput
                accessibilityLabel="Поиск"
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="What are you looking for?"
                placeholderTextColor={colors.textSecondary}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Фильтры" className="ml-2 w-11 h-11 rounded-lg bg-blue-600 items-center justify-center">
                <SlidersHorizontal size={16} color={colors.surface} />
              </Pressable>
            </View>
          </View>

          {/* Recent Searches */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-gray-900">Recent Searches</Text>
              {RECENT_SEARCHES.length > 0 && (
                <Pressable accessibilityRole="button" accessibilityLabel="Очистить историю поиска">
                  <Text className="text-sm text-blue-600">Clear</Text>
                </Pressable>
              )}
            </View>
            {RECENT_SEARCHES.length === 0 ? (
              <EmptyState title="Нет недавних поисков" subtitle="Ваши поисковые запросы появятся здесь" />
            ) : (
              RECENT_SEARCHES.map((search, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={index}
                  accessibilityLabel={search}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  <Clock size={16} color={colors.textSecondary} />
                  <Text className="flex-1 ml-3 text-base text-gray-700">{search}</Text>
                  <ArrowRight size={12} color={colors.textSecondary} />
                </Pressable>
              ))
            )}
          </View>

          {/* Popular Categories */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-3">Popular Categories</Text>
            <View className={isDesktop ? "flex-row flex-wrap gap-2" : undefined}>
              {POPULAR_CATEGORIES.map((cat) => (
                <Pressable
                  accessibilityRole="button"
                  key={cat.id}
                  accessibilityLabel={cat.name}
                  className="flex-row items-center p-3 rounded-xl mb-2"
                  style={[{ backgroundColor: cat.color }, isDesktop ? { width: "48%" } : undefined]}
                >
                  <View className="w-10 h-10 rounded-lg bg-white items-center justify-center">
                    <cat.Icon size={18} color={colors.textSecondary} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-gray-900">{cat.name}</Text>
                    <Text className="text-xs text-gray-500">{cat.count}</Text>
                  </View>
                  <ChevronRight size={12} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
