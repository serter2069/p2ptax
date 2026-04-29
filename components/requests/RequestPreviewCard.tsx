import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

export interface RequestPreviewData {
  id: string;
  title: string;
  description: string;
  status: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
}

interface RequestPreviewCardProps {
  /** Request summary to render. */
  request: RequestPreviewData;
}

/**
 * Read-only summary card shown to a specialist before composing a first
 * message. Renders title, city/FNS chips and a 3-line description excerpt.
 */
export default function RequestPreviewCard({ request }: RequestPreviewCardProps) {
  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 mb-4"
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Заявка клиента
      </Text>
      <Text className="text-base font-semibold text-text-base mb-2 leading-snug">
        {request.title}
      </Text>
      <View className="flex-row flex-wrap gap-1.5 mb-3">
        <View className="bg-surface2 border border-border px-2.5 py-1 rounded-lg">
          <Text className="text-xs text-text-mute">{request.city.name}</Text>
        </View>
        <View className="bg-surface2 border border-border px-2.5 py-1 rounded-lg">
          <Text className="text-xs text-text-mute">{request.fns.name}</Text>
        </View>
      </View>
      <Text className="text-sm text-text-mute leading-5" numberOfLines={3}>
        {request.description}
      </Text>
    </View>
  );
}
