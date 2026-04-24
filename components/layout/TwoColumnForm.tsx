import React from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";

/**
 * TwoColumnForm — Stripe/Linear-style auth/onboarding/form layout.
 *
 * Desktop (>=640px):
 *   left column (50%)  = brand / info / tips / illustration / preview
 *   right column (50%) = actual interactive form
 *
 * Mobile (<640px):
 *   single column: only the `right` child is rendered (the form).
 *   `left` is intentionally hidden on mobile because cramming a hero +
 *   a long form into one scroll wastes screen space.
 *
 * Both halves are independently scrollable on desktop so a tall info
 * column never pushes the submit button below the fold.
 *
 * Props are intentionally minimal: callers compose whatever they need
 * inside `left` and `right`. No "title", no "subtitle" — do not ossify
 * the pattern with implicit structure.
 */

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  /** Optional: force desktop split even on narrow widths (rare). */
  forceDesktop?: boolean;
  /** Optional: max content width of the inner columns on wide screens. */
  maxContentWidth?: number;
  /** Optional className applied to the outer container. */
  className?: string;
  children?: never;
}

const DESKTOP_BP = 640;

export default function TwoColumnForm({
  left,
  right,
  forceDesktop = false,
  maxContentWidth = 520,
  className,
}: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = forceDesktop || width >= DESKTOP_BP;

  if (!isDesktop) {
    // Mobile: only the form column. Left (brand/info) is dropped to keep
    // mobile lean and avoid double-scroll.
    return (
      <View className={className ?? "flex-1 bg-white"}>
        {right}
      </View>
    );
  }

  return (
    <View className={className ?? "flex-1 flex-row bg-white"}>
      {/* Left — info / brand / illustration (50%) */}
      <View
        className="flex-1 bg-accent-soft"
        style={{ minWidth: 0 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 48,
            paddingVertical: 56,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: maxContentWidth,
              alignSelf: "center",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {left}
          </View>
        </ScrollView>
      </View>

      {/* Right — form (50%) */}
      <View
        className="flex-1 bg-white"
        style={{ minWidth: 0 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 48,
            paddingVertical: 56,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              width: "100%",
              maxWidth: maxContentWidth,
              alignSelf: "center",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {right}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
