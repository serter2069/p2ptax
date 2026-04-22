import { View, Text } from "react-native";

interface PlatformStats {
  specialistsCount: number;
  citiesCount: number;
  consultationsCount: number;
}

interface StatsStripProps {
  stats: PlatformStats;
  isDesktop: boolean;
}

export default function StatsStrip({ stats, isDesktop }: StatsStripProps) {
  return (
    <View style={{ backgroundColor: "#fafbfc", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e8ebf0", paddingVertical: 20, paddingHorizontal: 16 }}>
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          className="flex-row items-center justify-center flex-wrap"
          style={{
            width: "100%",
            maxWidth: 900,
            paddingHorizontal: isDesktop ? 24 : 0,
            gap: 8,
          }}
        >
          <Text className="text-base font-semibold" style={{ color: "#0b1424" }}>
            {stats.specialistsCount} специалистов
          </Text>
          <Text style={{ color: "#e8ebf0" }}> · </Text>
          <Text className="text-base font-semibold" style={{ color: "#0b1424" }}>
            {stats.citiesCount} городов
          </Text>
          <Text style={{ color: "#e8ebf0" }}> · </Text>
          <Text className="text-base font-semibold" style={{ color: "#0b1424" }}>
            {stats.consultationsCount} консультаций
          </Text>
        </View>
      </View>
    </View>
  );
}
