import React from "react";
import { View, Text, Pressable } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { colors } from "../../lib/theme";

/**
 * ErrorBoundary — catches render-time crashes in children and shows
 * a friendly "Не удалось загрузить" overlay instead of the dev red-box
 * or white screen of death. Use to wrap admin/data-heavy screens.
 */

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Surface the error to the JS console so it is still discoverable in
    // dev tools, but do not propagate to the global error overlay.
    if (typeof console !== "undefined" && console.error) {
      console.error("[ErrorBoundary]", error, info?.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View
        className="flex-1 items-center justify-center bg-surface2 p-8"
        style={{ minHeight: 320 }}
      >
        <View
          className="items-center justify-center rounded-full bg-danger-soft"
          style={{ width: 72, height: 72 }}
        >
          <AlertCircle size={32} color={colors.error} />
        </View>
        <Text className="text-base font-medium text-text-base mt-4 text-center">
          {this.props.fallbackMessage ?? "Не удалось загрузить"}
        </Text>
        <Text className="text-sm text-text-mute mt-1 text-center">
          Попробуйте ещё раз
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Повторить"
          onPress={this.handleRetry}
          className="mt-4 rounded-xl bg-accent px-5 py-3"
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: 14 }}
          >
            Повторить
          </Text>
        </Pressable>
      </View>
    );
  }
}
