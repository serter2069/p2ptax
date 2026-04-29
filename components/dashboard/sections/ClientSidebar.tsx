import { View, Text, Pressable } from "react-native";
import { Plus, Lightbulb } from "lucide-react-native";
import { DashboardWidget } from "@/components/dashboard";
import { colors } from "@/lib/theme";

interface Tip {
  title: string;
  text: string;
}

interface Props {
  atLimit: boolean;
  onCreateRequest: () => void;
  tips: Tip[];
}

export default function ClientSidebar({ atLimit, onCreateRequest, tips }: Props) {
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

      <DashboardWidget title="Советы" icon={Lightbulb}>
        <View style={{ gap: 12 }}>
          {tips.map((t) => (
            <View key={t.title}>
              <Text
                className="text-text-base font-semibold"
                style={{ fontSize: 13 }}
              >
                {t.title}
              </Text>
              <Text
                className="text-text-mute mt-0.5"
                style={{ fontSize: 12, lineHeight: 16 }}
              >
                {t.text}
              </Text>
            </View>
          ))}
        </View>
      </DashboardWidget>
    </View>
  );
}
