import { View, Text, Pressable, Animated } from "react-native";
import { useRef, useEffect } from "react";
import { colors } from "@/lib/theme";

interface NotificationPreferencesProps {
  pushEnabled: boolean;
  emailEnabled: boolean;
  onPushChange: (val: boolean) => void;
  onEmailChange: (val: boolean) => void;
}

function IosToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
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
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ width: 51, height: 31 }}
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

export default function NotificationPreferences({
  pushEnabled,
  emailEnabled,
  onPushChange,
  onEmailChange,
}: NotificationPreferencesProps) {
  return (
    <>
      <View className="flex-row items-center py-3 border-b border-border">
        <View className="flex-1 mr-3">
          <Text className="text-base text-text-base">Push-уведомления</Text>
          <Text className="text-xs text-text-mute mt-0.5">
            Новые запросы и сообщения
          </Text>
        </View>
        <IosToggle value={pushEnabled} onChange={onPushChange} />
      </View>
      <View className="flex-row items-center py-3 border-b border-border">
        <View className="flex-1 mr-3">
          <Text className="text-base text-text-base">Email-уведомления</Text>
          <Text className="text-xs text-text-mute mt-0.5">
            Дублировать уведомления на почту
          </Text>
        </View>
        <IosToggle value={emailEnabled} onChange={onEmailChange} />
      </View>
    </>
  );
}
