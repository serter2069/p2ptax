import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

interface SpecialistAboutProps {
  description: string | null | undefined;
}

/**
 * "О специалисте" section. Renders nothing if description is empty.
 */
export default function SpecialistAbout({ description }: SpecialistAboutProps) {
  if (!description) return null;
  return (
    <View className="mt-8">
      <Text
        className="uppercase mb-3"
        style={{
          fontSize: 12,
          letterSpacing: 3,
          color: colors.textSecondary,
          fontWeight: "600",
        }}
      >
        О специалисте
      </Text>
      <Text className="text-base leading-7" style={{ color: colors.text }}>
        {description}
      </Text>
    </View>
  );
}
