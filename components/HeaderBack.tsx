import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface HeaderBackProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function HeaderBack({ title, rightAction }: HeaderBackProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center h-14 bg-white border-b border-slate-200 px-4">
      <Pressable
        accessibilityLabel="Назад"
        onPress={() => router.back()}
        className="w-11 h-11 items-center justify-center -ml-2"
      >
        <FontAwesome name="arrow-left" size={18} color="#0f172a" />
      </Pressable>
      <Text className="flex-1 text-center text-base font-semibold text-slate-900" numberOfLines={1}>
        {title}
      </Text>
      {rightAction ? (
        <View className="w-11 h-11 items-center justify-center -mr-2">
          {rightAction}
        </View>
      ) : (
        <View className="w-11" />
      )}
    </View>
  );
}
