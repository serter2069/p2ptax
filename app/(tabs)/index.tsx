import { View, Text, TextInput, ScrollView, Pressable, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Laptop, Car, Building2, ShoppingBag, Dumbbell, Dog, Home, Baby,
  ImageIcon, MapPin, Search, type LucideIcon
} from "lucide-react-native";
import { colors } from "@/lib/theme";

const CATEGORIES: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "1", name: "Electronics", Icon: Laptop },
  { id: "2", name: "Cars", Icon: Car },
  { id: "3", name: "Property", Icon: Building2 },
  { id: "4", name: "Clothes", Icon: ShoppingBag },
  { id: "5", name: "Sports", Icon: Dumbbell },
  { id: "6", name: "Pets", Icon: Dog },
  { id: "7", name: "Home", Icon: Home },
  { id: "8", name: "Kids", Icon: Baby },
];

const LISTINGS = [
  { id: "1", title: "iPhone 15 Pro Max 256GB", price: "$899", location: "Tbilisi", color: "#e0e7ff" },
  { id: "2", title: "Toyota Camry 2020 Low Miles", price: "$18,500", location: "Batumi", color: "#fce7f3" },
  { id: "3", title: "2BR Apartment City Center", price: "$450/mo", location: "Tbilisi", color: "#dcfce7" },
  { id: "4", title: "MacBook Air M2 Like New", price: "$750", location: "Kutaisi", color: "#fef3c7" },
  { id: "5", title: "Vintage Leather Jacket", price: "$120", location: "Tbilisi", color: "#e0e7ff" },
  { id: "6", title: "Mountain Bike Trek X-Cal", price: "$380", location: "Batumi", color: "#fce7f3" },
];

function CategoryChip({ name, Icon }: { name: string; Icon: LucideIcon }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} className="mr-3 items-center">
      <View className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center mb-1">
        <Icon size={20} color="#4b5563" />
      </View>
      <Text className="text-xs text-gray-600">{name}</Text>
    </Pressable>
  );
}

function ListingCard({ title, price, location, color }: { title: string; price: string; location: string; color: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} className="flex-1 m-1.5">
      <View className="rounded-2xl overflow-hidden bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <View className="h-36 items-center justify-center" style={{ backgroundColor: color }}>
          <ImageIcon size={32} color={colors.textSecondary} />
        </View>
        <View className="p-3">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-base font-bold text-blue-600 mt-1">{price}</Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color={colors.textSecondary} />
            <Text className="text-xs text-gray-400 ml-1">{location}</Text>
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1" style={containerStyle}>
      <FlatList
        data={LISTINGS}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-2 pb-4"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-base text-text-mute">Нет объявлений</Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="px-4 pt-2 pb-3">
              <Text className="text-2xl font-bold text-gray-900">Discover</Text>
            </View>

            {/* Search Bar */}
            <View className="px-4 mb-4">
              <View className="flex-row items-center h-12 rounded-xl bg-gray-100 px-4">
                <Search size={16} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="Поиск объявлений"
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Search listings..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 pb-4"
            >
              {CATEGORIES.map((cat) => (
                <CategoryChip key={cat.id} name={cat.name} Icon={cat.Icon} />
              ))}
            </ScrollView>

            {/* Section Title */}
            <View className="flex-row justify-between items-center px-4 mb-2">
              <Text className="text-lg font-bold text-gray-900">Recent Listings</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Показать все">
                <Text className="text-sm text-blue-600">See all</Text>
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
