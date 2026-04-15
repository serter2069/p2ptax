import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../../lib/hooks/useResponsive';
import { Spacing } from '../../constants/Colors';

interface PageContainerProps {
  children: React.ReactNode;
  /** Override max width on desktop (default 960) */
  maxWidth?: number;
  /** Additional style applied to the outer wrapper */
  style?: ViewStyle;
  /** Remove default horizontal padding */
  noPadding?: boolean;
}

/**
 * Centers page content with max-width constraint on desktop.
 * On mobile, fills full width with horizontal padding.
 */
export function PageContainer({
  children,
  maxWidth = 960,
  style,
  noPadding,
}: PageContainerProps) {
  const { isDesktop } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        isDesktop && { maxWidth, alignSelf: 'center' as const },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  padding: {
    paddingHorizontal: Spacing.lg,
  },
});
