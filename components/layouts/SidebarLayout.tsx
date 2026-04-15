import React from 'react';
import { View } from 'react-native';
import { useResponsive } from '../../lib/hooks/useResponsive';
import { Sidebar, SidebarNavItem, NavGroup } from '../Sidebar';
import { Colors } from '../../constants/Colors';

const SIDEBAR_WIDTH = 240;

interface SidebarLayoutProps {
  children: React.ReactNode;
  /** Navigation items for the sidebar */
  navItems: SidebarNavItem[] | NavGroup[];
  /** User email shown in sidebar footer */
  userEmail?: string;
  /** Logout handler */
  onLogout?: () => void;
}

/**
 * Desktop: sidebar navigation + content area.
 * Mobile/tablet: renders children only (bottom tabs handled by parent).
 */
export function SidebarLayout({
  children,
  navItems,
  userEmail,
  onLogout,
}: SidebarLayoutProps) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.bgPrimary }}>
      <Sidebar
        items={navItems}
        userEmail={userEmail}
        onLogout={onLogout}
        width={SIDEBAR_WIDTH}
      />
      <View style={{ flex: 1, overflow: 'hidden' as any }}>{children}</View>
    </View>
  );
}
