import { View, Text, Pressable } from "react-native";
import StatusBadge from "./StatusBadge";
import { colors } from "@/lib/theme";

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
      className="bg-white border border-border rounded-xl p-4 mb-3"
      style={({ pressed }) => [
        { shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View className="flex-row items-center justify-between mb-2">
        {/* flex-1 + min-w-0 + flexShrink: 1 lets the title use ALL available
            space and shrink (rather than pushing the StatusBadge off-screen
            or being clipped at an arbitrary intrinsic width). On web the
            default min-width of a flex item is its intrinsic content width,
            so without minWidth: 0 the text never shrinks below that. */}
        <Text
          className="text-lg font-semibold text-text-base flex-1 mr-2"
          numberOfLines={1}
          style={{ flexShrink: 1, minWidth: 0 }}
        >
          {title}
        </Text>
        <StatusBadge status={status} />
      </View>

      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-surface2 px-2 py-0.5 rounded">
          <Text className="text-xs text-text-mute">{city.name}</Text>
        </View>
        <View className="bg-surface2 px-2 py-0.5 rounded">
          <Text className="text-xs text-text-mute">{fns.name}</Text>
        </View>
      </View>

      <Text className="text-sm text-text-mute mb-2" numberOfLines={2}>
        {description}
      </Text>

      <Text className="text-xs text-text-mute">
        {threadsCount} {threadsCount === 1 ? "специалист уже написал" : "специалистов уже написали"}
      </Text>
    </Pressable>
  );
}
