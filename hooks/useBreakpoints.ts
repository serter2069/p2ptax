import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '../constants/Colors';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointValues {
  width: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Number of columns for catalog grids */
  numColumns: number;
  /** Max content width for centered layouts */
  contentMaxWidth: number | string;
  /** Sidebar width when visible */
  sidebarWidth: number;
}

export function useBreakpoints(): BreakpointValues {
  const { width } = useWindowDimensions();

  const isDesktop = width >= Breakpoints.desktop;
  const isTablet = !isDesktop && width >= Breakpoints.tablet;
  const isMobile = !isDesktop && !isTablet;

  let breakpoint: Breakpoint = 'mobile';
  if (isDesktop) breakpoint = 'desktop';
  else if (isTablet) breakpoint = 'tablet';

  // Grid columns for FlatList catalogs
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  // Max width for centered single-column content
  const contentMaxWidth: number | string = isDesktop ? 1200 : isTablet ? 900 : 430;

  // Sidebar width
  const sidebarWidth = isDesktop ? 240 : 200;

  return {
    width,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    numColumns,
    contentMaxWidth,
    sidebarWidth,
  };
}
