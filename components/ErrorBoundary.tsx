import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '../constants/Colors';

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
        <View style={styles.container}>
          <Text style={styles.title}>Что-то пошло не так</Text>
          <Text style={styles.message}>
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debug}>{this.state.error.message}</Text>
          )}
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Попробовать снова</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 360,
  },
  debug: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 480,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
