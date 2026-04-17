import { View, Text, Image } from "react-native";
import { colors } from "../../lib/theme";

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { wh: 36, textClass: "text-xs font-semibold" },
  md: { wh: 44, textClass: "text-sm font-semibold" },
  lg: { wh: 64, textClass: "text-xl font-semibold" },
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name, imageUrl, size = "md" }: AvatarProps) {
  const { wh, textClass } = sizeMap[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: wh,
          height: wh,
          borderRadius: wh / 2,
          borderWidth: 2,
          borderColor: '#f1f5f9',
          backgroundColor: colors.background,
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: wh,
        height: wh,
        backgroundColor: colors.primary,
      }}
    >
      <Text className={`${textClass} text-white`}>{getInitials(name)}</Text>
    </View>
  );
}
