import { View, Text, Pressable } from "react-native";

interface ProfileHeroProps {
  name: string;
  initials: string;
  cities: string[];
  isAvailable: boolean;
  createdAt: string;
  isOwnProfile: boolean;
  isSpecialist: boolean;
  onWritePress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
}

export default function ProfileHero({
  name,
  initials,
  cities,
  isAvailable,
  createdAt,
  isOwnProfile,
  isSpecialist,
  onWritePress,
}: ProfileHeroProps) {
  return (
    <View className="flex-row items-start p-4 pb-0">
      {/* Avatar */}
      <View
        className="rounded-full items-center justify-center mr-4 flex-shrink-0"
        style={{ width: 80, height: 80, backgroundColor: "#2256c2" }}
      >
        <Text className="text-white font-bold text-2xl">{initials}</Text>
      </View>

      {/* Info column */}
      <View className="flex-1">
        {/* Name row with CTA */}
        <View className="flex-row items-start justify-between">
          <Text className="text-2xl font-bold flex-1 mr-2" style={{ color: "#0f172a" }}>{name}</Text>
          {!isOwnProfile && !isSpecialist && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Написать"
              onPress={onWritePress}
              className="rounded-xl px-4 min-h-[44px] items-center justify-center flex-row"
              style={{ backgroundColor: "#2256c2" }}
            >
              <Text className="text-white font-semibold text-sm">Написать →</Text>
            </Pressable>
          )}
        </View>

        {/* City */}
        {cities.length > 0 && (
          <Text className="text-sm mt-0.5" style={{ color: "#64748B" }}>{cities.join(", ")}</Text>
        )}

        {/* Availability */}
        <View className="flex-row items-center mt-2 flex-wrap" style={{ gap: 8 }}>
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-1 ${isAvailable ? "bg-emerald-500" : "bg-slate-300"}`} />
            <Text
              className="text-xs font-semibold uppercase"
              style={{ letterSpacing: 1, color: isAvailable ? "#059669" : "#94a3b8" }}
            >
              {isAvailable ? "На связи" : "Недоступен"}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: "#94a3b8" }}>
            · на P2PTax с {formatDate(createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}
