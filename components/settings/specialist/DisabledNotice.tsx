import { View, Text, Pressable } from "react-native";

interface DisabledNoticeProps {
  onGoToProfileTab: () => void;
}

export default function DisabledNotice({
  onGoToProfileTab,
}: DisabledNoticeProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-5 py-8 mb-4 items-center">
      <Text className="text-base font-semibold text-text-base mb-2 text-center">
        Режим специалиста выключен
      </Text>
      <Text className="text-sm text-text-mute text-center mb-4">
        Включите его на вкладке Профиль, чтобы редактировать профиль специалиста.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onGoToProfileTab}
        className="px-4 py-2 rounded-xl bg-accent-soft"
      >
        <Text className="text-sm font-medium text-accent">
          Перейти на Профиль
        </Text>
      </Pressable>
    </View>
  );
}
