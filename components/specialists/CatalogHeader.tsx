import { View, Text } from "react-native";
import { colors } from "@/lib/theme";
import { pluralizeRu } from "@/lib/ru";

interface Props {
  isDesktop: boolean;
  count: number | null;
}

export default function CatalogHeader({ isDesktop, count }: Props) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 ${
        isDesktop ? "pt-4" : "pt-2"
      } pb-1`}
    >
      {/* Title is rendered by PageTitle above; do not duplicate it here */}
      {count !== null && count > 0 && (
        <Text className="text-xs" style={{ color: colors.textMuted }}>
          {count} {pluralizeRu(count, ["специалист", "специалиста", "специалистов"])}
        </Text>
      )}
    </View>
  );
}
