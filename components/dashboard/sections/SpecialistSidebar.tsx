import { View, Text, Pressable } from "react-native";
import { Plus, List } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface Props {
  atLimit: boolean;
  onCreateRequest: () => void;
  onPublicRequests: () => void;
}

export default function SpecialistSidebar({
  atLimit,
  onCreateRequest,
  onPublicRequests,
}: Props) {
  return (
    <View style={{ gap: 16 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Создать заявку"
        onPress={onCreateRequest}
        disabled={atLimit}
        className={`rounded-2xl p-5 ${atLimit ? "bg-surface2 border border-border" : "bg-accent"}`}
      >
        <View className="flex-row items-center gap-3">
          <View
            className={`rounded-xl items-center justify-center ${atLimit ? "bg-white" : "bg-white/20"}`}
            style={{ width: 44, height: 44 }}
          >
            <Plus
              size={22}
              color={atLimit ? colors.textMuted : colors.white}
            />
          </View>
          <View className="flex-1 min-w-0">
            <Text
              className={`font-extrabold ${atLimit ? "text-text-mute" : "text-white"}`}
              style={{ fontSize: 16 }}
            >
              {atLimit
                ? "Лимит активных заявок исчерпан (5/5). Закройте одну."
                : "Создать заявку"}
            </Text>
            <Text
              className={atLimit ? "text-text-dim" : "text-white/80"}
              style={{ fontSize: 12, marginTop: 2 }}
            >
              {atLimit
                ? "Закройте одну, чтобы создать новую"
                : "Первые сообщения в течение 24 часов"}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Все публичные заявки"
        onPress={onPublicRequests}
        className="rounded-2xl bg-accent p-5"
      >
        <View className="flex-row items-center gap-3">
          <View
            className="rounded-xl items-center justify-center bg-white/20"
            style={{ width: 44, height: 44 }}
          >
            <List size={22} color={colors.white} />
          </View>
          <View className="flex-1 min-w-0">
            <Text
              className="font-extrabold text-white"
              style={{ fontSize: 16 }}
            >
              Публичные заявки
            </Text>
            <Text
              className="text-white/80 mt-0.5"
              style={{ fontSize: 12 }}
            >
              Полный каталог с фильтрами
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
