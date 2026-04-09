import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { Sidebar, SidebarNavItem, NavGroup } from './Sidebar';
import { BottomTabBar, BottomTabItem } from './BottomTabBar';
import { Colors, Spacing } from '../constants/Colors';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  navItems: SidebarNavItem[] | NavGroup[];
  /** Tab items for mobile bottom bar */
  tabItems?: BottomTabItem[];
  userEmail?: string;
  onLogout?: () => void;
}

/**
 * Wraps content with a sidebar on tablet/desktop.
 * On mobile, renders children with a bottom tab bar.
 */
export function ResponsiveLayout({
  children,
  navItems,
  tabItems,
  userEmail,
  onLogout,
}: ResponsiveLayoutProps) {
  const { isMobile, sidebarWidth } = useBreakpoints();

  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileContent}>
          {children}
        </View>
        {tabItems && tabItems.length > 0 ? (
          <BottomTabBar items={tabItems} />
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
  },
});
