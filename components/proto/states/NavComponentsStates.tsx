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

function NotifBell() {
  return (
    <View>
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      <View style={s.redDot} />
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
// Section 1: Desktop public header (guest)
// ---------------------------------------------------------------------------
function DesktopPublicHeader() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Desktop — public header (guest)</Text>
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
// Section 2: Mobile burger menu (open state)
// ---------------------------------------------------------------------------
function MobileBurgerHeader() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Mobile — burger menu (open)</Text>

      {/* Closed header */}
      <View style={s.mobileHeaderBar}>
        <LogoBlock />
        <Pressable>
          <Feather name="menu" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Open drawer state */}
      <View style={s.drawerOverlay}>
        <View style={s.drawerPanel}>
          <View style={s.drawerClose}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </View>
          <View style={s.drawerLinks}>
            <Text style={[s.drawerLink, s.drawerLinkActive]}>Glavnaya</Text>
            <Text style={s.drawerLink}>Specialisty</Text>
            <Text style={s.drawerLink}>Zayavki</Text>
            <Text style={s.drawerLink}>Tarify</Text>
          </View>
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
// Section 3: Auth header (desktop + mobile)
// ---------------------------------------------------------------------------
function AuthHeader() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Authorized user</Text>

      {/* Desktop variant */}
      <Text style={s.variantLabel}>DESKTOP</Text>
      <View style={s.headerBar}>
        <LogoBlock />
        <View style={s.navLinks}>
          <Text style={[s.navLink, s.navLinkActive]}>Glavnaya</Text>
          <Text style={s.navLink}>Specialisty</Text>
          <Text style={s.navLink}>Zayavki</Text>
          <Text style={s.navLink}>Tarify</Text>
        </View>
        <View style={s.headerRight}>
          <NotifBell />
          <AvatarCircle initials="AP" />
        </View>
      </View>

      <View style={s.spacer} />

      {/* Mobile variant */}
      <Text style={s.variantLabel}>MOBILE</Text>
      <View style={s.mobileHeaderBar}>
        <LogoBlock />
        <View style={s.mobileAuthRight}>
          <NotifBell />
          <AvatarCircle initials="AP" />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Bottom nav — Client
// ---------------------------------------------------------------------------
const CLIENT_TABS = [
  { id: 'home', icon: 'home' as const, label: 'Glavnaya' },
  { id: 'requests', icon: 'file-text' as const, label: 'Zayavki' },
  { id: 'messages', icon: 'message-circle' as const, label: 'Soobscheniya', badge: true },
  { id: 'profile', icon: 'user' as const, label: 'Profil' },
];

function BottomTabBar({ tabs, activeId, label }: {
  tabs: typeof CLIENT_TABS;
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
                  name={tab.icon}
                  size={20}
                  color={active ? Colors.brandPrimary : Colors.textMuted}
                />
                {tab.badge && <View style={s.tabBadge} />}
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ClientBottomNav() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Bottom navigation — Client</Text>
      <BottomTabBar tabs={CLIENT_TABS} activeId="home" label="State 1: Glavnaya active" />
      <View style={s.spacer} />
      <BottomTabBar tabs={CLIENT_TABS} activeId="requests" label="State 2: Zayavki active" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Bottom nav — Specialist
// ---------------------------------------------------------------------------
const SPECIALIST_TABS = [
  { id: 'cabinet', icon: 'briefcase' as const, label: 'Kabinet' },
  { id: 'exchange', icon: 'list' as const, label: 'Birzha' },
  { id: 'messages', icon: 'message-circle' as const, label: 'Soobscheniya', badge: true },
  { id: 'profile', icon: 'user' as const, label: 'Profil' },
];

function SpecialistBottomNav() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Bottom navigation — Specialist</Text>
      <BottomTabBar tabs={SPECIALIST_TABS} activeId="cabinet" label="Kabinet active" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Back navigation header
// ---------------------------------------------------------------------------
function BackHeader() {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Header — inner page (back button)</Text>
      <View style={s.backHeaderBar}>
        <View style={s.backLeft}>
          <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
          <Text style={s.backTitle}>Zayavki</Text>
        </View>
        <Pressable>
          <Feather name="more-vertical" size={20} color={Colors.textSecondary} />
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
        <MobileBurgerHeader />
        <AuthHeader />
        <ClientBottomNav />
        <SpecialistBottomNav />
        <BackHeader />
      </ScrollView>
    </StateSection>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  containerInner: {
    padding: Spacing.lg,
    gap: Spacing['3xl'],
    paddingBottom: 80,
  },
  containerInnerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 48,
  },

  // Sections
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  variantLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  spacer: {
    height: Spacing.lg,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },

  // Red dot badge
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
    borderColor: Colors.border,
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
    fontWeight: Typography.fontWeight.bold,
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
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  btnPrimaryFull: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
    borderColor: Colors.border,
  },
  mobileAuthRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  // Drawer (open state — static preview)
  drawerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 320,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  drawerPanel: {
    width: 260,
    backgroundColor: Colors.bgCard,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  drawerClose: {
    alignSelf: 'flex-end',
  },
  drawerLinks: {
    gap: Spacing.lg,
  },
  drawerLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  drawerLinkActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },
  drawerButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
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
  tabStateLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
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
    borderColor: Colors.border,
  },
  backLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
});
