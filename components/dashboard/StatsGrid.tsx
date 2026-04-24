import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react-native";
import { colors, textStyle, spacing } from "@/lib/theme";

export type GridStatColor = "primary" | "success" | "warning" | "danger" | "muted";

export interface GridStat {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  color?: GridStatColor;
  icon?: LucideIcon;
}

export interface StatsGridProps {
  stats: GridStat[];
  title?: string;
}

function colorFor(c?: GridStatColor): string {
  switch (c) {
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "danger":
      return colors.danger;
    case "muted":
      return colors.textSecondary;
    case "primary":
      return colors.primary;
    default:
      return colors.text;
  }
}

function tintFor(c?: GridStatColor): string {
  switch (c) {
    case "success":
      return colors.greenSoft;
    case "warning":
      return colors.yellowSoft;
    case "danger":
      return colors.dangerSoft;
    case "primary":
      return colors.accentSoft;
    default:
      return colors.surface2;
  }
}

function TrendBadge({ trend, value }: { trend?: "up" | "down" | "flat"; value?: string }) {
  if (!trend && !value) return null;
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const c = trend === "up" ? colors.success : trend === "down" ? colors.danger : colors.textSecondary;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
      {trend ? <Icon size={12} color={c} /> : null}
      {value ? (
        <Text style={{ ...textStyle.caption, color: c }}>{value}</Text>
      ) : null}
    </View>
  );
}

export default function StatsGrid({ stats, title }: StatsGridProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 640;
  const cols = isDesktop ? 4 : isTablet ? 3 : 2;
  const flexBasis = `${100 / cols - 2}%`;

  return (
    <View>
      {title ? (
        <Text
          style={{
            ...textStyle.h4,
            color: colors.text,
            marginBottom: spacing.md,
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.md,
        }}
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <View
              key={`${stat.label}-${i}`}
              style={{
                flexBasis: flexBasis as never,
                flexGrow: 1,
                minWidth: 140,
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 1,
              }}
            >
              {Icon ? (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tintFor(stat.color),
                    marginBottom: spacing.sm,
                  }}
                >
                  <Icon size={16} color={colorFor(stat.color)} />
                </View>
              ) : null}
              <Text
                style={{
                  ...textStyle.caption,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
                numberOfLines={1}
              >
                {stat.label}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  lineHeight: 34,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  color: colorFor(stat.color),
                  marginTop: 4,
                }}
                numberOfLines={1}
              >
                {stat.value}
              </Text>
              <TrendBadge trend={stat.trend} value={stat.trendValue} />
            </View>
          );
        })}
      </View>
    </View>
  );
}
