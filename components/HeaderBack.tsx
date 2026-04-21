import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface HeaderBackProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function HeaderBack({ title, rightAction }: HeaderBackProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center h-14 bg-white border-b border-slate-200 px-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Назад"
        onPress={() => router.back()}
        className="w-11 h-11 items-center justify-center -ml-2"
      >
        <ArrowLeft size={18} color={colors.text} />
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
