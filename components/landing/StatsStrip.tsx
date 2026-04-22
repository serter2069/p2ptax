import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

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
    <View className="bg-slate-900 py-8 px-4">
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          className="flex-row justify-around"
          style={{
            width: "100%",
            maxWidth: 900,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
        >
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">
              {stats.specialistsCount}+
            </Text>
            <Text className="text-xs text-slate-400 mt-1 text-center">
              специалистов
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: colors.textMuted,
              marginHorizontal: 8,
            }}
          />
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">
              {stats.citiesCount}
            </Text>
            <Text className="text-xs text-slate-400 mt-1 text-center">
              городов
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: colors.textMuted,
              marginHorizontal: 8,
            }}
          />
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">
              {stats.consultationsCount}+
            </Text>
            <Text className="text-xs text-slate-400 mt-1 text-center">
              консультаций
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
