import { View, Text, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface SpecialistCardProps {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  description?: string | null;
  onPress: (id: string) => void;
  variant?: "vertical" | "horizontal";
  /** @deprecated Use variant="horizontal" instead */
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
  description,
  onPress,
  variant,
  horizontal = false,
}: SpecialistCardProps) {
  const resolvedVariant = variant ?? (horizontal ? "horizontal" : "vertical");
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(firstName, lastName);

  if (resolvedVariant === "horizontal") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={() => onPress(id)}
        className="bg-white border border-border rounded-xl p-4 mr-3"
        style={({ pressed }) => [{ width: 200 }, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
      >
        <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: "#2256c2" }}>
          <Text className="text-white font-bold text-base">{initials}</Text>
        </View>
        <Text className="text-base font-semibold mb-1" style={{ color: "#0f172a" }} numberOfLines={1}>
          {name}
        </Text>
        <View className="flex-row flex-wrap gap-1 mb-1">
          {services.slice(0, 2).map((s) => (
            <View key={s.id} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(34,86,194,0.1)" }}>
              <Text className="text-[10px]" style={{ color: "#2256c2" }}>{s.name}</Text>
            </View>
          ))}
          {services.length > 2 && (
            <Text className="text-[10px]" style={{ color: "#94a3b8" }}>+{services.length - 2}</Text>
          )}
        </View>
        {cities.length > 0 && (
          <Text className="text-xs" style={{ color: "#94a3b8" }} numberOfLines={1}>
            {cities.map((c) => c.name).join(", ")}
          </Text>
        )}
      </Pressable>
    );
  }

  // Vertical variant (new default for catalog grid)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(id)}
      className="bg-white border border-border rounded-2xl p-4 mb-3"
      style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
    >
      {/* Avatar */}
      <View
        className="rounded-full items-center justify-center"
        style={{ width: 56, height: 56, backgroundColor: "#2256c2" }}
      >
        <Text className="text-white font-bold text-lg">{initials}</Text>
      </View>

      {/* Name */}
      <Text className="text-base font-bold mt-3" style={{ color: "#0f172a" }} numberOfLines={1}>
        {name}
      </Text>

      {/* Description */}
      {description ? (
        <Text className="text-sm mt-1" style={{ color: "#64748B" }} numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Service pills */}
      {services.length > 0 && (
        <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
          {services.map((s) => (
            <View
              key={s.id}
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(34,86,194,0.1)" }}
            >
              <Text className="text-xs font-medium" style={{ color: "#2256c2" }}>{s.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* City */}
      {cities.length > 0 && (
        <View className="flex-row items-center mt-2">
          <FontAwesome name="map-marker" size={10} color="#94a3b8" />
          <Text className="text-xs ml-1" style={{ color: "#94a3b8" }} numberOfLines={1}>
            {cities.map((c) => c.name).join(", ")}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
