import { View, Text } from "react-native";
import { colors, textStyle } from "@/lib/theme";

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
      <Text
        style={
          isDesktop
            ? { ...textStyle.h3, color: colors.text }
            : { ...textStyle.h4, color: colors.text }
        }
      >
        Специалисты
      </Text>
      {count !== null && count > 0 && (
        <Text className="text-xs" style={{ color: colors.textMuted }}>
          {count} специалистов
        </Text>
      )}
    </View>
  );
}
