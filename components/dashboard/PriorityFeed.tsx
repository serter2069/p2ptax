import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { colors, textStyle, spacing } from "@/lib/theme";

export type Urgency = "high" | "medium" | "low";

export interface PriorityItem {
  id: string;
  icon?: LucideIcon;
  title: string;
  meta: string;
  urgency: Urgency;
  action?: { label: string; onPress: () => void };
}

export interface PriorityFeedProps {
  title: string;
  items: PriorityItem[];
  emptyMessage?: string;
  headerAction?: React.ReactNode;
}

function urgencyColor(u: Urgency): string {
  switch (u) {
    case "high":
      return colors.danger;
    case "medium":
      return colors.warning;
    case "low":
      return colors.textMuted;
  }
}

function urgencyTint(u: Urgency): string {
  switch (u) {
    case "high":
      return colors.dangerSoft;
    case "medium":
      return colors.yellowSoft;
    case "low":
      return colors.surface2;
  }
}

export default function PriorityFeed({
  title,
  items,
  emptyMessage,
  headerAction,
}: PriorityFeedProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ ...textStyle.h4, color: colors.text }}>{title}</Text>
        {headerAction ? <View>{headerAction}</View> : null}
      </View>

      {/* Body */}
      {items.length === 0 ? (
        <View style={{ padding: spacing.lg, alignItems: "center" }}>
          <Text
            style={{
              ...textStyle.body,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            {emptyMessage ?? "Нет приоритетных задач"}
          </Text>
        </View>
      ) : (
        items.map((item, i) => {
          const Icon = item.icon;
          const isLast = i === items.length - 1;
          return (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              {/* Left color bar */}
              <View
                style={{
                  width: 4,
                  alignSelf: "stretch",
                  backgroundColor: urgencyColor(item.urgency),
                }}
              />
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  gap: spacing.md,
                }}
              >
                {Icon ? (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: urgencyTint(item.urgency),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} color={urgencyColor(item.urgency)} />
                  </View>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      ...textStyle.bodyBold,
                      color: colors.text,
                    }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      ...textStyle.small,
                      color: colors.textSecondary,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.meta}
                  </Text>
                </View>
                {item.action ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.action.label}
                    onPress={item.action.onPress}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: spacing.md,
                      minHeight: 44,
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.accent,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {item.action.label}
                    </Text>
                    <ChevronRight size={16} color={colors.accent} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
