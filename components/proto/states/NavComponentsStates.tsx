import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// Layout helper
// ---------------------------------------------------------------------------
function useLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return { isDesktop, width };
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------
function LogoBlock() {
  return (
    <View style={s.logoRow}>
      <View style={s.logoIcon}>
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text style={s.logoText}>Nalogovik</Text>
    </View>
  );
}

function NotifBell({ hasNotif = false }: { hasNotif?: boolean }) {
  return (
    <View>
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {hasNotif && <View style={s.redDot} />}
    </View>
  );
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <View style={s.avatarCircle}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Public Header -- Desktop
// ---------------------------------------------------------------------------
function DesktopPublicHeader() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Public Header (Desktop)</Text>
      <Text style={s.sectionDesc}>Guest navigation with brand + CTA</Text>
      <View style={s.headerBar}>
        <LogoBlock />
        <View style={s.navLinks}>
          <Text style={[s.navLink, s.navLinkActive]}>Glavnaya</Text>
          <Text style={s.navLink}>Specialisty</Text>
          <Text style={s.navLink}>Zayavki</Text>
          <Text style={s.navLink}>Tarify</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable style={s.btnOutline}>
            <Text style={s.btnOutlineText}>Voyti</Text>
          </Pressable>
          <Pressable style={s.btnPrimary}>
            <Text style={s.btnPrimaryText}>Razmestit zayavku</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Public Header -- Mobile
// ---------------------------------------------------------------------------
function MobilePublicHeader() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Public Header (Mobile)</Text>
      <Text style={s.sectionDesc}>Collapsed with burger, expanded drawer</Text>

      <Text style={s.variantLabel}>COLLAPSED</Text>
      <View style={s.mobileHeaderBar}>
        <LogoBlock />
        <Pressable>
          <Feather name="menu" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={s.spacer} />

      <Text style={s.variantLabel}>EXPANDED DRAWER</Text>
      <View style={s.drawerOverlay}>
        <View style={s.drawerPanel}>
          <View style={s.drawerTop}>
            <LogoBlock />
            <Feather name="x" size={22} color={Colors.textPrimary} />
          </View>
          <View style={s.drawerLinks}>
            <Text style={[s.drawerLink, s.drawerLinkActive]}>Glavnaya</Text>
            <Text style={s.drawerLink}>Specialisty</Text>
            <Text style={s.drawerLink}>Zayavki</Text>
            <Text style={s.drawerLink}>Tarify</Text>
          </View>
          <View style={s.drawerDivider} />
          <View style={s.drawerButtons}>
            <Pressable style={s.btnOutlineFull}>
              <Text style={s.btnOutlineText}>Voyti</Text>
            </Pressable>
            <Pressable style={s.btnPrimaryFull}>
              <Text style={s.btnPrimaryText}>Razmestit zayavku</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Auth Header (minimal -- logo centered)
// ---------------------------------------------------------------------------
function AuthHeaderSection() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Auth Header</Text>
      <Text style={s.sectionDesc}>Minimal header for login/OTP screens</Text>
      <View style={s.authHeaderBar}>
        <LogoBlock />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Client Header + Bottom Tabs
// ---------------------------------------------------------------------------
const CLIENT_TABS: Array<{ id: string; icon: any; label: string; badge?: boolean }> = [
  { id: 'home', icon: 'home', label: 'Glavnaya' },
  { id: 'requests', icon: 'file-text', label: 'Zayavki' },
  { id: 'messages', icon: 'message-circle', label: 'Soobscheniya', badge: true },
  { id: 'profile', icon: 'user', label: 'Profil' },
];

function BottomTabBar({ tabs, activeId, label }: {
  tabs: Array<{ id: string; icon: string; label: string; badge?: boolean }>;
  activeId: string;
  label: string;
}) {
  return (
    <View>
      <Text style={s.tabStateLabel}>{label}</Text>
      <View style={s.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <View key={tab.id} style={s.tabItem}>
              <View>
                <Feather
                  name={tab.icon as any}
                  size={20}
                  color={active ? Colors.brandPrimary : Colors.textMuted}
                />
                {tab.badge && <View style={s.tabBadge} />}
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
              {active && <View style={s.tabIndicator} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ClientNavSection() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Client Navigation</Text>
      <Text style={s.sectionDesc}>Top bar + bottom tab variants</Text>

      <Text style={s.variantLabel}>TOP BAR</Text>
      <View style={s.headerBar}>
        <LogoBlock />
        <View style={s.headerRight}>
          <NotifBell hasNotif />
          <AvatarCircle initials="EV" />
        </View>
      </View>

      <View style={s.spacer} />

      <BottomTabBar tabs={CLIENT_TABS} activeId="home" label="Home active" />
      <View style={s.spacer} />
      <BottomTabBar tabs={CLIENT_TABS} activeId="requests" label="Requests active" />
      <View style={s.spacer} />
      <BottomTabBar tabs={CLIENT_TABS} activeId="messages" label="Messages active" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Specialist Header + Bottom Tabs
// ---------------------------------------------------------------------------
const SPECIALIST_TABS: Array<{ id: string; icon: any; label: string; badge?: boolean }> = [
  { id: 'dashboard', icon: 'briefcase', label: 'Kabinet' },
  { id: 'responses', icon: 'send', label: 'Otkliki' },
  { id: 'messages', icon: 'message-circle', label: 'Soobscheniya', badge: true },
  { id: 'profile', icon: 'user', label: 'Profil' },
];

function SpecialistNavSection() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Specialist Navigation</Text>
      <Text style={s.sectionDesc}>Specialist-specific tabs</Text>

      <Text style={s.variantLabel}>TOP BAR</Text>
      <View style={s.headerBar}>
        <LogoBlock />
        <View style={s.headerRight}>
          <NotifBell hasNotif />
          <AvatarCircle initials="AP" />
        </View>
      </View>

      <View style={s.spacer} />

      <BottomTabBar tabs={SPECIALIST_TABS} activeId="dashboard" label="Dashboard active" />
      <View style={s.spacer} />
      <BottomTabBar tabs={SPECIALIST_TABS} activeId="responses" label="Responses active" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Admin Navigation
// ---------------------------------------------------------------------------
const ADMIN_ITEMS = [
  { id: 'dashboard', icon: 'bar-chart-2' as const, label: 'Statistika' },
  { id: 'users', icon: 'users' as const, label: 'Polzovateli' },
  { id: 'requests', icon: 'file-text' as const, label: 'Zayavki' },
  { id: 'moderation', icon: 'shield' as const, label: 'Moderaciya' },
  { id: 'reviews', icon: 'star' as const, label: 'Otzyvy' },
  { id: 'promotions', icon: 'gift' as const, label: 'Promo' },
];

function AdminNavSection() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Admin Navigation</Text>
      <Text style={s.sectionDesc}>Horizontal tab bar for admin panel</Text>

      <Text style={s.variantLabel}>DASHBOARD ACTIVE</Text>
      <View style={s.adminBar}>
        <Text style={s.adminLogo}>Nalogovik Admin</Text>
        <View style={s.adminTabs}>
          {ADMIN_ITEMS.map((item) => {
            const active = item.id === 'dashboard';
            return (
              <View key={item.id} style={[s.adminTab, active && s.adminTabActive]}>
                <Feather name={item.icon} size={14} color={active ? Colors.brandPrimary : Colors.textMuted} />
                <Text style={[s.adminTabText, active && s.adminTabTextActive]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.spacer} />

      <Text style={s.variantLabel}>MODERATION ACTIVE</Text>
      <View style={s.adminBar}>
        <Text style={s.adminLogo}>Nalogovik Admin</Text>
        <View style={s.adminTabs}>
          {ADMIN_ITEMS.map((item) => {
            const active = item.id === 'moderation';
            return (
              <View key={item.id} style={[s.adminTab, active && s.adminTabActive]}>
                <Feather name={item.icon} size={14} color={active ? Colors.brandPrimary : Colors.textMuted} />
                <Text style={[s.adminTabText, active && s.adminTabTextActive]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 7: Back Navigation
// ---------------------------------------------------------------------------
function BackNavSection() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Inner Page Header</Text>
      <Text style={s.sectionDesc}>Back navigation for detail pages</Text>
      <View style={s.backHeaderBar}>
        <View style={s.backLeft}>
          <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
          <Text style={s.backTitle}>Zayavki</Text>
        </View>
        <Pressable>
          <Feather name="more-vertical" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function NavComponentsStates() {
  const { isDesktop } = useLayout();

  return (
    <StateSection title="NAVIGATION_COMPONENTS">
      <ScrollView
        style={s.container}
        contentContainerStyle={[s.containerInner, isDesktop && s.containerInnerDesktop]}
      >
        <DesktopPublicHeader />
        <MobilePublicHeader />
        <AuthHeaderSection />
        <ClientNavSection />
        <SpecialistNavSection />
        <AdminNavSection />
        <BackNavSection />
      </ScrollView>
    </StateSection>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  containerInner: {
    padding: Spacing.xl,
    gap: Spacing['3xl'],
    paddingBottom: 100,
  },
  containerInnerDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    paddingHorizontal: 48,
  },

  // Sections
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
  },
  variantLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginTop: Spacing.xs,
  },
  spacer: { height: Spacing.md },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Notification dot
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },

  // Avatar
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },

  // Desktop header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  navLinks: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginLeft: Spacing['3xl'],
    flex: 1,
  },
  navLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  navLinkActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  // Buttons
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  btnOutlineText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnPrimary: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnOutlineFull: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
  },
  btnPrimaryFull: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
  },

  // Mobile header bar
  mobileHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },

  // Auth header
  authHeaderBar: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  // Drawer
  drawerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 360,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  drawerPanel: {
    width: 280,
    backgroundColor: Colors.bgCard,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  drawerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerLinks: { gap: Spacing.lg },
  drawerLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  drawerLinkActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  drawerButtons: { gap: Spacing.sm },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    ...Shadows.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.brandPrimary,
  },
  tabStateLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },

  // Admin bar
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xl,
    ...Shadows.sm,
  },
  adminLogo: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  adminTabs: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
    flexWrap: 'wrap',
  },
  adminTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  adminTabActive: {
    backgroundColor: Colors.bgSecondary,
  },
  adminTabText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  adminTabTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Back header
  backHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  backLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
});
