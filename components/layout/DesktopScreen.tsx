import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { colors, spacing, textStyle } from "@/lib/theme";

/**
 * DesktopScreen — universal layout template that kills "mobile-stretched-to-
 * desktop" across interior pages.
 *
 * Desktop (>=1024px):
 *   - centered content at max-w 1200px (configurable via `maxWidth`)
 *   - large H1 + optional subtitle (top-left)
 *   - optional header actions (top-right)
 *   - optional right-side sidebar (2/3 main + 1/3 sidebar)
 *   - optional filter bar below title
 *   - generous horizontal padding (32px)
 *   - 24-32px vertical rhythm between sections
 *
 * Tablet (640-1023px):
 *   - centered content at 720px
 *   - sidebar stacks below main (if provided)
 *   - H2-sized title
 *
 * Mobile (<640px):
 *   - pass-through: no max-width, minimal horizontal padding
 *   - existing mobile UX (HeaderHome + bottom tabs) remains untouched
 *
 * Drop-in replacement for `<ResponsiveContainer>`: it does not add any
 * ScrollView of its own, so callers keep full control over their scroll /
 * RefreshControl behavior. Place it INSIDE the ScrollView / SafeAreaView.
 */

const DESKTOP_BP = 1024;
const TABLET_BP = 640;

interface DesktopScreenProps {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  sidebar?: React.ReactNode;
  filters?: React.ReactNode;
  maxWidth?: number;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function DesktopScreen({
  title,
  subtitle,
  headerActions,
  sidebar,
  filters,
  // iter10 Phase 3a: default content column is 960px (multi-model consensus).
  // Sidebar is provided by AppShell at 240px — the 960 column sits to the
  // right and centers within the remaining width.
  maxWidth = 960,
  fullWidth = false,
  children,
}: DesktopScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;
  const isTablet = width >= TABLET_BP;

  // Mobile: pass-through (preserve bottom-tab mobile UX).
  if (!isTablet) {
    return <View className="flex-1 px-4">{children}</View>;
  }

  const effectiveMaxWidth = fullWidth
    ? 100000
    : isDesktop
      ? maxWidth
      : 720;

  const horizontalPadding = isDesktop ? spacing.xl : spacing.lg;
  const topPadding = isDesktop ? spacing.xl : spacing.lg;
  const bottomPadding = isDesktop ? spacing.xxl : spacing.xl;

  const hasHeader = Boolean(title || subtitle || headerActions);

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        flex: 1,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: effectiveMaxWidth,
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          flex: 1,
        }}
      >
        {hasHeader && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: spacing.lg,
              flexWrap: "wrap",
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1, minWidth: 240 }}>
              {title ? (
                <Text
                  style={{
                    ...(isDesktop ? textStyle.h1 : textStyle.h2),
                    color: colors.text,
                  }}
                >
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text
                  style={{
                    ...textStyle.body,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {headerActions ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                {headerActions}
              </View>
            ) : null}
          </View>
        )}

        {filters ? (
          <View
            style={{
              marginBottom: spacing.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {filters}
          </View>
        ) : null}

        {sidebar && isDesktop ? (
          <View
            style={{
              flexDirection: "row",
              gap: spacing.xl,
              alignItems: "flex-start",
              flex: 1,
            }}
          >
            <View style={{ flex: 2, minWidth: 0 }}>{children}</View>
            <View style={{ flex: 1, minWidth: 260, maxWidth: 360 }}>
              {sidebar}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, minWidth: 0 }}>
            {children}
            {sidebar && !isDesktop ? (
              <View style={{ marginTop: spacing.lg }}>{sidebar}</View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
