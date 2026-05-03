import { View, Text } from "react-native";
import { colors, overlay } from "@/lib/theme";
import { useServices } from "@/lib/hooks/useServices";
import type { FnsServiceGroup } from "./types";

interface WorkAreaSectionProps {
  fnsServices: FnsServiceGroup[];
  cardShadow: object;
}

export default function WorkAreaSection({ fnsServices, cardShadow }: WorkAreaSectionProps) {
  const { services: allServices } = useServices();
  if (fnsServices.length === 0) return null;
  const totalServiceCount = allServices.length;

  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 mx-4 mt-4"
      style={cardShadow}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>
        РАБОЧИЕ ИНСПЕКЦИИ
      </Text>
      {fnsServices.map((group) => {
        const coversAll =
          totalServiceCount > 0 && group.services.length >= totalServiceCount;
        return (
          <View
            key={group.fns.id}
            className="border border-border rounded-xl p-3 mb-2"
            style={{ backgroundColor: colors.surface2 }}
          >
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {group.city.name} — {group.fns.name}
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {coversAll ? (
                <View
                  className="px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: overlay.accent10 }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                    Все услуги
                  </Text>
                </View>
              ) : (
                group.services.map((s) => (
                  <View
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: overlay.accent10 }}
                  >
                    <Text className="text-xs font-medium" style={{ color: colors.primary }}>{s.name}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
