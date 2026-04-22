import { View, Text, TextInput, ScrollView, Pressable, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Laptop, Car, Building2, ShoppingBag, Dumbbell, Dog, Home, Baby,
  ImageIcon, MapPin, Search, type LucideIcon
} from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import { colors } from "@/lib/theme";

const CATEGORIES: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "1", name: "Электроника", Icon: Laptop },
  { id: "2", name: "Авто", Icon: Car },
  { id: "3", name: "Жильё", Icon: Building2 },
  { id: "4", name: "Одежда", Icon: ShoppingBag },
  { id: "5", name: "Спорт", Icon: Dumbbell },
  { id: "6", name: "Питомцы", Icon: Dog },
  { id: "7", name: "Дом", Icon: Home },
  { id: "8", name: "Детям", Icon: Baby },
];

const LISTINGS = [
  { id: "1", title: "iPhone 15 Pro Max 256GB", price: "89 900 ₽", location: "Тбилиси", color: colors.indigoSoft },
  { id: "2", title: "Toyota Camry 2020, малый пробег", price: "1 850 000 ₽", location: "Батуми", color: colors.pinkSoft },
  { id: "3", title: "2-комн. квартира в центре", price: "45 000 ₽/мес", location: "Тбилиси", color: colors.greenSoft },
  { id: "4", title: "MacBook Air M2, как новый", price: "75 000 ₽", location: "Кутаиси", color: colors.yellowSoft },
  { id: "5", title: "Кожаная куртка винтаж", price: "12 000 ₽", location: "Тбилиси", color: colors.indigoSoft },
  { id: "6", title: "Горный велосипед Trek X-Cal", price: "38 000 ₽", location: "Батуми", color: colors.pinkSoft },
];

function CategoryChip({ name, Icon }: { name: string; Icon: LucideIcon }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      className="mr-2 items-center"
      style={{ minWidth: 60 }}
    >
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-1"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Icon size={22} color={colors.accent} />
      </View>
      <Text className="text-xs text-text-mute text-center">{name}</Text>
    </Pressable>
  );
}

function ListingCard({ title, price, location, color }: { title: string; price: string; location: string; color: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} className="flex-1 m-1.5">
      <View
        className="rounded-2xl overflow-hidden bg-white border border-border"
        style={{ shadowColor: colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
      >
        <View className="h-32 items-center justify-center" style={{ backgroundColor: color }}>
          <ImageIcon size={28} color={colors.textSecondary} />
        </View>
        <View className="p-3">
          <Text className="text-sm font-semibold text-text-base" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-sm font-bold text-accent mt-1">{price}</Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={11} color={colors.textMuted} />
            <Text className="text-xs text-text-dim ml-1">{location}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const containerStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <View className="flex-1" style={containerStyle}>
        <FlatList
          data={LISTINGS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-2 pb-6"
          ListEmptyComponent={
            <EmptyState
              title="Нет объявлений"
              subtitle="Здесь появятся доступные объявления"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Hero header */}
              <View
                className="mx-2 mt-4 mb-4 rounded-2xl px-5 py-5"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-xl font-bold text-white mb-0.5">Найдите нужное</Text>
                <Text className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Тысячи объявлений рядом с вами
                </Text>
              </View>

              {/* Search Bar */}
              <View className="px-2 mb-4">
                <View className="flex-row items-center h-12 rounded-xl bg-white border border-border px-4">
                  <Search size={16} color={colors.textSecondary} />
                  <TextInput
                    accessibilityLabel="Поиск объявлений"
                    className="flex-1 ml-3 text-base text-text-base"
                    placeholder="Поиск объявлений..."
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>

              {/* Categories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-2 pb-3"
              >
                {CATEGORIES.map((cat) => (
                  <CategoryChip key={cat.id} name={cat.name} Icon={cat.Icon} />
                ))}
              </ScrollView>

              {/* Section Title */}
              <View className="flex-row justify-between items-center px-2 mb-2">
                <Text className="text-base font-bold text-text-base">Свежие объявления</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Показать все"
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text className="text-sm text-accent font-medium">Все</Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard
              title={item.title}
              price={item.price}
              location={item.location}
              color={item.color}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
