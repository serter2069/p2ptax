import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';

const COLORS = [
  { label: 'Primary', hex: Colors.brandPrimary },
  { label: 'Background', hex: Colors.bgPrimary },
  { label: 'Card', hex: Colors.bgCard },
  { label: 'Text', hex: Colors.textPrimary },
  { label: 'Muted', hex: Colors.textMuted },
  { label: 'Success', hex: Colors.statusSuccess },
  { label: 'Error', hex: Colors.statusError },
];

function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function ColorsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>Colors</Text>
      <View style={s.colorRow}>
        {COLORS.map((c) => (
          <View key={c.label} style={s.colorItem}>
            <View style={[s.colorSwatch, { backgroundColor: c.hex }, isLight(c.hex) && s.swatchBorder]}>
              <Text style={[s.colorHex, { color: isLight(c.hex) ? Colors.textPrimary : Colors.white }]}>{c.hex}</Text>
            </View>
            <Text style={s.colorLabel}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TypographySection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>Typography</Text>
      <View style={s.typoList}>
        <Text style={{ fontSize: Typography.fontSize.display, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>Display 36</Text>
        <Text style={{ fontSize: Typography.fontSize.title, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>Title 22</Text>
        <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>Heading 20</Text>
        <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>Subheading 18</Text>
        <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textPrimary }}>Body 15 — regular text for paragraphs and descriptions</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textSecondary }}>Small 13 — secondary text and captions</Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>Extra small 11 — labels and metadata</Text>
      </View>
    </View>
  );
}

function ButtonsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>Buttons</Text>
      <View style={s.row}>
        <Pressable style={s.btnPrimary}>
          <Text style={s.btnPrimaryText}>Primary</Text>
        </Pressable>
        <Pressable style={s.btnSecondary}>
          <Text style={s.btnSecondaryText}>Secondary</Text>
        </Pressable>
        <Pressable style={s.btnOutline}>
          <Text style={s.btnOutlineText}>Outline</Text>
        </Pressable>
        <Pressable style={s.btnGhost}>
          <Text style={s.btnGhostText}>Ghost</Text>
        </Pressable>
      </View>
      <View style={s.row}>
        <Pressable style={s.btnDanger}>
          <Text style={s.btnPrimaryText}>Danger</Text>
        </Pressable>
        <Pressable style={s.btnSuccess}>
          <Text style={s.btnPrimaryText}>Success</Text>
        </Pressable>
        <Pressable style={[s.btnPrimary, s.btnDisabled]}>
          <Text style={[s.btnPrimaryText, { opacity: 0.5 }]}>Disabled</Text>
        </Pressable>
      </View>
      <View style={s.row}>
        <Pressable style={s.btnIconPrimary}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.btnPrimaryText}>With Icon</Text>
        </Pressable>
        <Pressable style={s.btnIconOutline}>
          <Feather name="download" size={16} color={Colors.brandPrimary} />
          <Text style={s.btnOutlineText}>Download</Text>
        </Pressable>
        <Pressable style={s.btnSmall}>
          <Text style={s.btnSmallText}>Small</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InputsSection() {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState('');

  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>Inputs</Text>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Email</Text>
        <TextInput
          style={[s.input, focused === 'email' && s.inputFocused]}
          placeholder="user@example.com"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused('')}
        />
      </View>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Password</Text>
        <TextInput
          style={[s.input, focused === 'pass' && s.inputFocused]}
          placeholder="Enter password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          onFocus={() => setFocused('pass')}
          onBlur={() => setFocused('')}
        />
      </View>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>With error</Text>
        <TextInput
          style={[s.input, s.inputError]}
          value="bad value"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={s.inputErrorText}>This field is required</Text>
      </View>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Disabled</Text>
        <TextInput
          style={[s.input, s.inputDisabled]}
          value="Cannot edit"
          editable={false}
        />
      </View>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Multiline</Text>
        <TextInput
          style={[s.input, s.inputMultiline, focused === 'multi' && s.inputFocused]}
          placeholder="Describe your request..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          onFocus={() => setFocused('multi')}
          onBlur={() => setFocused('')}
        />
      </View>
    </View>
  );
}

function CardsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>Cards</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Basic Card</Text>
        <Text style={s.cardText}>Standard card with border and white background for content grouping.</Text>
      </View>
      <View style={[s.card, s.cardElevated]}>
        <Text style={s.cardTitle}>Elevated Card</Text>
        <Text style={s.cardText}>Card with shadow for more emphasis.</Text>
      </View>
      <View style={[s.card, s.cardAccent]}>
        <View style={s.cardRow}>
          <View style={s.cardIcon}>
            <Feather name="bell" size={18} color={Colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>With Icon</Text>
            <Text style={s.cardText}>Card with leading icon and horizontal layout.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function BadgesSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>Badges and Tags</Text>
      <View style={s.row}>
        <View style={[s.badge, { backgroundColor: Colors.statusBg.success }]}>
          <Text style={[s.badgeText, { color: Colors.statusSuccess }]}>Active</Text>
        </View>
        <View style={[s.badge, { backgroundColor: Colors.statusBg.warning }]}>
          <Text style={[s.badgeText, { color: Colors.statusWarning }]}>Pending</Text>
        </View>
        <View style={[s.badge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[s.badgeText, { color: Colors.statusError }]}>Rejected</Text>
        </View>
        <View style={[s.badge, { backgroundColor: Colors.statusBg.info }]}>
          <Text style={[s.badgeText, { color: Colors.brandPrimary }]}>Info</Text>
        </View>
      </View>
      <View style={s.row}>
        <View style={s.tag}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={s.tagText}>Moscow</Text>
        </View>
        <View style={s.tag}>
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text style={s.tagText}>Tax Audit</Text>
        </View>
        <View style={[s.tag, s.tagActive]}>
          <Feather name="check" size={12} color={Colors.brandPrimary} />
          <Text style={[s.tagText, { color: Colors.brandPrimary }]}>Selected</Text>
        </View>
      </View>
    </View>
  );
}

function ListItemsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>List Items</Text>
      <View style={s.listCard}>
        <View style={s.listItem}>
          <View style={s.listIcon}>
            <Feather name="user" size={16} color={Colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.listTitle}>Ivan Petrov</Text>
            <Text style={s.listSub}>Tax Consultant</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textMuted} />
        </View>
        <View style={s.listDivider} />
        <View style={s.listItem}>
          <View style={s.listIcon}>
            <Feather name="file-text" size={16} color={Colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.listTitle}>Request #1024</Text>
            <Text style={s.listSub}>Field inspection, Moscow</Text>
          </View>
          <View style={[s.badge, { backgroundColor: Colors.statusBg.success }]}>
            <Text style={[s.badgeText, { color: Colors.statusSuccess }]}>Active</Text>
          </View>
        </View>
        <View style={s.listDivider} />
        <View style={s.listItem}>
          <View style={s.listIcon}>
            <Feather name="message-circle" size={16} color={Colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.listTitle}>New message</Text>
            <Text style={s.listSub}>2 min ago</Text>
          </View>
          <View style={s.notifDot} />
        </View>
      </View>
    </View>
  );
}

export function BrandStyleStates() {
  return (
    <StateSection title="STYLE GUIDE" maxWidth={800}>
      <ScrollView style={s.container} contentContainerStyle={s.containerInner}>
        <View style={s.header}>
          <Text style={s.title}>P2PTax UI Kit</Text>
          <Text style={s.subtitle}>Colors, typography, buttons, inputs, cards, badges</Text>
        </View>

        <ColorsSection />
        <TypographySection />
        <ButtonsSection />
        <InputsSection />
        <CardsSection />
        <BadgesSection />
        <ListItemsSection />
      </ScrollView>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  containerInner: { padding: Spacing.lg, gap: Spacing['3xl'] },

  header: { gap: Spacing.xs },
  title: { fontSize: Typography.fontSize.title, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  block: { gap: Spacing.md },
  blockTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },

  // Colors
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorItem: { alignItems: 'center', gap: Spacing.xs },
  colorSwatch: { width: 80, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  swatchBorder: { borderWidth: 1, borderColor: Colors.border },
  colorHex: { fontSize: 10, fontWeight: Typography.fontWeight.medium },
  colorLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },

  // Typography
  typoList: { gap: Spacing.sm },

  // Buttons
  btnPrimary: { backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  btnSecondary: { backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { color: Colors.brandPrimary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  btnOutline: { borderWidth: 1, borderColor: Colors.brandPrimary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm - 1, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { color: Colors.brandPrimary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  btnGhost: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { color: Colors.brandPrimary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  btnDanger: { backgroundColor: Colors.statusError, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnSuccess: { backgroundColor: Colors.statusSuccess, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnIconPrimary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  btnIconOutline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.brandPrimary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm - 1, borderRadius: BorderRadius.md },
  btnSmall: { backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.sm, alignSelf: 'center' },
  btnSmallText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  // Inputs
  inputGroup: { gap: Spacing.xs },
  inputLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.fontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bgCard },
  inputFocused: { borderColor: Colors.brandPrimary },
  inputError: { borderColor: Colors.statusError },
  inputErrorText: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
  inputDisabled: { backgroundColor: Colors.bgSecondary, opacity: 0.6 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  // Cards
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.xs },
  cardElevated: { borderWidth: 0, ...Shadows.md },
  cardAccent: { borderLeftWidth: 3, borderLeftColor: Colors.brandPrimary },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.statusBg.info, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Badges
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  // Tags
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  tagText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  tagActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.statusBg.info },

  // List items
  listCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  listIcon: { width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: Colors.statusBg.info, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  listSub: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  listDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary },
});
