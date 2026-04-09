import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius } from '../../../constants/Colors';

const BRAND_COLORS = [
  { name: 'brandPrimary', hex: Colors.brandPrimary, label: 'Brand Primary' },
  { name: 'brandPrimaryHover', hex: Colors.brandPrimaryHover, label: 'Brand Hover' },
  { name: 'brandSecondary', hex: Colors.brandSecondary, label: 'Brand Secondary' },
];

const BG_COLORS = [
  { name: 'bgPrimary', hex: Colors.bgPrimary, label: 'BG Primary' },
  { name: 'bgSecondary', hex: Colors.bgSecondary, label: 'BG Secondary' },
  { name: 'bgCard', hex: Colors.bgCard, label: 'BG Card' },
];

const TEXT_COLORS = [
  { name: 'textPrimary', hex: Colors.textPrimary, label: 'Text Primary' },
  { name: 'textSecondary', hex: Colors.textSecondary, label: 'Text Secondary' },
  { name: 'textMuted', hex: Colors.textMuted, label: 'Text Muted' },
  { name: 'textAccent', hex: Colors.textAccent, label: 'Text Accent' },
  { name: 'textFamiliar', hex: Colors.textFamiliar, label: 'Text Familiar' },
];

const STATUS_COLORS = [
  { name: 'statusSuccess', hex: Colors.statusSuccess, label: 'Success' },
  { name: 'statusWarning', hex: Colors.statusWarning, label: 'Warning' },
  { name: 'statusError', hex: Colors.statusError, label: 'Error' },
  { name: 'statusInfo', hex: Colors.statusInfo, label: 'Info' },
];

const BORDER_COLORS = [
  { name: 'border', hex: Colors.border, label: 'Border' },
  { name: 'borderLight', hex: Colors.borderLight, label: 'Border Light' },
];

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function ColorSwatch({ name, hex, label }: { name: string; hex: string; label: string }) {
  const light = isLightColor(hex);
  return (
    <View style={s.swatchWrap}>
      <View style={[s.swatch, { backgroundColor: hex }, light && s.swatchBorder]}>
        <Text style={[s.swatchHex, { color: light ? Colors.textPrimary : '#FFFFFF' }]}>{hex}</Text>
      </View>
      <Text style={s.swatchLabel}>{label}</Text>
      <Text style={s.swatchName}>{name}</Text>
    </View>
  );
}

function ColorGroup({ title, colors }: { title: string; colors: { name: string; hex: string; label: string }[] }) {
  return (
    <View style={s.colorGroup}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.swatchRow}>
        {colors.map((c) => <ColorSwatch key={c.name} {...c} />)}
      </View>
    </View>
  );
}

function TypographyShowcase() {
  const sizes = Object.entries(Typography.fontSize) as [string, number][];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Typography</Text>
      <View style={s.typoList}>
        {sizes.map(([name, size]) => (
          <View key={name} style={s.typoRow}>
            <View style={s.typoMeta}>
              <Text style={s.typoName}>{name}</Text>
              <Text style={s.typoSize}>{size}px</Text>
            </View>
            <Text style={[s.typoSample, { fontSize: Math.min(size, 36) }]}>
              P2PTax
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SpacingShowcase() {
  const spacings = Object.entries(Spacing) as [string, number][];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Spacing</Text>
      <View style={s.spacingList}>
        {spacings.map(([name, value]) => (
          <View key={name} style={s.spacingRow}>
            <Text style={s.spacingLabel}>{name}</Text>
            <Text style={s.spacingValue}>{value}px</Text>
            <View style={s.spacingBarWrap}>
              <View style={[s.spacingBar, { width: value * 4 }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function BorderRadiusShowcase() {
  const radii = Object.entries(BorderRadius).filter(([, v]) => v < 100) as [string, number][];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Border Radius</Text>
      <View style={s.radiusRow}>
        {radii.map(([name, value]) => (
          <View key={name} style={s.radiusItem}>
            <View style={[s.radiusBox, { borderRadius: value }]} />
            <Text style={s.radiusName}>{name}</Text>
            <Text style={s.radiusValue}>{value}px</Text>
          </View>
        ))}
        <View style={s.radiusItem}>
          <View style={[s.radiusBox, { borderRadius: BorderRadius.full, width: 48, height: 48 }]} />
          <Text style={s.radiusName}>full</Text>
          <Text style={s.radiusValue}>circle</Text>
        </View>
      </View>
    </View>
  );
}

export function BrandStyleStates() {
  return (
    <StateSection title="STYLE GUIDE" maxWidth={800}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>P2PTax Design Tokens</Text>
          <Text style={s.subtitle}>Visual reference for colors, typography, spacing, and radii</Text>
        </View>

        <ColorGroup title="Brand" colors={BRAND_COLORS} />
        <ColorGroup title="Backgrounds" colors={BG_COLORS} />
        <ColorGroup title="Text" colors={TEXT_COLORS} />
        <ColorGroup title="Status" colors={STATUS_COLORS} />
        <ColorGroup title="Borders" colors={BORDER_COLORS} />

        <TypographyShowcase />
        <SpacingShowcase />
        <BorderRadiusShowcase />
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing['3xl'] },

  header: { gap: Spacing.sm },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted },

  // Color groups
  colorGroup: { gap: Spacing.md },
  groupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  swatchWrap: { width: 100, gap: Spacing.xs },
  swatch: {
    width: 100, height: 64, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchBorder: { borderWidth: 1, borderColor: Colors.border },
  swatchHex: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  swatchLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  swatchName: { fontSize: 10, color: Colors.textMuted },

  // Sections
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  // Typography
  typoList: { gap: Spacing.sm },
  typoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  typoMeta: { gap: 2 },
  typoName: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textAccent },
  typoSize: { fontSize: 10, color: Colors.textMuted },
  typoSample: { fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  // Spacing
  spacingList: { gap: Spacing.sm },
  spacingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  spacingLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textAccent, width: 32 },
  spacingValue: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, width: 36 },
  spacingBarWrap: { flex: 1 },
  spacingBar: { height: 12, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.sm, minWidth: 4 },

  // Border radius
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  radiusItem: { alignItems: 'center', gap: Spacing.xs },
  radiusBox: {
    width: 56, height: 56, backgroundColor: Colors.brandPrimary,
  },
  radiusName: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  radiusValue: { fontSize: 10, color: Colors.textMuted },
});
