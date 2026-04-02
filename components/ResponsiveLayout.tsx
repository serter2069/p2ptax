import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { Sidebar, SidebarNavItem } from './Sidebar';
import { Colors } from '../constants/Colors';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  navItems: SidebarNavItem[];
  userEmail?: string;
  onLogout?: () => void;
}

/**
 * Wraps content with a sidebar on tablet/desktop.
 * On mobile, renders children directly without sidebar.
 */
export function ResponsiveLayout({
  children,
  navItems,
  userEmail,
  onLogout,
}: ResponsiveLayoutProps) {
  const { isMobile, sidebarWidth } = useBreakpoints();

  if (isMobile) {
    return <>{children}</>;
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
});
