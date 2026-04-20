import { View, Text, Pressable } from "react-native";
import StatusBadge from "./StatusBadge";

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
  onPress: (id: string) => void;
}

export default function RequestCard({
  id,
  title,
  description,
  status,
  city,
  fns,
  threadsCount,
  onPress,
}: RequestCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => onPress(id)}
      className="bg-white border border-slate-200 rounded-xl p-4 mb-3"
      style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-semibold text-slate-900 flex-1 mr-2" numberOfLines={1}>
          {title}
        </Text>
        <StatusBadge status={status} />
      </View>

      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-slate-50 px-2 py-0.5 rounded">
          <Text className="text-xs text-slate-400">{city.name}</Text>
        </View>
        <View className="bg-slate-50 px-2 py-0.5 rounded">
          <Text className="text-xs text-slate-400">{fns.name}</Text>
        </View>
      </View>

      <Text className="text-sm text-slate-400 mb-2" numberOfLines={2}>
        {description}
      </Text>

      <Text className="text-xs text-slate-400">
        {threadsCount} {threadsCount === 1 ? "специалист откликнулся" : "специалистов откликнулось"}
      </Text>
    </Pressable>
  );
}
