import React from "react";
import { View, Text, Pressable } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * DashboardWidget — base card used as a slot for feed/table/progress blocks.
 * Gives a consistent header (title + optional action link) and content area.
 * Children control their own internal layout.
 */

export interface DashboardWidgetProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Right-aligned action link in the header (e.g. "Все →"). */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Optional header-right custom node (overrides actionLabel). */
  headerRight?: React.ReactNode;
  /** Remove inner padding (for lists/tables that paint their own rows). */
  flush?: boolean;
  /** Accent left border (e.g. for "alerts" widget). */
  accentBar?: "warning" | "danger" | "success" | "primary";
  children: React.ReactNode;
}

const BAR_COLOR: Record<
  NonNullable<DashboardWidgetProps["accentBar"]>,
  string
> = {
  warning: colors.warning,
  danger: colors.danger,
  success: colors.success,
  primary: colors.accent,
};

export default function DashboardWidget({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  onActionPress,
  headerRight,
  flush = false,
  accentBar,
  children,
}: DashboardWidgetProps) {
  return (
    <View
      className="bg-white rounded-2xl border border-border overflow-hidden"
      style={
        accentBar
          ? {
              borderLeftWidth: 3,
              borderLeftColor: BAR_COLOR[accentBar],
            }
          : undefined
      }
    >
      <View
        className="flex-row items-center gap-3 border-b border-border"
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface2,
        }}
      >
        {Icon ? (
          <View
            className="rounded-lg items-center justify-center bg-accent-soft"
            style={{ width: 32, height: 32 }}
          >
            <Icon size={16} color={colors.accent} />
          </View>
        ) : null}
        <View className="flex-1 min-w-0">
          <Text
            className="text-text-base font-bold"
            style={{ fontSize: 15 }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-text-mute mt-0.5"
              style={{ fontSize: 12 }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight
          ? headerRight
          : actionLabel && onActionPress
            ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={actionLabel}
                  onPress={onActionPress}
                  className="py-1 px-2 rounded-md"
                >
                  <Text
                    className="text-accent font-semibold"
                    style={{ fontSize: 13 }}
                  >
                    {actionLabel}
                  </Text>
                </Pressable>
              )
            : null}
      </View>
      <View style={flush ? undefined : { padding: 16 }}>{children}</View>
    </View>
  );
}
