import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 bg-bgPrimary items-center justify-center p-8">
          <Text className="text-xl font-bold text-textPrimary mb-3">Что-то пошло не так</Text>
          <Text className="text-[15px] text-textSecondary text-center mb-4 max-w-[360px]">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </Text>
          {__DEV__ && this.state.error && (
            <Text className="text-[11px] text-statusError text-center mb-4 max-w-[480px] font-mono">
              {this.state.error.message}
            </Text>
          )}
          <Pressable
            className="bg-brandPrimary px-6 py-3 rounded-[12px]"
            onPress={this.handleRetry}
          >
            <Text className="text-[15px] font-semibold text-white">Попробовать снова</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
