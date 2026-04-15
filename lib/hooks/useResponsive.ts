import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const;

export interface ResponsiveValues {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Returns responsive breakpoint flags based on window width.
 * mobile: <640, tablet: 640-1024, desktop: >1024
 */
export function useResponsive(): ResponsiveValues {
  const { width } = useWindowDimensions();

  const isDesktop = width > BREAKPOINTS.tablet;
  const isTablet = !isDesktop && width >= BREAKPOINTS.mobile;
  const isMobile = !isDesktop && !isTablet;

  return { isMobile, isTablet, isDesktop, width };
}
