import { View, Text, Pressable } from "react-native";
import { MapPin } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface SpecialistCardProps {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  onPress: (id: string) => void;
  horizontal?: boolean;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

export default function SpecialistCard({
  id,
  firstName,
  lastName,
  services,
  cities,
  onPress,
  horizontal = false,
}: SpecialistCardProps) {
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(firstName, lastName);

  if (horizontal) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={() => onPress(id)}
        className="bg-white border border-slate-200 rounded-xl p-4 mr-3"
        style={({ pressed }) => [{ width: 200 }, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
      >
        <View className="w-12 h-12 rounded-full bg-blue-900 items-center justify-center mb-2">
          <Text className="text-white font-bold text-base">{initials}</Text>
        </View>
        <Text className="text-base font-semibold text-slate-900 mb-1" numberOfLines={1}>
          {name}
        </Text>
        <View className="flex-row flex-wrap gap-1 mb-1">
          {services.slice(0, 2).map((s) => (
            <View key={s.id} className="bg-amber-700/10 px-1.5 py-0.5 rounded">
              <Text className="text-[10px] text-amber-700">{s.name}</Text>
            </View>
          ))}
          {services.length > 2 && (
            <Text className="text-[10px] text-slate-400">+{services.length - 2}</Text>
          )}
        </View>
        {cities.length > 0 && (
          <Text className="text-xs text-slate-400" numberOfLines={1}>
            {cities.map((c) => c.name).join(", ")}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(id)}
      className="bg-white border border-slate-200 rounded-xl p-4 mb-3"
      style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full bg-blue-900 items-center justify-center mr-3">
          <Text className="text-white font-bold text-base">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
            {name}
          </Text>
          {cities.length > 0 && (
            <View className="flex-row items-center mt-0.5">
              <MapPin size={10} color={colors.placeholder} />
              <Text className="text-xs text-slate-400 ml-1" numberOfLines={1}>
                {cities.map((c) => c.name).join(", ")}
              </Text>
            </View>
          )}
        </View>
      </View>
      {services.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {services.map((s) => (
            <View key={s.id} className="bg-amber-700/10 px-2 py-0.5 rounded">
              <Text className="text-xs text-amber-700">{s.name}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
