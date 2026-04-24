import { View, Text } from "react-native";
import { colors, gray } from "@/lib/theme";
import DuotoneIcon from "./DuotoneIcon";

type IconName =
  | "document-search"
  | "stamp"
  | "phone-clock"
  | "shield-check"
  | "clipboard"
  | "handshake"
  | "alert-triangle"
  | "clock";

interface ServiceCardProps {
  icon: IconName;
  title: string;
  body: string;
  statChip: string;
}

export default function ServiceCard({
  icon,
  title,
  body,
  statChip,
}: ServiceCardProps) {
  return (
    <View
      className="rounded-2xl"
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: colors.border,
        padding: 28,
        gap: 18,
        minWidth: 260,
      }}
    >
      <View
        className="rounded-xl items-center justify-center"
        style={{
          width: 64,
          height: 64,
          backgroundColor: colors.accentSoft,
        }}
      >
        <DuotoneIcon name={icon} size={36} />
      </View>

      <View style={{ gap: 10 }}>
        <Text
          className="font-bold"
          style={{ color: colors.text, fontSize: 22, letterSpacing: -0.3 }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          {body}
        </Text>
      </View>

      <View
        className="self-start rounded-full"
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: gray[100],
          marginTop: "auto",
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
          {statChip}
        </Text>
      </View>
    </View>
  );
}
