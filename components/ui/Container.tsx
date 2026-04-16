import React from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Breakpoints, Spacing } from '../../constants/Colors';

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

/**
 * Responsive max-width wrapper.
 * - Mobile (<tablet breakpoint): full width
 * - Tablet/Desktop: centered with maxWidth (default 800)
 */
export function Container({ children, maxWidth = 800, style, padded = true }: ContainerProps) {
  const { width } = useWindowDimensions();
  const shouldConstrain = width >= Breakpoints.tablet;

  return (
    <View
      style={[
        {
          width: '100%',
          alignSelf: 'center',
          maxWidth: shouldConstrain ? maxWidth : undefined,
          paddingHorizontal: padded ? Spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
