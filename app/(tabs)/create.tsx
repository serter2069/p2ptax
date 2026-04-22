import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, ImageIcon, Lightbulb } from "lucide-react-native";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/ui/EmptyState";

const PLACEHOLDER_SLOTS = [1, 2, 3, 4, 5];

export default function CreateScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ResponsiveContainer>
          {/* Header */}
          <View className="pt-4 pb-4">
            <Text className="text-2xl font-bold text-text-base">Новое объявление</Text>
            <Text className="text-sm text-text-mute mt-1 leading-5">Шаг 1 из 3 — Фотографии</Text>
          </View>

          {/* Progress Bar */}
          <View className="mb-8">
            <View className="h-1.5 rounded-full bg-border">
              <View className="h-1.5 rounded-full bg-accent w-1/3" />
            </View>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-xs text-accent font-medium">Фото</Text>
              <Text className="text-xs text-text-mute">Детали</Text>
              <Text className="text-xs text-text-mute">Публикация</Text>
            </View>
          </View>

          {/* Photo Grid */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-text-base mb-1">
              Добавьте фотографии
            </Text>
            <Text className="text-sm text-text-mute mb-4 leading-5">
              До 10 фотографий. Первая будет обложкой объявления.
            </Text>

            <View className="flex-row flex-wrap">
              {/* Add Photo Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Добавить фото"
                className="w-[31%] aspect-square m-[1%] rounded-xl items-center justify-center active:opacity-80"
                style={{ borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, backgroundColor: colors.accentSoft }}
              >
                <Camera size={24} color={colors.primary} />
                <Text className="text-xs text-accent mt-1.5 font-semibold">Добавить</Text>
              </Pressable>

              {/* Placeholder slots */}
              {PLACEHOLDER_SLOTS.length === 0 ? (
                <EmptyState icon={ImageIcon} title="Нет слотов для фото" subtitle="Добавьте фотографии товара" />
              ) : (
                PLACEHOLDER_SLOTS.map((i) => (
                  <View
                    key={i}
                    className="w-[31%] aspect-square m-[1%] rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.surface2 }}
                  >
                    <ImageIcon size={20} color={colors.textMuted} />
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Tips */}
          <View className="p-4 rounded-xl border mb-8" style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
            <View className="flex-row items-center mb-2">
              <Lightbulb size={16} color={colors.warning} />
              <Text className="text-sm font-semibold ml-2" style={{ color: "#92400e" }}>Советы для хороших фото</Text>
            </View>
            <Text className="text-sm leading-5" style={{ color: "#78350f" }}>
              Используйте естественный свет. Снимайте с разных ракурсов. Покажите детали и возможные дефекты.
            </Text>
          </View>

          {/* Next Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Далее: детали"
            className="h-12 rounded-xl items-center justify-center active:opacity-90"
            style={{ backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
          >
            <Text className="text-white text-base font-semibold">Далее: Детали</Text>
          </Pressable>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
