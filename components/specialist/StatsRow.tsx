import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

interface StatsRowProps {
  requestsCount: number;
  fnsCount: number;
  servicesCount: number;
}

export default function StatsRow({ requestsCount, fnsCount, servicesCount }: StatsRowProps) {
  return (
    <View className="flex-row mx-4 mt-4 mb-2 py-4 border-t border-b border-slate-100">
      <View className="flex-1 items-center">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          {requestsCount}
        </Text>
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary, letterSpacing: 2 }}>
          КЕЙСОВ
        </Text>
      </View>
      <View style={{ width: 1, backgroundColor: colors.border }} />
      <View className="flex-1 items-center">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>{fnsCount}</Text>
        <Text className="text-xs mt-1 text-center" style={{ color: colors.textSecondary, letterSpacing: 2 }}>
          ИФНС В РАБОТЕ
        </Text>
      </View>
      <View style={{ width: 1, backgroundColor: colors.border }} />
      <View className="flex-1 items-center">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>{servicesCount}</Text>
        <Text className="text-xs mt-1 text-center" style={{ color: colors.textSecondary, letterSpacing: 2 }}>
          ВИДОВ ПРОВЕРОК
        </Text>
      </View>
    </View>
  );
}
