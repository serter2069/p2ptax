import { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  FileSearch, ShieldCheck, Briefcase,
  MapPin, Search, type LucideIcon
} from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import { colors, overlay } from "@/lib/theme";
import { api } from "@/lib/api";

// SA: ровно 3 услуги — Выездная / Камеральная / Оперативный контроль.
// Иконка выбирается эвристикой по названию, чтобы не хардкодить id.
function pickIcon(name: string): LucideIcon {
  if (/камеральн/i.test(name)) return FileSearch;
  if (/выездн/i.test(name)) return Briefcase;
  return ShieldCheck;
}

interface ServiceItem { id: string; name: string }
interface FeaturedItem { id: string; title: string; location: string }

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

function ServiceCard({ title, location }: { title: string; location: string }) {
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
          <View className="flex-row items-center">
            <MapPin size={11} color={colors.textMuted} />
            <Text className="text-xs text-text-mute ml-1">{location}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Featured example card titles for 3 canonical services
const FEATURED_TEMPLATES: Record<string, { title: string; location: string }> = {
  "Камеральная проверка": { title: "Защита при камеральной проверке", location: "Москва" },
  "Выездная проверка": { title: "Сопровождение выездной проверки", location: "Санкт-Петербург" },
  "Отдел оперативного контроля": { title: "Сопровождение оперативного контроля", location: "Екатеринбург" },
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 640;
  const containerStyle = isDesktop
    ? { maxWidth: 1200, width: "100%" as const, alignSelf: "center" as const, paddingHorizontal: 16 }
    : undefined;

  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    api<{ items: ServiceItem[] }>("/api/services", { noAuth: true })
      .then((res) => setServices(res.items ?? []))
      .catch(() => setServices([]));
  }, []);

  // Fallback: если API недоступен — показываем 3 канонические услуги (SA).
  const displayServices: ServiceItem[] = services.length > 0
    ? services
    : [
        { id: "s1", name: "Камеральная проверка" },
        { id: "s2", name: "Выездная проверка" },
        { id: "s3", name: "Отдел оперативного контроля" },
      ];

  const featured: FeaturedItem[] = displayServices.map((s) => {
    const tpl = FEATURED_TEMPLATES[s.name] ?? { title: s.name, location: "Россия" };
    return { id: s.id, title: tpl.title, location: tpl.location };
  });

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <View className="flex-1" style={containerStyle}>
        <FlatList
          data={featured}
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
                  Камеральные и выездные проверки, оперативный контроль
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
                {displayServices.map((s) => (
                  <CategoryChip key={s.id} name={s.name} Icon={pickIcon(s.name)} />
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
              location={item.location}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
