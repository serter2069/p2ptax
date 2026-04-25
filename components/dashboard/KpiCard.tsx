import React from "react";
import { View, Text, Pressable } from "react-native";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * KpiCard — compact KPI cell: icon + big value + label + optional trend.
 * Designed for the "top row" of role dashboards (client 3x, specialist 4x,
 * admin 4x). Looks deliberately dense, not airy.
 */

export type KpiTrend = "up" | "down" | "flat";
export type KpiTone = "primary" | "success" | "warning" | "danger" | "muted";

export interface KpiCardProps {
  label: string;
  value: string | number;
  /** Optional secondary context: "сегодня", "неделя", "X / Y". */
  hint?: string;
  icon?: LucideIcon;
  trend?: KpiTrend;
  /** e.g. "+3 сегодня" / "-12% vs неделя". */
  trendLabel?: string;
  tone?: KpiTone;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const TONE_MAP: Record<KpiTone, { iconBg: string; iconColor: string; valueColor: string }> = {
  primary: { iconBg: colors.accentSoft, iconColor: colors.accent, valueColor: colors.text },
  success: { iconBg: colors.greenSoft, iconColor: colors.success, valueColor: colors.text },
  warning: { iconBg: colors.yellowSoft, iconColor: colors.warning, valueColor: colors.text },
  danger: { iconBg: colors.dangerSoft, iconColor: colors.danger, valueColor: colors.text },
  muted: { iconBg: colors.surface2, iconColor: colors.textMuted, valueColor: colors.text },
};

function TrendIcon({ trend }: { trend: KpiTrend }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const c =
    trend === "up" ? colors.success : trend === "down" ? colors.danger : colors.textMuted;
  return <Icon size={12} color={c} />;
}

export default function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  trendLabel,
  tone = "primary",
  onPress,
  accessibilityLabel,
}: KpiCardProps) {
  const palette = TONE_MAP[tone];

  const content = (
    <View
      className="bg-white rounded-2xl border border-border"
      style={{
        padding: 16,
        gap: 12,
        minHeight: 112,
      }}
    >
      <View className="flex-row items-center justify-between">
        {Icon ? (
          <View
            className="rounded-xl items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: palette.iconBg,
            }}
          >
            <Icon size={18} color={palette.iconColor} />
          </View>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}
        {trend ? (
          <View
            className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              backgroundColor:
                trend === "up"
                  ? colors.greenSoft
                  : trend === "down"
                    ? colors.dangerSoft
                    : colors.surface2,
            }}
          >
            <TrendIcon trend={trend} />
            {trendLabel ? (
              <Text
                style={{ fontSize: 12, fontWeight: "600" }}
                className={
                  trend === "up"
                    ? "text-success"
                    : trend === "down"
                      ? "text-danger"
                      : "text-text-dim"
                }
              >
                {trendLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View>
        <Text
          className="font-extrabold"
          style={{
            color: palette.valueColor,
            fontSize: 26,
            lineHeight: 30,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text
          className="text-text-mute mt-1"
          style={{ fontSize: 13, lineHeight: 16 }}
          numberOfLines={2}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            className="text-text-dim mt-1"
            style={{ fontSize: 12 }}
            numberOfLines={1}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}
