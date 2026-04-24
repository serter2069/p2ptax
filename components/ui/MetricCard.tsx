import { View, Text } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { colors, textStyle } from "@/lib/theme";

export interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  lines?: string[];
  iconColor?: string;
  iconBg?: string;
}

/**
 * Credentials block card: icon + title + big value + bulleted body lines.
 * Used in the specialist profile credentials 3-up grid.
 */
export default function MetricCard({
  icon: Icon,
  title,
  value,
  lines = [],
  iconColor,
  iconBg,
}: MetricCardProps) {
  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 flex-1"
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        minHeight: 180,
      }}
    >
      <View
        className="items-center justify-center rounded-xl mb-3"
        style={{
          width: 40,
          height: 40,
          backgroundColor: iconBg ?? colors.accentSoft,
        }}
      >
        <Icon size={20} color={iconColor ?? colors.primary} />
      </View>

      <Text
        className="uppercase mb-2"
        style={{
          fontSize: 11,
          letterSpacing: 2,
          color: colors.textSecondary,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>

      <Text style={{ ...textStyle.h3, color: colors.text, marginBottom: 8 }}>
        {value}
      </Text>

      {lines.map((line, i) => (
        <View
          key={i}
          className="flex-row items-start mt-1"
          style={{ gap: 6 }}
        >
          <View
            className="rounded-full mt-1.5 flex-shrink-0"
            style={{
              width: 4,
              height: 4,
              backgroundColor: colors.textMuted,
            }}
          />
          <Text
            className="text-sm flex-1"
            style={{ color: colors.textSecondary, lineHeight: 20 }}
          >
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}
