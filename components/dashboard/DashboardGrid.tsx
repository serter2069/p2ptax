import React, { useState, useEffect } from "react";
import { View, useWindowDimensions, Platform } from "react-native";

/**
 * DashboardGrid — 12-column responsive grid for dashboard widgets.
 *
 * Usage:
 *   <DashboardGrid>
 *     <DashboardGrid.Col span={8}>{main content}</DashboardGrid.Col>
 *     <DashboardGrid.Col span={4}>{sidebar}</DashboardGrid.Col>
 *   </DashboardGrid>
 *
 * Desktop (>=1024px): true 12-col grid — spans respected.
 * Tablet (>=640px):   2-col fallback (span 6+6 or 12).
 * Mobile (<640px):    1-col stack — every child takes full width.
 *
 * On web, flex-direction is controlled via NativeWind CSS media queries
 * (sm: = 640px) so the grid responds instantly to viewport changes without
 * waiting for a JS re-render.
 */

const DESKTOP_BP = 1024;
const TABLET_BP = 640;

interface GridProps {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}

interface ColProps {
  children: React.ReactNode;
  /** Columns to span on desktop (1..12). */
  span?: number;
  /** Columns to span on tablet (1..2). Defaults to full-row on tablet. */
  tabletSpan?: 1 | 2;
  className?: string;
}

// On web, directly track window.innerWidth via window.resize so JS-driven
// flexBasis calculations stay in sync with the actual CSS viewport.
function useLayoutWidth(): number {
  const { width: dimWidth } = useWindowDimensions();
  const [webWidth, setWebWidth] = useState<number>(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return window.innerWidth;
    }
    return dimWidth;
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onResize = () => setWebWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      setWebWidth(window.innerWidth);
    }
  }, [dimWidth]);

  return Platform.OS === "web" ? webWidth : dimWidth;
}

function Grid({ children, gap = 24, className }: GridProps) {
  const width = useLayoutWidth();
  const isDesktop = width >= DESKTOP_BP;
  const isTablet = width >= TABLET_BP;

  return (
    <View
      className={className}
      style={{
        flexDirection: isTablet ? "row" : "column",
        // flexWrap only in row mode — column+wrap causes multi-column layout
        // inside constrained containers (ScrollView, SafeAreaView).
        flexWrap: isTablet ? "wrap" : "nowrap",
        gap,
        width: "100%",
      }}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<ColProps>(child)) return child;
        const span = child.props.span ?? 12;
        const tabletSpan = child.props.tabletSpan ?? 2;

        let basis: string;
        if (!isTablet) {
          basis = "100%";
        } else if (!isDesktop) {
          basis = tabletSpan === 1 ? `calc(50% - ${gap / 2}px)` : "100%";
        } else {
          const pct = (span / 12) * 100;
          basis = `calc(${pct}% - ${(gap * (12 - span)) / 12}px)`;
        }

        return (
          <View
            style={[
              {
                flexGrow: 0,
                flexShrink: 1,
                minWidth: 0,
                maxWidth: "100%",
              },
              isTablet
                ? { flexBasis: basis as unknown as number }
                : { width: "100%" },
            ]}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

function Col({ children, className }: ColProps) {
  // Width is applied by the parent Grid (via flexBasis). Col just renders.
  return <View className={className}>{children}</View>;
}

const DashboardGrid = Object.assign(Grid, { Col });

export default DashboardGrid;
export type { GridProps as DashboardGridProps, ColProps as DashboardColProps };
