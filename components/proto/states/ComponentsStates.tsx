import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';

// =====================================================================
// HELPERS
// =====================================================================
function useLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return { isDesktop };
}

// =====================================================================
// SECTION: Buttons (all variants)
// =====================================================================
function ButtonsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Buttons</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <Pressable style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Primary Action</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Secondary</Text>
        </Pressable>
        <Pressable style={styles.btnOutline}>
          <Feather name="filter" size={14} color={Colors.brandPrimary} />
          <Text style={styles.btnOutlineText}>With Icon</Text>
        </Pressable>
        <Pressable style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>Ghost</Text>
        </Pressable>
        <Pressable style={[styles.btnPrimary, styles.btnDisabled]}>
          <Text style={styles.btnPrimaryText}>Disabled</Text>
        </Pressable>
      </View>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <Pressable style={styles.btnDestructive}>
          <Feather name="trash-2" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Delete</Text>
        </Pressable>
        <Pressable style={styles.btnSuccess}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>Confirm</Text>
        </Pressable>
        <Pressable style={styles.btnSmall}>
          <Text style={styles.btnSmallText}>Small</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Inputs
// =====================================================================
function InputsSection() {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState('');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inputs</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Standard</Text>
        <TextInput
          style={[styles.input, focused === 'std' && styles.inputFocused, { outlineStyle: 'none' } as any]}
          placeholder="Enter text..."
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused('std')}
          onBlur={() => setFocused('')}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>With Icon</Text>
        <View style={[styles.inputWithIcon, focused === 'icon' && styles.inputFocused]}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={[styles.inputInner, { outlineStyle: 'none' } as any]}
            placeholder="Search specialist..."
            placeholderTextColor={Colors.textMuted}
            onFocus={() => setFocused('icon')}
            onBlur={() => setFocused('')}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Error</Text>
        <TextInput
          style={[styles.input, styles.inputError, { outlineStyle: 'none' } as any]}
          value="bad-value"
          placeholderTextColor={Colors.textMuted}
        />
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={Colors.statusError} />
          <Text style={styles.inputErrorText}>Required field</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Disabled</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled, { outlineStyle: 'none' } as any]}
          value="Disabled input"
          editable={false}
        />
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Selects / Dropdowns
// =====================================================================
function SelectsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Selects</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Default</Text>
        <View style={styles.selectWrap}>
          <Text style={styles.selectPlaceholder}>Choose city...</Text>
          <Feather name="chevron-down" size={16} color={Colors.textMuted} />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Selected</Text>
        <View style={styles.selectWrap}>
          <Text style={styles.selectValue}>Moscow</Text>
          <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Checkboxes & Toggles
// =====================================================================
function CheckboxToggleSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Checkboxes & Toggles</Text>

      <Text style={styles.subLabel}>Checkboxes</Text>
      <View style={styles.checkRow}>
        <View style={styles.checkboxUnchecked} />
        <Text style={styles.checkLabel}>Unchecked</Text>
      </View>
      <View style={styles.checkRow}>
        <View style={styles.checkboxChecked}>
          <Feather name="check" size={14} color={Colors.white} />
        </View>
        <Text style={styles.checkLabel}>Checked</Text>
      </View>
      <View style={styles.checkRow}>
        <View style={[styles.checkboxUnchecked, { opacity: 0.4 }]} />
        <Text style={[styles.checkLabel, { opacity: 0.4 }]}>Disabled</Text>
      </View>

      <Text style={[styles.subLabel, { marginTop: Spacing.lg }]}>Toggles</Text>
      <View style={styles.checkRow}>
        <View style={styles.toggleOff}>
          <View style={styles.toggleKnobOff} />
        </View>
        <Text style={styles.checkLabel}>Off</Text>
      </View>
      <View style={styles.checkRow}>
        <View style={styles.toggleOn}>
          <View style={styles.toggleKnobOn} />
        </View>
        <Text style={styles.checkLabel}>On</Text>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Cards
// =====================================================================
function CardsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cards</Text>

      {/* Specialist Card */}
      <View style={[styles.specCard, isDesktop && { maxWidth: 400 }]}>
        <View style={styles.specTop}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/spec1/120/120' }}
            style={styles.specAvatar}
          />
          <View style={styles.specInfo}>
            <Text style={styles.specName}>Alexei Ivanov</Text>
            <Text style={styles.specRole}>Tax Consultant</Text>
            <View style={styles.specRatingRow}>
              <View style={styles.specStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Feather key={i} name="star" size={13} color={i <= 4 ? Colors.statusWarning : Colors.border} />
                ))}
              </View>
              <Text style={styles.specRatingText}>4.8</Text>
              <Text style={styles.specReviews}>(42)</Text>
            </View>
          </View>
        </View>
        <View style={styles.specTagsRow}>
          {['3-NDFL', 'IP', 'Audit'].map((t) => (
            <View key={t} style={styles.specTag}>
              <Text style={styles.specTagText}>{t}</Text>
            </View>
          ))}
        </View>
        <View style={styles.specBottom}>
          <Text style={styles.specPrice}>3 500 RUB/hr</Text>
          <Pressable style={styles.specBtn}>
            <Feather name="message-circle" size={14} color={Colors.white} />
            <Text style={styles.specBtnText}>Contact</Text>
          </Pressable>
        </View>
      </View>

      {/* Request Card */}
      <View style={styles.reqCard}>
        <View style={styles.reqHeader}>
          <Text style={styles.reqTitle}>3-NDFL Declaration</Text>
          <View style={[styles.reqBadge, { backgroundColor: Colors.statusBg.success }]}>
            <Text style={[styles.reqBadgeText, { color: Colors.statusSuccess }]}>Active</Text>
          </View>
        </View>
        <Text style={styles.reqDesc}>Filing for tax deduction on real estate purchase 2025</Text>
        <View style={styles.reqFooter}>
          <View style={styles.reqMeta}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={styles.reqMetaText}>12 Apr 2026</Text>
          </View>
          <Text style={styles.reqPrice}>5 000 RUB</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Badges & Avatars
// =====================================================================
function BadgesAvatarsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Badges & Avatars</Text>

      <Text style={styles.subLabel}>Avatars</Text>
      <View style={[styles.row, { gap: Spacing.md }]}>
        <Image source={{ uri: 'https://picsum.photos/seed/av1/80/80' }} style={styles.avatarLg} />
        <Image source={{ uri: 'https://picsum.photos/seed/av2/60/60' }} style={styles.avatarMd} />
        <View style={styles.avatarSm}>
          <Text style={styles.avatarSmText}>AP</Text>
        </View>
        <View style={styles.avatarSmMuted}>
          <Feather name="user" size={16} color={Colors.textMuted} />
        </View>
      </View>

      <Text style={[styles.subLabel, { marginTop: Spacing.lg }]}>Status Badges</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.success }]}>
          <Feather name="check-circle" size={12} color={Colors.statusSuccess} />
          <Text style={[styles.badgeText, { color: Colors.statusSuccess }]}>Verified</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.warning }]}>
          <Feather name="clock" size={12} color={Colors.statusWarning} />
          <Text style={[styles.badgeText, { color: Colors.statusWarning }]}>Pending</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[styles.badgeText, { color: Colors.statusError }]}>Rejected</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.info }]}>
          <Text style={[styles.badgeText, { color: Colors.brandPrimary }]}>New</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.statusBg.neutral }]}>
          <Text style={[styles.badgeText, { color: Colors.statusNeutral }]}>Draft</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Tab Bar
// =====================================================================
const TABS = [
  { id: 'home', icon: 'home' as const, label: 'Home' },
  { id: 'requests', icon: 'file-text' as const, label: 'Requests' },
  { id: 'messages', icon: 'message-circle' as const, label: 'Messages' },
  { id: 'profile', icon: 'user' as const, label: 'Profile' },
];

function TabBarSection() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tab Bar</Text>
      <Text style={styles.sectionDesc}>Tap to switch active state</Text>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable key={tab.id} style={styles.tabItem} onPress={() => setActiveTab(tab.id)}>
              <Feather name={tab.icon} size={20} color={active ? Colors.brandPrimary : Colors.textMuted} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {tab.id === 'messages' && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>3</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Toasts / Notifications
// =====================================================================
function ToastsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Toasts</Text>

      <View style={[styles.toast, { borderLeftColor: Colors.statusSuccess }]}>
        <Feather name="check-circle" size={18} color={Colors.statusSuccess} />
        <View style={styles.toastBody}>
          <Text style={styles.toastTitle}>Success</Text>
          <Text style={styles.toastMsg}>Request submitted successfully.</Text>
        </View>
      </View>

      <View style={[styles.toast, { borderLeftColor: Colors.statusError }]}>
        <Feather name="alert-circle" size={18} color={Colors.statusError} />
        <View style={styles.toastBody}>
          <Text style={styles.toastTitle}>Error</Text>
          <Text style={styles.toastMsg}>Failed to load data. Try again.</Text>
        </View>
      </View>

      <View style={[styles.toast, { borderLeftColor: Colors.statusWarning }]}>
        <Feather name="alert-triangle" size={18} color={Colors.statusWarning} />
        <View style={styles.toastBody}>
          <Text style={styles.toastTitle}>Warning</Text>
          <Text style={styles.toastMsg}>Your session will expire soon.</Text>
        </View>
      </View>

      <View style={[styles.toast, { borderLeftColor: Colors.brandPrimary }]}>
        <Feather name="info" size={18} color={Colors.brandPrimary} />
        <View style={styles.toastBody}>
          <Text style={styles.toastTitle}>Info</Text>
          <Text style={styles.toastMsg}>3 new responses to your request.</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Empty State
// =====================================================================
function EmptyStateSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Empty State</Text>
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Feather name="inbox" size={36} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No requests yet</Text>
        <Text style={styles.emptyDesc}>
          Create your first request to find a qualified tax specialist
        </Text>
        <Pressable style={styles.emptyCta}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={styles.emptyCtaText}>Create Request</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION: Loading Skeletons
// =====================================================================
function SkeletonSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Loading Skeletons</Text>
      <View style={styles.skelCard}>
        <View style={styles.skelRow}>
          <View style={styles.skelCircle} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skelLine, { width: '60%' }]} />
            <View style={[styles.skelLine, { width: '40%' }]} />
          </View>
        </View>
        <View style={[styles.skelLine, { width: '100%' }]} />
        <View style={[styles.skelLine, { width: '80%' }]} />
      </View>
      <View style={styles.skelCard}>
        <View style={[styles.skelLine, { width: '70%', height: 18 }]} />
        <View style={[styles.skelLine, { width: '100%' }]} />
        <View style={[styles.skelLine, { width: '50%' }]} />
      </View>
    </View>
  );
}

// =====================================================================
// MAIN EXPORT
// =====================================================================
export function ComponentsStates() {
  const { isDesktop } = useLayout();

  return (
    <StateSection title="DEFAULT">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.containerInner,
          isDesktop && styles.containerInnerDesktop,
        ]}
      >
        <ButtonsSection isDesktop={isDesktop} />
        <InputsSection />
        <SelectsSection />
        <CheckboxToggleSection />
        <TabBarSection />
        <CardsSection isDesktop={isDesktop} />
        <BadgesAvatarsSection isDesktop={isDesktop} />
        <ToastsSection />
        <EmptyStateSection />
        <SkeletonSection />
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
    gap: Spacing['3xl'],
    paddingBottom: 100,
  },
  containerInnerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 48,
  },

  // Section
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
  subLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  btnSecondaryText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.btn,
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
  btnDisabled: { opacity: 0.4 },

  // Inputs
  inputGroup: { gap: Spacing.xs },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  inputFocused: { borderColor: Colors.brandPrimary, borderWidth: 2 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
  },
  inputInner: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.statusError, borderWidth: 2 },
  inputDisabled: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    backgroundColor: Colors.bgSecondary,
    opacity: 0.6,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inputErrorText: { fontSize: Typography.fontSize.xs, color: Colors.statusError },

  // Selects
  selectWrap: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
  },
  selectPlaceholder: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  selectValue: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },

  // Checkboxes & Toggles
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  toggleOff: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnobOff: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  toggleOn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brandPrimary,
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignItems: 'flex-end',
  },
  toggleKnobOn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },

  // Specialist Card
  specCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  specTop: { flexDirection: 'row', gap: Spacing.md },
  specAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgSecondary },
  specInfo: { flex: 1, gap: 2 },
  specName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  specRole: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  specRatingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  specStars: { flexDirection: 'row', gap: 1 },
  specRatingText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  specReviews: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  specTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  specTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.statusBg.info,
  },
  specTagText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  specBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  specPrice: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  specBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  specBtnText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },

  // Request Card
  reqCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  reqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reqTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  reqBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  reqBadgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  reqDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  reqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  reqMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqMetaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  reqPrice: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },

  // Avatars
  avatarLg: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgSecondary },
  avatarMd: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  avatarSmMuted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
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
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  // Tab Bar
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
    position: 'relative',
  },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabLabelActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.bold },
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: '25%',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.statusError,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontWeight: Typography.fontWeight.bold, color: Colors.white },

  // Toasts
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  toastBody: { flex: 1, gap: 2 },
  toastTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  toastMsg: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Empty State
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  emptyDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    marginTop: Spacing.sm,
  },
  emptyCtaText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },

  // Skeletons
  skelCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  skelRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  skelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgSecondary,
  },
  skelLine: {
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.bgSecondary,
  },
});
