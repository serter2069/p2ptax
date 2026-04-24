import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { TrendingUp, TrendingDown, Minus } from "lucide-react-native";
import { colors, overlay, textStyle, spacing } from "@/lib/theme";

export type StatTrend = "up" | "down" | "flat";
export type StatColor = "primary" | "success" | "warning" | "muted";

export interface HeroStat {
  label: string;
  value: string | number;
  trend?: StatTrend;
  trendValue?: string;
  color?: StatColor;
}

export interface DashboardHeroProps {
  greeting: string;
  subtitle?: string;
  primaryStats: HeroStat[];
  illustration?: React.ReactNode;
  /** Optional tone override. Default "accent" (brand blue background). */
  tone?: "accent" | "surface";
}

function valueColorFor(tone: "accent" | "surface", color?: StatColor): string {
  if (tone === "accent") return colors.white;
  if (color === "success") return colors.success;
  if (color === "warning") return colors.warning;
  if (color === "muted") return colors.textSecondary;
  return colors.text;
}

function labelColorFor(tone: "accent" | "surface"): string {
  return tone === "accent" ? overlay.white75 : colors.textSecondary;
}

function TrendIcon({ trend, tone }: { trend: StatTrend; tone: "accent" | "surface" }) {
  const size = 12;
  const color = tone === "accent" ? overlay.white80 : colors.textSecondary;
  if (trend === "up") return <TrendingUp size={size} color={color} />;
  if (trend === "down") return <TrendingDown size={size} color={color} />;
  return <Minus size={size} color={color} />;
}

export default function DashboardHero({
  greeting,
  subtitle,
  primaryStats,
  illustration,
  tone = "accent",
}: DashboardHeroProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 640;
  const bg = tone === "accent" ? colors.accent : colors.surface;
  const greetingColor = tone === "accent" ? colors.white : colors.text;
  const subtitleColor = tone === "accent" ? overlay.white80 : colors.textSecondary;
  const tileBg = tone === "accent" ? overlay.white15 : colors.surface2;

  const tileBorder = tone === "accent" ? overlay.white15 : colors.border;

  const stats = primaryStats.slice(0, 4);

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        paddingHorizontal: isDesktop ? spacing.xl : spacing.lg,
        paddingVertical: isDesktop ? spacing.xl : spacing.lg,
        borderWidth: tone === "surface" ? 1 : 0,
        borderColor: colors.border,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: tone === "accent" ? 0.18 : 0.04,
        shadowRadius: 14,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          gap: isDesktop ? spacing.xl : spacing.lg,
        }}
      >
        {/* Left: greeting + subtitle */}
        <View style={{ flex: isDesktop ? 1 : undefined }}>
          <Text
            style={{
              ...(isDesktop ? textStyle.h1 : textStyle.h2),
              color: greetingColor,
            }}
          >
            {greeting}
          </Text>
          {subtitle ? (
            <Text
              style={{
                ...textStyle.body,
                color: subtitleColor,
                marginTop: spacing.xs,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
          {illustration && isDesktop ? (
            <View style={{ marginTop: spacing.lg }}>{illustration}</View>
          ) : null}
        </View>

        {/* Right: 2x2 stats grid on desktop, horizontal scroll on mobile */}
        <View
          style={{
            flex: isDesktop ? 1 : undefined,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.md,
          }}
        >
          {stats.map((stat, i) => (
            <View
              key={`${stat.label}-${i}`}
              style={{
                flexBasis: isTablet ? "48%" : "48%",
                flexGrow: 1,
                minWidth: 120,
                borderRadius: 14,
                padding: spacing.md,
                backgroundColor: tileBg,
                borderWidth: 1,
                borderColor: tileBorder,
              }}
            >
              <Text
                style={{
                  ...textStyle.caption,
                  color: labelColorFor(tone),
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
                numberOfLines={1}
              >
                {stat.label}
              </Text>
              <Text
                style={{
                  fontSize: isDesktop ? 34 : 28,
                  lineHeight: isDesktop ? 40 : 34,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  color: valueColorFor(tone, stat.color),
                  marginTop: spacing.xs,
                }}
                numberOfLines={1}
              >
                {stat.value}
              </Text>
              {stat.trendValue || stat.trend ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  {stat.trend ? <TrendIcon trend={stat.trend} tone={tone} /> : null}
                  {stat.trendValue ? (
                    <Text
                      style={{
                        ...textStyle.caption,
                        color: labelColorFor(tone),
                      }}
                    >
                      {stat.trendValue}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
