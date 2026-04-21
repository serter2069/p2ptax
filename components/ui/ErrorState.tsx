import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";
import Button from "./Button";
import { colors } from "../../lib/theme";

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
        <AlertCircle size={32} color={colors.error} />
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
