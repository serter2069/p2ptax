import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search, SlidersHorizontal, Clock, ArrowRight, ChevronRight,
  Laptop, Car, Building2, ShoppingBag, Home, type LucideIcon
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
  { id: "1", name: "Электроника", count: "12 453 объявл.", Icon: Laptop, color: colors.accentSoft },
  { id: "2", name: "Авто", count: "8 291 объявл.", Icon: Car, color: colors.dangerSoft },
  { id: "3", name: "Недвижимость", count: "5 872 объявл.", Icon: Building2, color: colors.limeSoft },
  { id: "4", name: "Одежда", count: "9 104 объявл.", Icon: ShoppingBag, color: colors.yellowSoft },
  { id: "5", name: "Спорт", count: "3 455 объявл.", Icon: Home, color: colors.pinkSoft },
  { id: "6", name: "Дом и сад", count: "6 789 объявл.", Icon: Home, color: colors.cyanSoft },
];

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ResponsiveContainer>
          {/* Header */}
          <View className="pt-4 pb-3">
            <Text className="text-2xl font-bold text-text-base">Поиск</Text>
          </View>

          {/* Search Input */}
          <View className="mb-5">
            <View className="flex-row items-center h-12 rounded-xl bg-white border border-border px-4">
              <Search size={16} color={colors.textSecondary} />
              <TextInput
                accessibilityLabel="Поиск"
                className="flex-1 ml-3 text-base text-text-base"
                placeholder="Что вы ищете?"
                placeholderTextColor={colors.placeholder}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Фильтры"
                className="ml-2 w-9 h-9 rounded-lg bg-accent items-center justify-center"
              >
                <SlidersHorizontal size={15} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Recent Searches */}
          <View className="mb-6 bg-white border border-border rounded-xl overflow-hidden">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
              <Text className="text-sm font-semibold text-text-base">Недавние поиски</Text>
              {RECENT_SEARCHES.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Очистить историю поиска"
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text className="text-sm text-accent">Очистить</Text>
                </Pressable>
              )}
            </View>
            {RECENT_SEARCHES.length === 0 ? (
              <View className="px-4 py-6">
                <EmptyState
                  icon={Search}
                  title="Нет недавних поисков"
                  subtitle="Ваши поисковые запросы появятся здесь"
                />
              </View>
            ) : (
              RECENT_SEARCHES.map((search, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={index}
                  accessibilityLabel={search}
                  className="flex-row items-center px-4 active:bg-surface2"
                  style={{ minHeight: 44, borderBottomWidth: index < RECENT_SEARCHES.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
                >
                  <Clock size={15} color={colors.textSecondary} />
                  <Text className="flex-1 ml-3 text-sm text-text-base">{search}</Text>
                  <ArrowRight size={12} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </View>

          {/* Popular Categories */}
          <View>
            <Text className="text-sm font-semibold text-text-base mb-3">Популярные категории</Text>
            <View className={isDesktop ? "flex-row flex-wrap gap-2" : undefined}>
              {POPULAR_CATEGORIES.map((cat) => (
                <Pressable
                  accessibilityRole="button"
                  key={cat.id}
                  accessibilityLabel={cat.name}
                  className="flex-row items-center p-3 rounded-xl mb-2 border border-border"
                  style={[{ backgroundColor: cat.color }, isDesktop ? { width: "48%" } : undefined]}
                >
                  <View className="w-10 h-10 rounded-xl bg-white items-center justify-center">
                    <cat.Icon size={18} color={colors.accent} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-text-base">{cat.name}</Text>
                    <Text className="text-xs text-text-mute">{cat.count}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
