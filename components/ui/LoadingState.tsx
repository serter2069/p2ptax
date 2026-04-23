import { useEffect, useRef } from "react";
import { View, ActivityIndicator, Animated, type DimensionValue } from "react-native";
import { colors, radiusValue } from "../../lib/theme";

export interface LoadingStateProps {
  variant?: "spinner" | "skeleton";
  lines?: number;
}

function SkeletonLines({ lines }: { lines: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const widths: DimensionValue[] = ["75%", "50%", "83%", "60%", "100%"];
  const heights = [20, 16, 16, 16, 16];

  return (
    <View testID="skeleton" style={{ padding: 16, gap: 4 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            height: heights[i % heights.length],
            width: widths[i % widths.length],
            borderRadius: radiusValue.sm,
            backgroundColor: colors.border,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

export default function LoadingState({
  variant = "spinner",
  lines = 3,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return <SkeletonLines lines={lines} />;
  }

  return (
    <View className="items-center justify-center py-16">
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
