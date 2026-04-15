import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';

// =====================================================================
// HELPERS
// =====================================================================
function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function useLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return { isDesktop, width };
}

// =====================================================================
// BRAND STYLE SECTIONS
// =====================================================================

// -- Hero --
function HeroSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[bs.heroWrap, isDesktop && bs.heroWrapDesktop]}>
      <View style={bs.heroLogoRow}>
        <View style={bs.heroLogoIcon}>
          <Feather name="shield" size={isDesktop ? 28 : 22} color={Colors.white} />
        </View>
        <Text style={[bs.heroLogoText, isDesktop && bs.heroLogoTextDesktop]}>
          Nalogovik
        </Text>
      </View>
      <Text style={[bs.heroTagline, isDesktop && bs.heroTaglineDesktop]}>
        Design System
      </Text>
      <Text style={bs.heroSub}>
        Visual language for P2PTax tax specialist marketplace
      </Text>
      <View style={bs.heroDivider} />
      <View style={bs.heroBrandStrip}>
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.brandPrimary }]} />
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.brandPrimaryHover }]} />
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.brandSecondary }]} />
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.textPrimary }]} />
      </View>
    </View>
  );
}

// -- Color Palette --
const COLOR_GROUPS = [
  {
    group: 'Brand',
    items: [
      { label: 'Primary', value: Colors.brandPrimary, token: 'brandPrimary' },
      { label: 'Hover', value: Colors.brandPrimaryHover, token: 'brandPrimaryHover' },
      { label: 'Secondary', value: Colors.brandSecondary, token: 'brandSecondary' },
    ],
  },
  {
    group: 'Backgrounds',
    items: [
      { label: 'Primary', value: Colors.bgPrimary, token: 'bgPrimary' },
      { label: 'Secondary', value: Colors.bgSecondary, token: 'bgSecondary' },
      { label: 'Surface', value: Colors.bgSurface, token: 'bgSurface' },
      { label: 'Card', value: Colors.bgCard, token: 'bgCard' },
    ],
  },
  {
    group: 'Text',
    items: [
      { label: 'Primary', value: Colors.textPrimary, token: 'textPrimary' },
      { label: 'Secondary', value: Colors.textSecondary, token: 'textSecondary' },
      { label: 'Muted', value: Colors.textMuted, token: 'textMuted' },
      { label: 'Accent', value: Colors.textAccent, token: 'textAccent' },
    ],
  },
  {
    group: 'Status',
    items: [
      { label: 'Success', value: Colors.statusSuccess, token: 'statusSuccess' },
      { label: 'Warning', value: Colors.statusWarning, token: 'statusWarning' },
      { label: 'Error', value: Colors.statusError, token: 'statusError' },
      { label: 'Info', value: Colors.statusInfo, token: 'statusInfo' },
      { label: 'Neutral', value: Colors.statusNeutral, token: 'statusNeutral' },
    ],
  },
  {
    group: 'Borders',
    items: [
      { label: 'Border', value: Colors.border, token: 'border' },
      { label: 'Light', value: Colors.borderLight, token: 'borderLight' },
    ],
  },
];

function ColorPaletteSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Color Palette</Text>
      <Text style={bs.sectionDesc}>Design tokens from Colors.ts</Text>
      {COLOR_GROUPS.map((group) => (
        <View key={group.group} style={bs.colorGroup}>
          <Text style={bs.colorGroupLabel}>{group.group}</Text>
          <View style={[bs.colorGrid, isDesktop && bs.colorGridDesktop]}>
            {group.items.map((c) => {
              const light = isLight(c.value);
              return (
                <View key={c.token} style={bs.colorCard}>
                  <View style={[bs.colorSwatch, { backgroundColor: c.value }, light && bs.swatchBorder]}>
                    <Text style={[bs.colorHex, { color: light ? Colors.textPrimary : Colors.white }]}>
                      {c.value}
                    </Text>
                  </View>
                  <Text style={bs.colorName}>{c.label}</Text>
                  <Text style={bs.colorToken}>{c.token}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// -- Typography Scale --
const TYPO_SAMPLES = [
  { label: 'Jumbo', size: Typography.fontSize.jumbo, weight: Typography.fontWeight.bold, sample: '48', color: Colors.textPrimary },
  { label: 'Display', size: Typography.fontSize.display, weight: Typography.fontWeight.bold, sample: 'Display Heading', color: Colors.textPrimary },
  { label: '3XL', size: Typography.fontSize['3xl'], weight: Typography.fontWeight.bold, sample: 'Section Title', color: Colors.textPrimary },
  { label: '2XL', size: Typography.fontSize['2xl'], weight: Typography.fontWeight.bold, sample: 'Page Heading', color: Colors.textPrimary },
  { label: 'Title', size: Typography.fontSize.title, weight: Typography.fontWeight.bold, sample: 'Card Title', color: Colors.textPrimary },
  { label: 'XL', size: Typography.fontSize.xl, weight: Typography.fontWeight.semibold, sample: 'Subsection', color: Colors.textPrimary },
  { label: 'LG', size: Typography.fontSize.lg, weight: Typography.fontWeight.semibold, sample: 'Label or Subtitle', color: Colors.textPrimary },
  { label: 'MD', size: Typography.fontSize.md, weight: Typography.fontWeight.medium, sample: 'Medium body text', color: Colors.textPrimary },
  { label: 'Base', size: Typography.fontSize.base, weight: Typography.fontWeight.regular, sample: 'Regular body text for paragraphs and descriptions.', color: Colors.textSecondary },
  { label: 'SM', size: Typography.fontSize.sm, weight: Typography.fontWeight.regular, sample: 'Small supporting text, captions, meta info.', color: Colors.textSecondary },
  { label: 'XS', size: Typography.fontSize.xs, weight: Typography.fontWeight.medium, sample: 'OVERLINE / LABEL', color: Colors.textMuted },
];

function TypographySection() {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Typography Scale</Text>
      <Text style={bs.sectionDesc}>Nunito family -- sizes, weights, hierarchy</Text>
      <View style={bs.typoList}>
        {TYPO_SAMPLES.map((t) => (
          <View key={t.label} style={bs.typoRow}>
            <View style={bs.typoMeta}>
              <Text style={bs.typoLabel}>{t.label}</Text>
              <Text style={bs.typoSize}>{t.size}px</Text>
            </View>
            <Text
              style={{
                fontSize: t.size,
                fontWeight: t.weight as any,
                color: t.color,
                lineHeight: t.size * 1.35,
              }}
            >
              {t.sample}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Buttons --
function ButtonsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Buttons</Text>
      <Text style={bs.sectionDesc}>Variants, sizes, and states</Text>

      <Text style={bs.subLabel}>Primary</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={bs.btnPrimary}>
          <Text style={bs.btnPrimaryText}>Default</Text>
        </View>
        <View style={[bs.btnPrimary, { backgroundColor: Colors.brandPrimaryHover }]}>
          <Text style={bs.btnPrimaryText}>Hover</Text>
        </View>
        <View style={[bs.btnPrimary, { backgroundColor: Colors.brandSecondary }]}>
          <Text style={bs.btnPrimaryText}>Pressed</Text>
        </View>
        <View style={[bs.btnPrimary, bs.btnDisabled]}>
          <Text style={bs.btnPrimaryText}>Disabled</Text>
        </View>
      </View>

      <Text style={bs.subLabel}>Secondary / Outline / Ghost</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={bs.btnSecondary}>
          <Text style={bs.btnSecondaryText}>Secondary</Text>
        </View>
        <View style={bs.btnOutline}>
          <Text style={bs.btnOutlineText}>Outline</Text>
        </View>
        <View style={bs.btnGhost}>
          <Text style={bs.btnGhostText}>Ghost</Text>
        </View>
      </View>

      <Text style={bs.subLabel}>Semantic</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={bs.btnDestructive}>
          <Feather name="trash-2" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Delete</Text>
        </View>
        <View style={bs.btnSuccess}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Confirm</Text>
        </View>
        <View style={bs.btnWarning}>
          <Feather name="alert-triangle" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Warning</Text>
        </View>
      </View>

      <Text style={bs.subLabel}>With Icons + Sizes</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={bs.btnLarge}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text style={bs.btnLargeText}>Large Button</Text>
        </View>
        <View style={bs.btnIconPrimary}>
          <Feather name="send" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Send</Text>
        </View>
        <View style={bs.btnIconOutline}>
          <Feather name="filter" size={14} color={Colors.brandPrimary} />
          <Text style={bs.btnOutlineText}>Filter</Text>
        </View>
        <View style={bs.btnSmall}>
          <Text style={bs.btnSmallText}>Small</Text>
        </View>
      </View>
    </View>
  );
}

// -- Inputs --
function InputsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Inputs</Text>
      <Text style={bs.sectionDesc}>Text fields in all states</Text>

      <View style={[bs.inputGrid, isDesktop && bs.inputGridDesktop]}>
        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Empty</Text>
          <View style={bs.inputWrap}>
            <Text style={bs.inputPlaceholder}>Placeholder text...</Text>
          </View>
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Focused</Text>
          <View style={[bs.inputWrap, bs.inputFocused]}>
            <Text style={bs.inputValue}>Typing here|</Text>
          </View>
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Filled</Text>
          <View style={bs.inputWrap}>
            <Text style={bs.inputValue}>ivan@mail.ru</Text>
          </View>
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Error</Text>
          <View style={[bs.inputWrap, bs.inputError]}>
            <Text style={bs.inputValue}>bad-value</Text>
          </View>
          <View style={bs.errorRow}>
            <Feather name="alert-circle" size={12} color={Colors.statusError} />
            <Text style={bs.inputErrorText}>Invalid format</Text>
          </View>
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Disabled</Text>
          <View style={[bs.inputWrap, bs.inputDisabledWrap]}>
            <Text style={bs.inputDisabledText}>Disabled field</Text>
          </View>
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>With Icon</Text>
          <View style={[bs.inputWrap, bs.inputWithIconWrap]}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <Text style={bs.inputPlaceholder}>Search...</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// -- Badges & Tags --
function BadgesSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Badges & Tags</Text>
      <Text style={bs.sectionDesc}>Status indicators and category labels</Text>

      <Text style={bs.subLabel}>Status Badges</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.success }]}>
          <Feather name="check-circle" size={12} color={Colors.statusSuccess} />
          <Text style={[bs.badgeText, { color: Colors.statusSuccess }]}>Verified</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.info }]}>
          <View style={bs.onlineDot} />
          <Text style={[bs.badgeText, { color: Colors.brandPrimary }]}>Online</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.warning }]}>
          <Feather name="clock" size={12} color={Colors.statusWarning} />
          <Text style={[bs.badgeText, { color: Colors.statusWarning }]}>Pending</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[bs.badgeText, { color: Colors.statusError }]}>Rejected</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.neutral }]}>
          <Text style={[bs.badgeText, { color: Colors.statusNeutral }]}>Draft</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.accent }]}>
          <Feather name="zap" size={12} color={Colors.brandPrimary} />
          <Text style={[bs.badgeText, { color: Colors.brandPrimary }]}>New</Text>
        </View>
      </View>

      <Text style={bs.subLabel}>Service Tags</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={bs.tag}>
          <Text style={bs.tagText}>3-NDFL</Text>
        </View>
        <View style={bs.tag}>
          <Text style={bs.tagText}>IP registration</Text>
        </View>
        <View style={[bs.tag, bs.tagActive]}>
          <Feather name="check" size={11} color={Colors.brandPrimary} />
          <Text style={[bs.tagText, { color: Colors.brandPrimary }]}>Tax audit</Text>
        </View>
        <View style={bs.tag}>
          <Text style={bs.tagText}>Consulting</Text>
        </View>
      </View>
    </View>
  );
}

// -- Spacing Tokens --
const SPACING_ITEMS: { label: string; value: number }[] = [
  { label: 'xxs', value: Spacing.xxs },
  { label: 'xs', value: Spacing.xs },
  { label: 'sm', value: Spacing.sm },
  { label: 'md', value: Spacing.md },
  { label: 'lg', value: Spacing.lg },
  { label: 'xl', value: Spacing.xl },
  { label: '2xl', value: Spacing['2xl'] },
  { label: '3xl', value: Spacing['3xl'] },
  { label: '4xl', value: Spacing['4xl'] },
];

function SpacingSection() {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Spacing Tokens</Text>
      <Text style={bs.sectionDesc}>Consistent spacing scale</Text>
      <View style={bs.spacingList}>
        {SPACING_ITEMS.map((sp) => (
          <View key={sp.label} style={bs.spacingRow}>
            <Text style={bs.spacingLabel}>{sp.label}</Text>
            <Text style={bs.spacingValue}>{sp.value}px</Text>
            <View style={bs.spacingBarWrap}>
              <View style={[bs.spacingBar, { width: Math.min(sp.value * 4, 200) }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Border Radius --
function RadiusSection({ isDesktop }: { isDesktop: boolean }) {
  const radii = [
    { label: 'sm', value: BorderRadius.sm },
    { label: 'md', value: BorderRadius.md },
    { label: 'lg', value: BorderRadius.lg },
    { label: 'xl', value: BorderRadius.xl },
    { label: 'xxl', value: BorderRadius.xxl },
    { label: 'btn', value: BorderRadius.btn },
    { label: 'card', value: BorderRadius.card },
    { label: 'input', value: BorderRadius.input },
    { label: 'full', value: 32 },
  ];

  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Border Radius</Text>
      <Text style={bs.sectionDesc}>Rounding tokens from BorderRadius</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop, { gap: Spacing.lg }]}>
        {radii.map((r) => (
          <View key={r.label} style={bs.radiusItem}>
            <View style={[bs.radiusBox, { borderRadius: r.value }]} />
            <Text style={bs.radiusLabel}>{r.label}</Text>
            <Text style={bs.radiusValue}>{r.value}px</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Shadows --
function ShadowsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Shadows</Text>
      <Text style={bs.sectionDesc}>Elevation levels</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop, { gap: Spacing.xl }]}>
        <View style={bs.shadowItem}>
          <View style={[bs.shadowBox, Shadows.sm]} />
          <Text style={bs.shadowLabel}>sm</Text>
        </View>
        <View style={bs.shadowItem}>
          <View style={[bs.shadowBox, Shadows.md]} />
          <Text style={bs.shadowLabel}>md</Text>
        </View>
        <View style={bs.shadowItem}>
          <View style={[bs.shadowBox, Shadows.lg]} />
          <Text style={bs.shadowLabel}>lg</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// NAV COMPONENT SECTIONS
// =====================================================================

// -- Shared small components --
function LogoBlock() {
  return (
    <View style={ns.logoRow}>
      <View style={ns.logoIcon}>
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text style={ns.logoText}>Nalogovik</Text>
    </View>
  );
}

function NotifBell({ hasNotif = false }: { hasNotif?: boolean }) {
  return (
    <View>
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {hasNotif && <View style={ns.redDot} />}
    </View>
  );
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <View style={ns.avatarCircle}>
      <Text style={ns.avatarText}>{initials}</Text>
    </View>
  );
}

// -- Public Header Desktop --
function DesktopPublicHeader() {
  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Public Header (Desktop)</Text>
      <Text style={ns.sectionDesc}>Guest navigation with brand + CTA</Text>
      <View style={ns.headerBar}>
        <LogoBlock />
        <View style={ns.navLinks}>
          <Text style={[ns.navLink, ns.navLinkActive]}>Glavnaya</Text>
          <Text style={ns.navLink}>Specialisty</Text>
          <Text style={ns.navLink}>Zayavki</Text>
          <Text style={ns.navLink}>Tarify</Text>
        </View>
        <View style={ns.headerRight}>
          <Pressable style={ns.navBtnOutline}>
            <Text style={ns.navBtnOutlineText}>Voyti</Text>
          </Pressable>
          <Pressable style={ns.navBtnPrimary}>
            <Text style={ns.navBtnPrimaryText}>Razmestit zayavku</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// -- Public Header Mobile --
function MobilePublicHeader() {
  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Public Header (Mobile)</Text>
      <Text style={ns.sectionDesc}>Collapsed with burger, expanded drawer</Text>

      <Text style={ns.variantLabel}>COLLAPSED</Text>
      <View style={ns.mobileHeaderBar}>
        <LogoBlock />
        <Pressable>
          <Feather name="menu" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={ns.spacer} />

      <Text style={ns.variantLabel}>EXPANDED DRAWER</Text>
      <View style={ns.drawerOverlay}>
        <View style={ns.drawerPanel}>
          <View style={ns.drawerTop}>
            <LogoBlock />
            <Feather name="x" size={22} color={Colors.textPrimary} />
          </View>
          <View style={ns.drawerLinks}>
            <Text style={[ns.drawerLink, ns.drawerLinkActive]}>Glavnaya</Text>
            <Text style={ns.drawerLink}>Specialisty</Text>
            <Text style={ns.drawerLink}>Zayavki</Text>
            <Text style={ns.drawerLink}>Tarify</Text>
          </View>
          <View style={ns.drawerDivider} />
          <View style={ns.drawerButtons}>
            <Pressable style={ns.navBtnOutlineFull}>
              <Text style={ns.navBtnOutlineText}>Voyti</Text>
            </Pressable>
            <Pressable style={ns.navBtnPrimaryFull}>
              <Text style={ns.navBtnPrimaryText}>Razmestit zayavku</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// -- Auth Header --
function AuthHeaderSection() {
  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Auth Header</Text>
      <Text style={ns.sectionDesc}>Minimal header for login/OTP screens</Text>
      <View style={ns.authHeaderBar}>
        <LogoBlock />
      </View>
    </View>
  );
}

// -- Client Navigation --
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
      <Text style={ns.tabStateLabel}>{label}</Text>
      <View style={ns.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <View key={tab.id} style={ns.tabItem}>
              <View>
                <Feather
                  name={tab.icon as any}
                  size={20}
                  color={active ? Colors.brandPrimary : Colors.textMuted}
                />
                {tab.badge && <View style={ns.tabBadge} />}
              </View>
              <Text style={[ns.tabLabel, active && ns.tabLabelActive]}>{tab.label}</Text>
              {active && <View style={ns.tabIndicator} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ClientNavSection() {
  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Client Navigation</Text>
      <Text style={ns.sectionDesc}>Top bar + bottom tab variants</Text>

      <Text style={ns.variantLabel}>TOP BAR</Text>
      <View style={ns.headerBar}>
        <LogoBlock />
        <View style={ns.headerRight}>
          <NotifBell hasNotif />
          <AvatarCircle initials="EV" />
        </View>
      </View>

      <View style={ns.spacer} />

      <BottomTabBar tabs={CLIENT_TABS} activeId="home" label="Home active" />
      <View style={ns.spacer} />
      <BottomTabBar tabs={CLIENT_TABS} activeId="requests" label="Requests active" />
      <View style={ns.spacer} />
      <BottomTabBar tabs={CLIENT_TABS} activeId="messages" label="Messages active" />
    </View>
  );
}

// -- Specialist Navigation --
const SPECIALIST_TABS: Array<{ id: string; icon: any; label: string; badge?: boolean }> = [
  { id: 'dashboard', icon: 'briefcase', label: 'Kabinet' },
  { id: 'responses', icon: 'send', label: 'Otkliki' },
  { id: 'messages', icon: 'message-circle', label: 'Soobscheniya', badge: true },
  { id: 'profile', icon: 'user', label: 'Profil' },
];

function SpecialistNavSection() {
  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Specialist Navigation</Text>
      <Text style={ns.sectionDesc}>Specialist-specific tabs</Text>

      <Text style={ns.variantLabel}>TOP BAR</Text>
      <View style={ns.headerBar}>
        <LogoBlock />
        <View style={ns.headerRight}>
          <NotifBell hasNotif />
          <AvatarCircle initials="AP" />
        </View>
      </View>

      <View style={ns.spacer} />

      <BottomTabBar tabs={SPECIALIST_TABS} activeId="dashboard" label="Dashboard active" />
      <View style={ns.spacer} />
      <BottomTabBar tabs={SPECIALIST_TABS} activeId="responses" label="Responses active" />
    </View>
  );
}

// -- Admin Navigation --
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
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Admin Navigation</Text>
      <Text style={ns.sectionDesc}>Horizontal tab bar for admin panel</Text>

      <Text style={ns.variantLabel}>DASHBOARD ACTIVE</Text>
      <View style={ns.adminBar}>
        <Text style={ns.adminLogo}>Nalogovik Admin</Text>
        <View style={ns.adminTabs}>
          {ADMIN_ITEMS.map((item) => {
            const active = item.id === 'dashboard';
            return (
              <View key={item.id} style={[ns.adminTab, active && ns.adminTabActive]}>
                <Feather name={item.icon} size={14} color={active ? Colors.brandPrimary : Colors.textMuted} />
                <Text style={[ns.adminTabText, active && ns.adminTabTextActive]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={ns.spacer} />

      <Text style={ns.variantLabel}>MODERATION ACTIVE</Text>
      <View style={ns.adminBar}>
        <Text style={ns.adminLogo}>Nalogovik Admin</Text>
        <View style={ns.adminTabs}>
          {ADMIN_ITEMS.map((item) => {
            const active = item.id === 'moderation';
            return (
              <View key={item.id} style={[ns.adminTab, active && ns.adminTabActive]}>
                <Feather name={item.icon} size={14} color={active ? Colors.brandPrimary : Colors.textMuted} />
                <Text style={[ns.adminTabText, active && ns.adminTabTextActive]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// -- Back Navigation --
function BackNavSection() {
  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Inner Page Header</Text>
      <Text style={ns.sectionDesc}>Back navigation for detail pages</Text>
      <View style={ns.backHeaderBar}>
        <View style={ns.backLeft}>
          <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
          <Text style={ns.backTitle}>Zayavki</Text>
        </View>
        <Pressable>
          <Feather name="more-vertical" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// MAIN EXPORT
// =====================================================================
export function BrandStates() {
  const { isDesktop } = useLayout();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.white }}
      contentContainerStyle={[
        { padding: Spacing.xl, gap: Spacing['3xl'], paddingBottom: 100 },
        isDesktop && { maxWidth: 960, alignSelf: 'center' as const, paddingHorizontal: 48 },
      ]}
    >
      {/* Brand & Style sections */}
      <HeroSection isDesktop={isDesktop} />
      <ColorPaletteSection isDesktop={isDesktop} />
      <TypographySection />
      <ButtonsSection isDesktop={isDesktop} />
      <InputsSection isDesktop={isDesktop} />
      <BadgesSection isDesktop={isDesktop} />
      <SpacingSection />
      <RadiusSection isDesktop={isDesktop} />
      <ShadowsSection isDesktop={isDesktop} />

      {/* Divider between brand and nav sections */}
      <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xl }} />

      {/* Navigation Component sections */}
      <DesktopPublicHeader />
      <MobilePublicHeader />
      <AuthHeaderSection />
      <ClientNavSection />
      <SpecialistNavSection />
      <AdminNavSection />
      <BackNavSection />
    </ScrollView>
  );
}

// =====================================================================
// BRAND STYLE STYLES (bs)
// =====================================================================
const bs = StyleSheet.create({
  // Sections
  section: { gap: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
  },
  subLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
  },

  // Hero
  heroWrap: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    padding: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  heroWrapDesktop: { padding: Spacing['4xl'] },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroLogoIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroLogoTextDesktop: { fontSize: Typography.fontSize.display },
  heroTagline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  heroTaglineDesktop: { fontSize: Typography.fontSize.xl },
  heroSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  heroDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  heroBrandStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroBrandBlock: {
    width: 40,
    height: 5,
    borderRadius: BorderRadius.full,
  },

  // Colors
  colorGroup: { gap: Spacing.sm, marginTop: Spacing.xs },
  colorGroupLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorGridDesktop: { gap: Spacing.md },
  colorCard: { alignItems: 'center', gap: 3 },
  colorSwatch: {
    width: 72,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBorder: { borderWidth: 1, borderColor: Colors.border },
  colorHex: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
  colorName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  colorToken: { fontSize: 9, color: Colors.textMuted },

  // Typography
  typoList: { gap: Spacing.md },
  typoRow: {
    gap: Spacing.xxs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  typoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typoLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 48,
  },
  typoSize: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Buttons
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  rowDesktop: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnSecondary: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnGhost: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusError,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusSuccess,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusWarning,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnDisabled: { opacity: 0.4 },
  btnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.btn,
  },
  btnLargeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnIconPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnIconOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.btn,
  },
  btnSmall: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  btnSmallText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Inputs
  inputGrid: { gap: Spacing.lg },
  inputGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  inputGroup: { gap: Spacing.xs, minWidth: 200, flex: 1 },
  inputStateLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  inputFocused: {
    borderColor: Colors.brandPrimary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.statusError,
    borderWidth: 2,
  },
  inputDisabledWrap: {
    backgroundColor: Colors.bgSecondary,
    opacity: 0.6,
  },
  inputWithIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputPlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  inputValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputDisabledText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputErrorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.statusSuccess,
  },

  // Tags
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tagActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.info,
  },

  // Spacing
  spacingList: {
    gap: Spacing.sm,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  spacingLabel: {
    width: 32,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  spacingValue: {
    width: 36,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  spacingBarWrap: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  spacingBar: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.sm,
    minWidth: 4,
  },

  // Border Radius
  radiusItem: { alignItems: 'center', gap: 4 },
  radiusBox: {
    width: 48,
    height: 48,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  radiusValue: {
    fontSize: 9,
    color: Colors.textMuted,
  },

  // Shadows
  shadowItem: { alignItems: 'center', gap: Spacing.sm },
  shadowBox: {
    width: 80,
    height: 56,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
  },
  shadowLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
});

// =====================================================================
// NAV COMPONENT STYLES (ns)
// =====================================================================
const ns = StyleSheet.create({
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

  // Nav Buttons (prefixed to avoid clash with brand button styles)
  navBtnOutline: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  navBtnOutlineText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  navBtnPrimary: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  navBtnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  navBtnOutlineFull: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
  },
  navBtnPrimaryFull: {
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
