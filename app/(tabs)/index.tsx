import { View, Text, TextInput, ScrollView, Pressable, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  FileSearch, AlertTriangle, ShieldCheck, Briefcase, Globe2, Landmark,
  Users, Gavel, MapPin, Search, type LucideIcon
} from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import { colors, overlay } from "@/lib/theme";

// Tax-domain categories (NOT marketplace). Covers primary service verticals
// that clients encounter on p2ptax.
const CATEGORIES: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "1", name: "Камеральная", Icon: FileSearch },
  { id: "2", name: "Выездная", Icon: Briefcase },
  { id: "3", name: "Опер. контроль", Icon: ShieldCheck },
  { id: "4", name: "Споры с ИФНС", Icon: Gavel },
  { id: "5", name: "Счёт 115-ФЗ", Icon: AlertTriangle },
  { id: "6", name: "Зарубежные счета", Icon: Globe2 },
  { id: "7", name: "Самозанятые", Icon: Users },
  { id: "8", name: "Регионы ФНС", Icon: Landmark },
];

// Featured specialists / services (NOT listings/objявлений).
const FEATURED = [
  { id: "1", title: "Защита при камеральной проверке", price: "от 15 000 ₽", location: "Москва" },
  { id: "2", title: "Сопровождение выездной проверки", price: "от 60 000 ₽", location: "Санкт-Петербург" },
  { id: "3", title: "Разблокировка счёта по 115-ФЗ", price: "от 25 000 ₽", location: "Екатеринбург" },
  { id: "4", title: "Оспаривание решения ИФНС", price: "от 35 000 ₽", location: "Казань" },
  { id: "5", title: "Отчёты по зарубежным счетам", price: "от 12 000 ₽", location: "Новосибирск" },
  { id: "6", title: "Консультация по самозанятым", price: "от 3 500 ₽", location: "Краснодар" },
];

function CategoryChip({ name, Icon }: { name: string; Icon: LucideIcon }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      className="mr-3 items-center"
      style={{ minWidth: 72, minHeight: 44, justifyContent: "flex-start", paddingTop: 2 }}
    >
      <View
        className="w-14 h-14 rounded-xl items-center justify-center"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Icon size={22} color={colors.accent} />
      </View>
      <Text className="text-xs font-medium text-text-base mt-1.5 text-center" numberOfLines={2}>{name}</Text>
    </Pressable>
  );
}

function ServiceCard({ title, price, location }: { title: string; price: string; location: string }) {
  return (
    <Pressable className="flex-1 m-1.5" style={{ minHeight: 44 }} accessibilityRole="button" accessibilityLabel={title}>
      <View
        className="rounded-2xl overflow-hidden bg-white border border-border"
        style={{
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="h-28 items-center justify-center relative" style={{ backgroundColor: colors.accentSoft }}>
          <ShieldCheck size={32} color={colors.accent} />
        </View>
        <View className="p-3 pb-4">
          <Text className="text-sm font-semibold text-text-base mb-1" numberOfLines={2}>{title}</Text>
          <Text className="text-base font-bold text-accent mb-1.5">{price}</Text>
          <View className="flex-row items-center">
            <MapPin size={11} color={colors.textMuted} />
            <Text className="text-xs text-text-mute ml-1">{location}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 640;
  const containerStyle = isDesktop
    ? { maxWidth: 960, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <View className="flex-1" style={containerStyle}>
        <FlatList
          data={FEATURED}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-2 pb-6"
          ListEmptyComponent={
            <EmptyState
              title="Нет активных услуг"
              subtitle="Здесь появятся налоговые услуги специалистов платформы"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Hero header */}
              <View
                className="mx-2 mt-4 mb-4 rounded-2xl px-5 py-5"
                style={{ backgroundColor: colors.accent, minHeight: 100 }}
              >
                <Text className="text-2xl font-bold text-white mb-1">Налоговая защита</Text>
                <Text className="text-sm" style={{ color: overlay.white80 }}>
                  Проверенные специалисты по налогам по всей России
                </Text>
                <Text className="text-xs mt-1" style={{ color: overlay.white50 }}>
                  Камеральные и выездные проверки, споры с ИФНС, 115-ФЗ
                </Text>
              </View>

              {/* Search Bar */}
              <View className="px-2 mb-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Поиск специалистов и услуг"
                  onPress={() => router.push("/(tabs)/search" as never)}
                  className="flex-row items-center h-12 rounded-xl bg-white border border-border px-4"
                >
                  <Search size={16} color={colors.textSecondary} />
                  <TextInput
                    accessibilityLabel="Поиск специалистов и услуг"
                    className="flex-1 ml-3 text-base text-text-base"
                    placeholder="Поиск специалистов или услуг..."
                    placeholderTextColor={colors.placeholder}
                    editable={false}
                    pointerEvents="none"
                  />
                </Pressable>
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
                <Text className="text-base font-bold text-text-base">Популярные услуги</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Смотреть всех специалистов"
                  onPress={() => router.push("/specialists" as never)}
                  style={{ height: 44, justifyContent: "center", paddingHorizontal: 12 }}
                >
                  <Text className="text-sm text-accent font-medium">Все</Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <ServiceCard
              title={item.title}
              price={item.price}
              location={item.location}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
