import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

interface SpecialistServicesCitiesProps {
  serviceNames: Set<string>;
  cities: string[];
}

/**
 * "Услуги" + "Города" chip rows. Renders nothing if both are empty.
 */
export default function SpecialistServicesCities({
  serviceNames,
  cities,
}: SpecialistServicesCitiesProps) {
  if (serviceNames.size === 0 && cities.length === 0) return null;
  return (
    <View className="mt-8">
      {serviceNames.size > 0 && (
        <View className="mb-6">
          <Text
            className="uppercase mb-3"
            style={{
              fontSize: 12,
              letterSpacing: 3,
              color: colors.textSecondary,
              fontWeight: "600",
            }}
          >
            Услуги
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {[...serviceNames].map((s) => (
              <View
                key={s}
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.accentSoftInk }}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {cities.length > 0 && (
        <View>
          <Text
            className="uppercase mb-3"
            style={{
              fontSize: 12,
              letterSpacing: 3,
              color: colors.textSecondary,
              fontWeight: "600",
            }}
          >
            Города
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {cities.map((city) => (
              <View
                key={city}
                className="px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.text }}
                >
                  {city}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
