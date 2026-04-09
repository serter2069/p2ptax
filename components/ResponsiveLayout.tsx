import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { Sidebar, SidebarNavItem, NavGroup } from './Sidebar';
import { BottomTabBar, BottomTabItem } from './BottomTabBar';
import { Colors, Spacing } from '../constants/Colors';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  navItems: SidebarNavItem[] | NavGroup[];
  /** Bottom tab items for mobile. If omitted, no bottom bar on mobile. */
  bottomTabs?: BottomTabItem[];
  userEmail?: string;
  onLogout?: () => void;
}

/**
 * Wraps content with a sidebar on tablet/desktop.
 * On mobile, renders children with an optional bottom tab bar.
 */
export function ResponsiveLayout({
  children,
  navItems,
  bottomTabs,
  userEmail,
  onLogout,
}: ResponsiveLayoutProps) {
  const { isMobile, sidebarWidth } = useBreakpoints();

  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileContent}>{children}</View>
        {bottomTabs && bottomTabs.length > 0 ? (
          <BottomTabBar items={bottomTabs} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar
        items={navItems}
        userEmail={userEmail}
        onLogout={onLogout}
        width={sidebarWidth}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    flex: 1,
    overflow: 'hidden' as any,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  mobileContent: {
    flex: 1,
    paddingBottom: 56, // bottom tab bar height
  },
});
