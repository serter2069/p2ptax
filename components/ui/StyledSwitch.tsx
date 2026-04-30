import { useRef, useEffect } from "react";
import { Animated, Pressable } from "react-native";
import { colors } from "@/lib/theme";

/**
 * Unified iOS-style toggle switch.
 * Replaces all bare RN <Switch> usages across the app.
 * Matches the design used in components/settings/ProfileTab.tsx (IosToggle).
 */
interface StyledSwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function StyledSwitch({ value, onValueChange, disabled = false }: StyledSwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E5EA", colors.primary],
  });

  const thumbPos = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      style={{ width: 51, height: 31, opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={{
          width: 51,
          height: 31,
          borderRadius: 15.5,
          backgroundColor: trackColor,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: 27,
            height: 27,
            borderRadius: 13.5,
            backgroundColor: "white",
            position: "absolute",
            left: thumbPos,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
