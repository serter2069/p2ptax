import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius } from '../../../constants/Colors';

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
          <Feather name="shield" size={isDesktop ? 32 : 24} color={Colors.white} />
        </View>
        <Text style={[styles.heroLogoText, isDesktop && styles.heroLogoTextDesktop]}>P2PTax</Text>
      </View>
      <Text style={[styles.heroTagline, isDesktop && styles.heroTaglineDesktop]}>
        Найди налогового специалиста
      </Text>
      <Text style={styles.heroSub}>
        Профессиональный маркетплейс налоговых услуг
      </Text>
      <View style={styles.heroBrandStrip}>
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.brandPrimary }]} />
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.brandSecondary }]} />
        <View style={[styles.heroBrandBlock, { backgroundColor: Colors.brandPrimaryHover }]} />
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
      { label: 'Primary Hover', value: Colors.brandPrimaryHover, token: 'brandPrimaryHover' },
      { label: 'Secondary', value: Colors.brandSecondary, token: 'brandSecondary' },
    ],
  },
  {
    group: 'Backgrounds',
    items: [
      { label: 'BG Primary', value: Colors.bgPrimary, token: 'bgPrimary' },
      { label: 'BG Secondary', value: Colors.bgSecondary, token: 'bgSecondary' },
      { label: 'BG Card', value: Colors.bgCard, token: 'bgCard' },
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
    ],
  },
  {
    group: 'Utility',
    items: [
      { label: 'White', value: Colors.white, token: 'white' },
      { label: 'Border', value: Colors.border, token: 'border' },
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
// SECTION: Typography
// =====================================================================
const TYPO_SAMPLES = [
  { label: 'Display', size: Typography.fontSize.display, weight: Typography.fontWeight.bold, sample: 'P2PTax', color: Colors.textPrimary },
  { label: 'Jumbo', size: Typography.fontSize.jumbo, weight: Typography.fontWeight.bold, sample: '3 500', color: Colors.brandPrimary },
  { label: 'H1 / Title', size: Typography.fontSize.title, weight: Typography.fontWeight.bold, sample: 'Налоговая консультация', color: Colors.textPrimary },
  { label: 'H2 / XL', size: Typography.fontSize.xl, weight: Typography.fontWeight.semibold, sample: 'Выездная проверка', color: Colors.textPrimary },
  { label: 'H3 / LG', size: Typography.fontSize.lg, weight: Typography.fontWeight.semibold, sample: 'Оптимизация налогов', color: Colors.textPrimary },
  { label: 'Body', size: Typography.fontSize.base, weight: Typography.fontWeight.regular, sample: 'Мы подберем специалиста, который решит вашу задачу быстро и профессионально.', color: Colors.textPrimary },
  { label: 'Small', size: Typography.fontSize.sm, weight: Typography.fontWeight.regular, sample: 'Опыт работы от 5 лет, средний рейтинг 4.8', color: Colors.textSecondary },
  { label: 'Caption', size: Typography.fontSize.xs, weight: Typography.fontWeight.medium, sample: 'Обновлено 2 мин. назад', color: Colors.textMuted },
];

function TypographySection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Typography</Text>
      <Text style={styles.sectionDesc}>Font scale and hierarchy</Text>
      <View style={styles.typoList}>
        {TYPO_SAMPLES.map((t) => (
          <View key={t.label} style={styles.typoRow}>
            <View style={styles.typoMeta}>
              <Text style={styles.typoLabel}>{t.label}</Text>
              <Text style={styles.typoSize}>{t.size}px / {t.weight}</Text>
            </View>
            <Text style={{ fontSize: t.size, fontWeight: t.weight as any, color: t.color, lineHeight: t.size * 1.35 }}>
              {t.sample}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: UI Primitives — Buttons
// =====================================================================
function ButtonsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Buttons</Text>
      <Text style={styles.sectionDesc}>Primary, Secondary, Ghost, Destructive, sizes</Text>

      <Text style={styles.subLabel}>Standard</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Primary</Text>
        </View>
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

      <Text style={styles.subLabel}>Semantic</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnDestructive}>
          <Feather name="trash-2" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Destructive</Text>
        </View>
        <View style={styles.btnSuccess}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Success</Text>
        </View>
        <View style={[styles.btnPrimary, styles.btnDisabled]}>
          <Text style={styles.btnPrimaryText}>Disabled</Text>
        </View>
      </View>

      <Text style={styles.subLabel}>With Icons</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.btnIconPrimary}>
          <Feather name="plus" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Создать заявку</Text>
        </View>
        <View style={styles.btnIconOutline}>
          <Feather name="search" size={14} color={Colors.brandPrimary} />
          <Text style={styles.btnOutlineText}>Найти</Text>
        </View>
        <View style={styles.btnSmall}>
          <Text style={styles.btnSmallText}>Small</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: UI Primitives — Badges & Tags
// =====================================================================
function BadgesSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Badges & Service Tags</Text>
      <Text style={styles.sectionDesc}>Status badges and specialist service tags</Text>

      <Text style={styles.subLabel}>Status Badges</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.success }]}>
          <Feather name="check-circle" size={12} color={Colors.statusSuccess} />
          <Text style={[styles.badgeText, { color: Colors.statusSuccess }]}>Верифицирован</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.info }]}>
          <View style={styles.onlineDot} />
          <Text style={[styles.badgeText, { color: Colors.brandPrimary }]}>Онлайн</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.warning }]}>
          <Feather name="award" size={12} color={Colors.statusWarning} />
          <Text style={[styles.badgeText, { color: Colors.statusWarning }]}>Топ</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[styles.badgeText, { color: Colors.statusError }]}>Отклонено</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.accent }]}>
          <Text style={[styles.badgeText, { color: Colors.textFamiliar }]}>Новый</Text>
        </View>
      </View>

      <Text style={styles.subLabel}>Service Tags</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={styles.tag}>
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text style={styles.tagText}>Налоговый аудит</Text>
        </View>
        <View style={styles.tag}>
          <Feather name="file-text" size={12} color={Colors.textMuted} />
          <Text style={styles.tagText}>3-НДФЛ</Text>
        </View>
        <View style={styles.tag}>
          <Feather name="globe" size={12} color={Colors.textMuted} />
          <Text style={styles.tagText}>ВЭД</Text>
        </View>
        <View style={[styles.tag, styles.tagActive]}>
          <Feather name="check" size={12} color={Colors.brandPrimary} />
          <Text style={[styles.tagText, { color: Colors.brandPrimary }]}>ИП / Самозанятые</Text>
        </View>
        <View style={styles.tag}>
          <Feather name="shield" size={12} color={Colors.textMuted} />
          <Text style={styles.tagText}>Споры с ФНС</Text>
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
      <Text style={styles.sectionTitle}>Spacing System</Text>
      <Text style={styles.sectionDesc}>Consistent spacing tokens from Spacing constant</Text>
      <View style={styles.spacingList}>
        {SPACING_ITEMS.map((sp) => (
          <View key={sp.label} style={styles.spacingRow}>
            <Text style={styles.spacingLabel}>{sp.label}</Text>
            <Text style={styles.spacingValue}>{sp.value}px</Text>
            <View style={styles.spacingBarWrap}>
              <View style={[styles.spacingBar, { width: sp.value * 4 }]} />
            </View>
          </View>
        ))}
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
        <BadgesSection isDesktop={isDesktop} />
        <SpacingSection />
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
    padding: Spacing.lg,
    gap: Spacing['4xl'],
    paddingBottom: 80,
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
    borderColor: Colors.border,
  },
  heroWrapDesktop: {
    padding: Spacing['4xl'],
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroLogoIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    letterSpacing: -1,
  },
  heroLogoTextDesktop: {
    fontSize: Typography.fontSize.jumbo,
  },
  heroTagline: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  heroTaglineDesktop: {
    fontSize: Typography.fontSize['2xl'],
  },
  heroSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  heroBrandStrip: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  heroBrandBlock: {
    width: 48,
    height: 6,
    borderRadius: BorderRadius.full,
  },

  // Sections
  section: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  subLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
  },

  // Colors
  colorGroup: {
    gap: Spacing.sm,
  },
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
  colorGridDesktop: {
    gap: Spacing.md,
  },
  colorCard: {
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  colorSwatch: {
    width: 72,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
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
  colorToken: {
    fontSize: 9,
    color: Colors.textMuted,
  },

  // Typography
  typoList: {
    gap: Spacing.lg,
  },
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
  rowDesktop: {
    gap: Spacing.md,
  },
  btnPrimary: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.md,
  },
  btnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusSuccess,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnIconPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  btnIconOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.md,
  },
  btnSmall: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  btnSmallText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
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
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
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
    borderColor: Colors.border,
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
    height: 12,
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
});
