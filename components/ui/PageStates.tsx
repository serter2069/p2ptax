import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

// --- LoadingState ---

export interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text }: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color={Colors.brandPrimary} />
      {text && (
        <Text className="mt-4 text-sm text-textMuted">{text}</Text>
      )}
    </View>
  );
}

// --- ErrorState ---

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Произошла ошибка',
  message = 'Не удалось загрузить данные. Попробуйте ещё раз.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-20">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
        <Feather name="alert-circle" size={32} color={Colors.statusError} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">{title}</Text>
      <Text className="max-w-[280px] text-center text-sm text-textMuted">
        {message}
      </Text>
      {onRetry && (
        <Pressable
          className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
          onPress={onRetry}
        >
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">
            Попробовать снова
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// --- NetworkErrorState ---

export interface NetworkErrorStateProps {
  onRetry?: () => void;
}

export function NetworkErrorState({ onRetry }: NetworkErrorStateProps) {
  return (
    <ErrorState
      title="Нет соединения"
      message="Проверьте подключение к интернету и попробуйте снова."
      onRetry={onRetry}
    />
  );
}
