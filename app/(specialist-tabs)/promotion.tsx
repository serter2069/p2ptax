import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Rocket, User, ChevronRight } from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import { colors } from "@/lib/theme";

export default function PromotionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome
        notificationCount={0}
        onSettingsPress={() => router.push("/settings/specialist" as never)}
      />
      <ScrollView className="flex-1">
        <View style={{ width: "100%", alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: isDesktop ? 680 : undefined, paddingHorizontal: isDesktop ? 24 : 16 }}>
          <View className="py-4">
            <Text className="text-2xl font-bold text-text-base mb-2">Продвижение</Text>
            <Text className="text-sm text-text-mute mb-6">
              Инструменты для привлечения новых клиентов
            </Text>

            {/* Placeholder card */}
            <View className="bg-white border border-border rounded-xl p-6 items-center">
              <View className="w-16 h-16 rounded-full bg-amber-50 items-center justify-center mb-4">
                <Rocket size={28} color={colors.accent} />
              </View>
              <Text className="text-lg font-semibold text-text-base text-center mb-2">
                Скоро будет доступно
              </Text>
              <Text className="text-sm text-text-mute text-center leading-5">
                Здесь появятся инструменты продвижения вашего профиля: платное размещение в топе,
                баннеры и специальные предложения для клиентов.
              </Text>
            </View>

            {/* Profile tip */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Улучшить профиль"
              onPress={() => router.push("/settings/specialist" as never)}
              className="bg-accent rounded-xl p-4 mt-4 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-blue-800 items-center justify-center mr-3">
                <User size={16} color={colors.surface} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">Заполните профиль</Text>
                <Text className="text-blue-200 text-xs mt-0.5">
                  Полный профиль повышает доверие клиентов
                </Text>
              </View>
              <ChevronRight size={12} color={colors.blue300} />
            </Pressable>

            <View className="h-8" />
          </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
