import React from "react";
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import { colors, textStyle, spacing, AVATAR_COLORS } from "@/lib/theme";

export interface RecentWin {
  id: string;
  specialistName: string;
  amount?: number | null;
  savedAmount?: number | null;
  days?: number | null;
  ifnsLabel?: string | null;
  city?: string | null;
  category?: string | null;
  date?: string | null;
}

export interface RecentWinsStripProps {
  title?: string;
  items: RecentWin[];
  subtitle?: string;
}

function formatRub(value: number): string {
  if (value >= 1_000_000) {
    const mln = value / 1_000_000;
    return `${mln.toFixed(mln >= 10 ? 0 : 1).replace(/\.0$/, "")} млн ₽`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} тыс ₽`;
  }
  return `${value} ₽`;
}

function daysWord(d: number): string {
  const mod10 = d % 10;
  const mod100 = d % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}

function WinCard({ item, index }: { item: RecentWin; index: number }) {
  const tint = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const hasAmounts = item.amount != null || item.savedAmount != null;

  return (
    <View
      style={{
        width: 280,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: spacing.sm,
        }}
      >
        <Avatar name={item.specialistName} size="sm" tint={tint} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ ...textStyle.bodyBold, color: colors.text }}
            numberOfLines={1}
          >
            {item.specialistName}
          </Text>
          {item.city || item.ifnsLabel ? (
            <Text
              style={{ ...textStyle.caption, color: colors.textSecondary }}
              numberOfLines={1}
            >
              {[item.city, item.ifnsLabel].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>
        <CheckCircle2 size={18} color={colors.success} />
      </View>

      {/* Money row */}
      {hasAmounts ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 4,
          }}
        >
          {item.amount != null ? (
            <Text
              style={{
                ...textStyle.small,
                color: colors.textMuted,
                textDecorationLine: "line-through",
              }}
            >
              {formatRub(item.amount)}
            </Text>
          ) : null}
          {item.savedAmount != null ? (
            <>
              {item.amount != null ? (
                <Text style={{ ...textStyle.small, color: colors.textMuted }}>
                  →
                </Text>
              ) : null}
              <Text
                style={{
                  ...textStyle.h4,
                  color: colors.success,
                }}
              >
                {formatRub(item.savedAmount)}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {/* Meta row */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 4,
          alignItems: "center",
        }}
      >
        {item.category ? (
          <View
            style={{
              backgroundColor: colors.accentSoft,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.accentSoftInk,
              }}
              numberOfLines={1}
            >
              {item.category}
            </Text>
          </View>
        ) : null}
        {item.days != null ? (
          <Text style={{ ...textStyle.caption, color: colors.textSecondary }}>
            {item.days} {daysWord(item.days)}
          </Text>
        ) : null}
        {item.date ? (
          <Text style={{ ...textStyle.caption, color: colors.textMuted }}>
            · {item.date}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function RecentWinsStrip({
  title = "Недавние победы",
  subtitle,
  items,
}: RecentWinsStripProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  if (items.length === 0) return null;

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ ...textStyle.h4, color: colors.text }}>{title}</Text>
          {subtitle ? (
            <Text
              style={{
                ...textStyle.small,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.md,
          paddingRight: isDesktop ? 0 : spacing.md,
        }}
      >
        {items.map((item, i) => (
          <WinCard key={item.id} item={item} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}
