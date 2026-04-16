import { useWindowDimensions } from 'react-native';

/**
 * Thin generic breakpoint hook for primitives in components/ui/.
 * Project-specific helpers (numColumns, sidebarWidth, contentMaxWidth) live
 * in `useBreakpoints` (plural) — keep them decoupled.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface BreakpointInfo {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  atLeast: (bp: BreakpointKey) => boolean;
}

export function useBreakpoint(): BreakpointInfo {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    atLeast: (bp: BreakpointKey) => width >= BREAKPOINTS[bp],
  };
}
