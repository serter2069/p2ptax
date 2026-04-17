import { View, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Button from "./Button";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Что-то пошло не так",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center py-12 px-8">
      <View
        className="items-center justify-center rounded-full bg-red-50"
        style={{ width: 72, height: 72 }}
      >
        <Feather name="alert-circle" size={32} color="#f87171" />
      </View>
      <Text className="text-base font-medium text-slate-900 mt-4 text-center">
        {message}
      </Text>
      <Text className="text-sm text-slate-500 mt-1 text-center">
        Попробуйте ещё раз
      </Text>
      {onRetry && (
        <View className="mt-4">
          <Button
            variant="secondary"
            label="Повторить"
            onPress={onRetry}
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}
