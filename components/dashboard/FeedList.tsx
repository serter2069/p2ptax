import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * FeedList — a simple single-purpose list inside a DashboardWidget.
 * Each row = icon + title + optional meta + optional right value + chevron.
 * Zero "smart" logic — callers compose the items up-front.
 */

export interface FeedItem {
  id: string;
  title: string;
  meta?: string;
  rightValue?: string;
  icon?: LucideIcon;
  /** Optional soft-coloured chip behind icon (e.g. status). */
  iconTone?: "primary" | "success" | "warning" | "danger" | "muted";
  onPress?: () => void;
}

export interface FeedListProps {
  items: FeedItem[];
  emptyText?: string;
  /** Cap to first N items; omit to show all. */
  limit?: number;
}

const TONE_BG: Record<NonNullable<FeedItem["iconTone"]>, string> = {
  primary: colors.accentSoft,
  success: colors.greenSoft,
  warning: colors.yellowSoft,
  danger: colors.dangerSoft,
  muted: colors.surface2,
};

const TONE_FG: Record<NonNullable<FeedItem["iconTone"]>, string> = {
  primary: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  muted: colors.textMuted,
};

export default function FeedList({ items, emptyText, limit }: FeedListProps) {
  const sliced = typeof limit === "number" ? items.slice(0, limit) : items;

  if (sliced.length === 0) {
    return (
      <View style={{ paddingVertical: 20 }}>
        <Text
          className="text-text-dim text-center"
          style={{ fontSize: 13 }}
        >
          {emptyText ?? "Список пуст"}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {sliced.map((item, idx) => {
        const Icon = item.icon;
        const tone = item.iconTone ?? "primary";
        const row = (
          <View
            className="flex-row items-center gap-3"
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              minHeight: 48,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            {Icon ? (
              <View
                className="rounded-lg items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: TONE_BG[tone],
                }}
              >
                <Icon size={16} color={TONE_FG[tone]} />
              </View>
            ) : null}
            <View className="flex-1 min-w-0">
              <Text
                className="text-text-base font-semibold"
                style={{ fontSize: 14 }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.meta ? (
                <Text
                  className="text-text-mute mt-0.5"
                  style={{ fontSize: 12 }}
                  numberOfLines={1}
                >
                  {item.meta}
                </Text>
              ) : null}
            </View>
            {item.rightValue ? (
              <Text
                className="text-text-base font-semibold"
                style={{ fontSize: 13 }}
              >
                {item.rightValue}
              </Text>
            ) : null}
            {item.onPress ? (
              <ChevronRight size={16} color={colors.textMuted} />
            ) : null}
          </View>
        );
        if (item.onPress) {
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={item.onPress}
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              {row}
            </Pressable>
          );
        }
        return <View key={item.id}>{row}</View>;
      })}
    </View>
  );
}
