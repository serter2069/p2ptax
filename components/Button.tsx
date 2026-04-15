import React, { useState, useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  View,
  Platform,
  Animated,
} from 'react-native';
import { Colors } from '../constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'white' | 'outline-white';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const hoverBg: Record<string, string> = {
  primary: '#2368BE',
  secondary: Colors.bgPrimary,
  ghost: 'rgba(26,91,168,0.06)',
  danger: '#991818',
  outline: 'rgba(26,91,168,0.06)',
  white: '#F0F4FA',
  'outline-white': 'rgba(255,255,255,0.15)',
};

const variantClasses: Record<string, string> = {
  primary: 'bg-brandPrimary',
  secondary: 'bg-bgCard border border-border',
  ghost: 'bg-transparent',
  danger: 'bg-statusError',
  outline: 'bg-transparent border-2 border-brandPrimary',
  white: 'bg-white',
  'outline-white': 'bg-transparent border-2 border-white',
};

const labelClasses: Record<string, string> = {
  primary: 'text-white',
  secondary: 'text-textPrimary',
  ghost: 'text-brandPrimary',
  danger: 'text-white',
  outline: 'text-brandPrimary',
  white: 'text-brandPrimary',
  'outline-white': 'text-white',
};

const webTransition = Platform.OS === 'web'
  ? ({ transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease' } as any)
  : {};

export function Button({
  onPress,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const [hovered, setHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const hoverStyle: ViewStyle = (hovered && !isDisabled && Platform.OS === 'web')
    ? { backgroundColor: hoverBg[variant] }
    : {};

  const webProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  const indicatorColor = (variant === 'primary' || variant === 'danger' || variant === 'outline-white')
    ? '#FFFFFF'
    : (variant === 'ghost' || variant === 'outline')
      ? Colors.brandPrimary
      : Colors.textPrimary;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      className={`h-12 rounded-md items-center justify-center px-5 ${variantClasses[variant]} ${isDisabled ? 'opacity-45' : ''}`}
      style={[webTransition, hoverStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      dataSet={{ hoverManaged: '1' }}
      {...(webProps as any)}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color={indicatorColor} />
        </View>
      ) : (
        <Text className={`text-[15px] font-semibold ${labelClasses[variant]}`}>
          {children}
        </Text>
      )}
    </Pressable>
    </Animated.View>
  );
}
