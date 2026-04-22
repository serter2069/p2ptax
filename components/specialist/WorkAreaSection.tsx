import { View, Text } from "react-native";
import type { FnsServiceGroup } from "./types";

interface WorkAreaSectionProps {
  fnsServices: FnsServiceGroup[];
  cardShadow: object;
}

export default function WorkAreaSection({ fnsServices, cardShadow }: WorkAreaSectionProps) {
  if (fnsServices.length === 0) return null;

  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 mx-4 mt-4"
      style={cardShadow}
    >
      <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
        РАБОЧИЕ ИНСПЕКЦИИ
      </Text>
      {fnsServices.map((group) => (
        <View
          key={group.fns.id}
          className="border border-border rounded-xl p-3 mb-2"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <Text className="text-sm font-semibold mb-2" style={{ color: "#0f172a" }}>
            {group.city.name} — {group.fns.name}
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {group.services.map((s) => (
              <View
                key={s.id}
                className="px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "rgba(34, 86, 194, 0.1)" }}
              >
                <Text className="text-xs font-medium" style={{ color: "#2256c2" }}>{s.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
