import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar, ProtoBurger } from '../NavComponents';

// =====================================================================
// SECTION 1: Colors
// =====================================================================
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
      <Text style={s.blockTitle}>1. Color Palette</Text>
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

// =====================================================================
// SECTION 2: Typography
// =====================================================================
function TypographySection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>2. Typography</Text>
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

// =====================================================================
// SECTION 3: Buttons
// =====================================================================
function ButtonsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>3. Buttons</Text>
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

// =====================================================================
// SECTION 4: Inputs
// =====================================================================
function InputsSection() {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState('');

  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>4. Inputs</Text>
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

// =====================================================================
// SECTION 5: Cards
// =====================================================================
function CardsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>5. Cards</Text>
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
      {/* Request card with specialist avatar */}
      <View style={s.card}>
        <View style={s.cardSpecialist}>
          <Image source={{ uri: 'https://picsum.photos/seed/spec1/80/80' }} style={s.cardAvatar} />
          <View style={s.cardSpecInfo}>
            <Text style={s.cardTitle}>Ivanov Alexey</Text>
            <Text style={s.cardText}>Tax Consultant</Text>
            <View style={s.cardRating}>
              <Feather name="star" size={12} color={Colors.statusWarning} />
              <Text style={s.cardRatingText}>4.8</Text>
              <Text style={s.cardText}>(42 reviews)</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 6: Badges & Tags
// =====================================================================
function BadgesSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>6. Badges & Tags</Text>
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

// =====================================================================
// SECTION 7: Alerts
// =====================================================================
function AlertsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>7. Alerts</Text>
      <View style={[s.alert, { backgroundColor: Colors.statusBg.info, borderColor: Colors.brandPrimary }]}>
        <Feather name="info" size={16} color={Colors.brandPrimary} />
        <Text style={[s.alertText, { color: Colors.brandPrimary }]}>Informational message</Text>
      </View>
      <View style={[s.alert, { backgroundColor: Colors.statusBg.success, borderColor: Colors.statusSuccess }]}>
        <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
        <Text style={[s.alertText, { color: Colors.statusSuccess }]}>Request created successfully</Text>
      </View>
      <View style={[s.alert, { backgroundColor: Colors.statusBg.error, borderColor: Colors.statusError }]}>
        <Feather name="alert-circle" size={16} color={Colors.statusError} />
        <Text style={[s.alertText, { color: Colors.statusError }]}>Error sending data</Text>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 8: List Items
// =====================================================================
function ListItemsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>8. List Items</Text>
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

// =====================================================================
// SECTION 9: Navigation - Header variants
// =====================================================================
function HeaderVariantsSection() {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>9. Navigation - Header</Text>
      <Text style={s.navLabel}>guest - no avatar, login button</Text>
      <ProtoHeader variant="guest" />
      <View style={s.gap} />
      <Text style={s.navLabel}>auth - avatar + notifications</Text>
      <ProtoHeader variant="auth" />
      <View style={s.gap} />
      <Text style={s.navLabel}>back - arrow + page title</Text>
      <ProtoHeader variant="back" backTitle="My Requests" />
    </View>
  );
}

// =====================================================================
// SECTION 10: Navigation - Bottom Tab Bar
// =====================================================================
function TabBarSection() {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>10. Navigation - Bottom Tab Bar</Text>
      <Text style={s.navLabel}>Active tab: {activeTab}</Text>
      <ProtoTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

// =====================================================================
// SECTION 11: Navigation - Burger Menu
// =====================================================================
function BurgerSection() {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>11. Navigation - Burger Menu</Text>
      <Text style={s.navLabel}>Click hamburger icon to toggle drawer</Text>
      <ProtoBurger open={open} onToggle={() => setOpen(!open)} />
    </View>
  );
}

// =====================================================================
// MAIN EXPORT
// =====================================================================
export function BrandStyleStates() {
  return (
    <StateSection title="STYLE GUIDE">
      <ScrollView style={s.container} contentContainerStyle={s.containerInner}>
        <View style={s.header}>
          <Text style={s.title}>P2PTax Brand & UI Kit</Text>
          <Text style={s.subtitle}>Colors, typography, components, navigation</Text>
        </View>

        <ColorsSection />
        <TypographySection />
        <ButtonsSection />
        <InputsSection />
        <CardsSection />
        <BadgesSection />
        <AlertsSection />
        <ListItemsSection />
        <HeaderVariantsSection />
        <TabBarSection />
        <BurgerSection />
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
  gap: { height: Spacing.sm },

  // Nav labels
  navLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

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
  cardSpecialist: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgSecondary },
  cardSpecInfo: { flex: 1, gap: 2 },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardRatingText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },

  // Badges
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  // Tags
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  tagText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  tagActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.statusBg.info },

  // Alerts
  alert: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderLeftWidth: 3 },
  alertText: { flex: 1, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },

  // List items
  listCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  listIcon: { width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: Colors.statusBg.info, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  listSub: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  listDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary },
});
