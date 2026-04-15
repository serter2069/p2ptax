import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '../../lib/hooks/useResponsive';

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
      className={`flex-1 w-full ${!noPadding ? 'px-4' : ''}`}
      style={[
        isDesktop && { maxWidth, alignSelf: 'center' as const },
        style,
      ]}
    >
      {children}
    </View>
  );
}
