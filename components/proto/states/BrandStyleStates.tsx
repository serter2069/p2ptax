import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
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
  return { isDesktop };
}

// =====================================================================
// SECTION: Hero
// =====================================================================
function HeroSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[styles.heroWrap, isDesktop && styles.heroWrapDesktop]}>
      <View style={styles.heroLogoRow}>
        <View style={styles.heroLogoIcon}>
          <Feather name="shield" size={isDesktop ? 28 : 22} color={Colors.white} />
        </View>
        <Text style={[styles.heroLogoText, isDesktop && styles.heroLogoTextDesktop]}>
          Nalogovik
        </Text>
      </View>
      <Text style={[styles.heroTagline, isDesktop && styles.heroTaglineDesktop]}>
        Design System
      </Text>
      <Text style={styles.heroSub}>
        Visual language for P2PTax tax specialist marketplace
      </Text>
      <View style={styles.heroDivider} />
      <View style={styles.heroBrandStrip}>
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.brandPrimary }]} />
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.brandPrimaryHover }]} />
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.brandSecondary }]} />
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.textPrimary }]} />
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Color Palette
// =====================================================================
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
      { label: 'Brand', value: Colors.brandPrimary, token: 'brandPrimary' },
    ],
  },
  {
    group: 'Status',
    items: [
      { label: 'Success', value: Colors.statusSuccess, token: 'statusSuccess' },
      { label: 'Warning', value: Colors.statusWarning, token: 'statusWarning' },
      { label: 'Error', value: Colors.statusError, token: 'statusError' },
      { label: 'Info', value: Colors.brandPrimary, token: 'brandPrimary' },
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Color Palette</Text>
      <Text style={styles.sectionDesc}>Design tokens from Colors.ts</Text>
      {COLOR_GROUPS.map((group) => (
        <View key={group.group} style={styles.colorGroup}>
          <Text style={styles.colorGroupLabel}>{group.group}</Text>
          <View style={[styles.colorGrid, isDesktop && styles.colorGridDesktop]}>
            {group.items.map((c) => {
              const light = isLight(c.value);
              return (
                <View key={c.token} style={styles.colorCard}>
                  <View style={[styles.colorSwatch, { backgroundColor: c.value }, light && styles.swatchBorder]}>
                    <Text style={[styles.colorHex, { color: light ? Colors.textPrimary : Colors.white }]}>
                      {c.value}
                    </Text>
                  </View>
                  <Text style={styles.colorName}>{c.label}</Text>
                  <Text style={styles.colorToken}>{c.token}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// =====================================================================
// SECTION: Typography Scale
// =====================================================================
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Typography Scale</Text>
      <Text style={styles.sectionDesc}>Nunito family -- sizes, weights, hierarchy</Text>
      <View style={styles.typoList}>
        {TYPO_SAMPLES.map((t) => (
          <View key={t.label} style={styles.typoRow}>
            <View style={styles.typoMeta}>
              <Text style={styles.typoLabel}>{t.label}</Text>
              <Text style={styles.typoSize}>{t.size}px</Text>
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

// =====================================================================
// SECTION: Buttons -- all variants and states
// =====================================================================
function ButtonsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Buttons</Text>
      <Text style={styles.sectionDesc}>Variants, sizes, and states</Text>

      {/* Primary variants */}
      <Text style={styles.subLabel}>Primary</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Default</Text>
        </View>
        <View style={[styles.btnPrimary, { backgroundColor: Colors.brandPrimaryHover }]}>
          <Text style={styles.btnPrimaryText}>Hover</Text>
        </View>
        <View style={[styles.btnPrimary, { backgroundColor: Colors.brandSecondary }]}>
          <Text style={styles.btnPrimaryText}>Pressed</Text>
        </View>
        <View style={[styles.btnPrimary, styles.btnDisabled]}>
          <Text style={styles.btnPrimaryText}>Disabled</Text>
        </View>
      </View>

      {/* Secondary / Outline / Ghost */}
      <Text style={styles.subLabel}>Secondary / Outline / Ghost</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Secondary</Text>
        </View>
        <View style={styles.btnOutline}>
          <Text style={styles.btnOutlineText}>Outline</Text>
        </View>
        <View style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>Ghost</Text>
        </View>
      </View>

      {/* Semantic */}
      <Text style={styles.subLabel}>Semantic</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnDestructive}>
          <Feather name="trash-2" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Delete</Text>
        </View>
        <View style={styles.btnSuccess}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Confirm</Text>
        </View>
        <View style={styles.btnWarning}>
          <Feather name="alert-triangle" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Warning</Text>
        </View>
      </View>

      {/* With icons + sizes */}
      <Text style={styles.subLabel}>With Icons + Sizes</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnLarge}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text style={styles.btnLargeText}>Large Button</Text>
        </View>
        <View style={styles.btnIconPrimary}>
          <Feather name="send" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Send</Text>
        </View>
        <View style={styles.btnIconOutline}>
          <Feather name="filter" size={14} color={Colors.brandPrimary} />
          <Text style={styles.btnOutlineText}>Filter</Text>
        </View>
        <View style={styles.btnSmall}>
          <Text style={styles.btnSmallText}>Small</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Inputs -- all states
// =====================================================================
function InputsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inputs</Text>
      <Text style={styles.sectionDesc}>Text fields in all states</Text>

      <View style={[styles.inputGrid, isDesktop && styles.inputGridDesktop]}>
        {/* Empty */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputStateLabel}>Empty</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputPlaceholder}>Placeholder text...</Text>
          </View>
        </View>

        {/* Focused */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputStateLabel}>Focused</Text>
          <View style={[styles.inputWrap, styles.inputFocused]}>
            <Text style={styles.inputValue}>Typing here|</Text>
          </View>
        </View>

        {/* Filled */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputStateLabel}>Filled</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputValue}>ivan@mail.ru</Text>
          </View>
        </View>

        {/* Error */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputStateLabel}>Error</Text>
          <View style={[styles.inputWrap, styles.inputError]}>
            <Text style={styles.inputValue}>bad-value</Text>
          </View>
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={12} color={Colors.statusError} />
            <Text style={styles.inputErrorText}>Invalid format</Text>
          </View>
        </View>

        {/* Disabled */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputStateLabel}>Disabled</Text>
          <View style={[styles.inputWrap, styles.inputDisabledWrap]}>
            <Text style={styles.inputDisabledText}>Disabled field</Text>
          </View>
        </View>

        {/* With icon */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputStateLabel}>With Icon</Text>
          <View style={[styles.inputWrap, styles.inputWithIconWrap]}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <Text style={styles.inputPlaceholder}>Search...</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Badges, Tags, Status
// =====================================================================
function BadgesSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Badges & Tags</Text>
      <Text style={styles.sectionDesc}>Status indicators and category labels</Text>

      <Text style={styles.subLabel}>Status Badges</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.success }]}>
          <Feather name="check-circle" size={12} color={Colors.statusSuccess} />
          <Text style={[styles.badgeText, { color: Colors.statusSuccess }]}>Verified</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.info }]}>
          <View style={styles.onlineDot} />
          <Text style={[styles.badgeText, { color: Colors.brandPrimary }]}>Online</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.warning }]}>
          <Feather name="clock" size={12} color={Colors.statusWarning} />
          <Text style={[styles.badgeText, { color: Colors.statusWarning }]}>Pending</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[styles.badgeText, { color: Colors.statusError }]}>Rejected</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.neutral }]}>
          <Text style={[styles.badgeText, { color: Colors.statusNeutral }]}>Draft</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.info }]}>
          <Feather name="zap" size={12} color={Colors.brandPrimary} />
          <Text style={[styles.badgeText, { color: Colors.brandPrimary }]}>New</Text>
        </View>
      </View>

      <Text style={styles.subLabel}>Service Tags</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>3-NDFL</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>IP registration</Text>
        </View>
        <View style={[styles.tag, styles.tagActive]}>
          <Feather name="check" size={11} color={Colors.brandPrimary} />
          <Text style={[styles.tagText, { color: Colors.brandPrimary }]}>Tax audit</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Consulting</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Spacing System
// =====================================================================
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Spacing Tokens</Text>
      <Text style={styles.sectionDesc}>Consistent spacing scale</Text>
      <View style={styles.spacingList}>
        {SPACING_ITEMS.map((sp) => (
          <View key={sp.label} style={styles.spacingRow}>
            <Text style={styles.spacingLabel}>{sp.label}</Text>
            <Text style={styles.spacingValue}>{sp.value}px</Text>
            <View style={styles.spacingBarWrap}>
              <View style={[styles.spacingBar, { width: Math.min(sp.value * 4, 200) }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Border Radius
// =====================================================================
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Border Radius</Text>
      <Text style={styles.sectionDesc}>Rounding tokens from BorderRadius</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop, { gap: Spacing.lg }]}>
        {radii.map((r) => (
          <View key={r.label} style={styles.radiusItem}>
            <View
              style={[
                styles.radiusBox,
                { borderRadius: r.value },
              ]}
            />
            <Text style={styles.radiusLabel}>{r.label}</Text>
            <Text style={styles.radiusValue}>{r.value}px</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Shadows
// =====================================================================
function ShadowsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shadows</Text>
      <Text style={styles.sectionDesc}>Elevation levels</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop, { gap: Spacing.xl }]}>
        <View style={styles.shadowItem}>
          <View style={[styles.shadowBox, Shadows.sm]} />
          <Text style={styles.shadowLabel}>sm</Text>
        </View>
        <View style={styles.shadowItem}>
          <View style={[styles.shadowBox, Shadows.md]} />
          <Text style={styles.shadowLabel}>md</Text>
        </View>
        <View style={styles.shadowItem}>
          <View style={[styles.shadowBox, Shadows.lg]} />
          <Text style={styles.shadowLabel}>lg</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// MAIN EXPORT
// =====================================================================
export function BrandStyleStates() {
  const { isDesktop } = useLayout();

  return (
    <StateSection title="STYLE GUIDE">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.containerInner,
          isDesktop && styles.containerInnerDesktop,
        ]}
      >
        <HeroSection isDesktop={isDesktop} />
        <ColorPaletteSection isDesktop={isDesktop} />
        <TypographySection />
        <ButtonsSection isDesktop={isDesktop} />
        <InputsSection isDesktop={isDesktop} />
        <BadgesSection isDesktop={isDesktop} />
        <SpacingSection />
        <RadiusSection isDesktop={isDesktop} />
        <ShadowsSection isDesktop={isDesktop} />
      </ScrollView>
    </StateSection>
  );
}

// =====================================================================
// STYLES
// =====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  containerInner: {
    padding: Spacing.xl,
    gap: Spacing['4xl'],
    paddingBottom: 100,
  },
  containerInnerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 48,
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
  inputGrid: {
    gap: Spacing.lg,
  },
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
