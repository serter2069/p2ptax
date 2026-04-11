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
// SECTION 1: Header
// =====================================================================
function HeaderSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Header</Text>
      <View style={styles.headerBar}>
        <View style={styles.headerLogoRow}>
          <View style={styles.headerLogoIcon}>
            <Feather name="shield" size={16} color={Colors.white} />
          </View>
          <Text style={styles.headerLogoText}>P2PTax</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconBtn}>
            <Feather name="search" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.headerIconBtn}>
            <View>
              <Feather name="bell" size={20} color={Colors.textSecondary} />
              <View style={styles.notifBadge} />
            </View>
          </Pressable>
          <Image
            source={{ uri: 'https://picsum.photos/seed/user42/80/80' }}
            style={styles.headerAvatar}
          />
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 2: Specialist Card
// =====================================================================
function SpecialistCardSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Specialist Card</Text>
      <View style={[styles.specCard, isDesktop && styles.specCardDesktop]}>
        <View style={styles.specTop}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/spec1/120/120' }}
            style={styles.specAvatar}
          />
          <View style={styles.specInfo}>
            <Text style={styles.specName}>Алексей Иванов</Text>
            <Text style={styles.specRole}>Налоговый консультант</Text>
            <View style={styles.specRatingRow}>
              <View style={styles.specStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Feather
                    key={i}
                    name="star"
                    size={14}
                    color={i <= 4 ? Colors.statusWarning : Colors.border}
                  />
                ))}
              </View>
              <Text style={styles.specRatingText}>4.8</Text>
              <Text style={styles.specReviews}>(42 отзыва)</Text>
            </View>
          </View>
        </View>

        <View style={styles.specTagsRow}>
          <View style={styles.specTag}>
            <Text style={styles.specTagText}>3-НДФЛ</Text>
          </View>
          <View style={styles.specTag}>
            <Text style={styles.specTagText}>ИП</Text>
          </View>
          <View style={styles.specTag}>
            <Text style={styles.specTagText}>Аудит</Text>
          </View>
        </View>

        <View style={styles.specBottom}>
          <View style={styles.specPriceBlock}>
            <Text style={styles.specPrice}>3 500 RUB/час</Text>
            <Text style={styles.specAvail}>Доступен сейчас</Text>
          </View>
          <Pressable style={styles.specBtn}>
            <Feather name="message-circle" size={14} color={Colors.white} />
            <Text style={styles.specBtnText}>Написать</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 3: Tab Bar
// =====================================================================
const TABS = [
  { id: 'home', icon: 'home' as const, label: 'Главная' },
  { id: 'requests', icon: 'file-text' as const, label: 'Заявки' },
  { id: 'messages', icon: 'message-circle' as const, label: 'Сообщения' },
  { id: 'profile', icon: 'user' as const, label: 'Профиль' },
];

function TabBarSection() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tab Bar</Text>
      <Text style={styles.sectionDesc}>Active: {activeTab} (tap to switch)</Text>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <Feather
                name={tab.icon}
                size={20}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.id === 'messages' && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>3</Text></View>}
            </Pressable>
          );
        })}
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inputs</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Standard</Text>
        <TextInput
          style={[styles.input, focused === 'std' && styles.inputFocused]}
          placeholder="Введите текст..."
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
            style={styles.inputInner}
            placeholder="Поиск специалиста..."
            placeholderTextColor={Colors.textMuted}
            onFocus={() => setFocused('icon')}
            onBlur={() => setFocused('')}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>With Error</Text>
        <TextInput
          style={[styles.input, styles.inputError]}
          value="некорректное значение"
          placeholderTextColor={Colors.textMuted}
        />
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={Colors.statusError} />
          <Text style={styles.inputErrorText}>Обязательное поле</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 5: Buttons (all variants)
// =====================================================================
function ButtonsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Buttons</Text>
      <View style={[styles.row, isDesktop && styles.rowDesktop]}>
        <Pressable style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Отправить заявку</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Отмена</Text>
        </Pressable>
        <Pressable style={styles.btnOutline}>
          <Feather name="filter" size={14} color={Colors.brandPrimary} />
          <Text style={styles.btnOutlineText}>Фильтры</Text>
        </Pressable>
        <Pressable style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>Подробнее</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 6: Request Card
// =====================================================================
function RequestCardSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Request Card</Text>

      <View style={styles.reqCard}>
        <View style={styles.reqHeader}>
          <View style={styles.reqTitleRow}>
            <Feather name="file-text" size={16} color={Colors.brandPrimary} />
            <Text style={styles.reqTitle}>Декларация 3-НДФЛ</Text>
          </View>
          <View style={[styles.reqBadge, { backgroundColor: Colors.statusBg.success }]}>
            <Text style={[styles.reqBadgeText, { color: Colors.statusSuccess }]}>Активна</Text>
          </View>
        </View>
        <Text style={styles.reqDesc}>Заполнение декларации за 2025 год, доходы от продажи недвижимости</Text>
        <View style={styles.reqFooter}>
          <View style={styles.reqMeta}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={styles.reqMetaText}>12 апреля 2026</Text>
          </View>
          <Text style={styles.reqPrice}>5 000 RUB</Text>
        </View>
      </View>

      <View style={styles.reqCard}>
        <View style={styles.reqHeader}>
          <View style={styles.reqTitleRow}>
            <Feather name="file-text" size={16} color={Colors.brandPrimary} />
            <Text style={styles.reqTitle}>Оптимизация ООО</Text>
          </View>
          <View style={[styles.reqBadge, { backgroundColor: Colors.statusBg.warning }]}>
            <Text style={[styles.reqBadgeText, { color: Colors.statusWarning }]}>Ожидает</Text>
          </View>
        </View>
        <Text style={styles.reqDesc}>Оптимизация налоговой нагрузки для ООО, оборот 10M+</Text>
        <View style={styles.reqFooter}>
          <View style={styles.reqMeta}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={styles.reqMetaText}>10 апреля 2026</Text>
          </View>
          <Text style={styles.reqPrice}>15 000 RUB</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SECTION 7: Empty State
// =====================================================================
function EmptyStateSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Empty State</Text>
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Feather name="inbox" size={40} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Заявок пока нет</Text>
        <Text style={styles.emptyDesc}>
          Создайте первую заявку, чтобы найти подходящего налогового специалиста
        </Text>
        <Pressable style={styles.emptyCta}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={styles.emptyCtaText}>Создать заявку</Text>
        </Pressable>
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
        <HeaderSection />
        <SpecialistCardSection isDesktop={isDesktop} />
        <TabBarSection />
        <InputsSection />
        <ButtonsSection isDesktop={isDesktop} />
        <RequestCardSection />
        <EmptyStateSection />
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
    gap: Spacing['3xl'],
    paddingBottom: 80,
  },
  containerInnerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 48,
  },

  // Section
  section: {
    gap: Spacing.md,
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

  // Header
  headerBar: {
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
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconBtn: {
    padding: Spacing.xs,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
  },

  // Specialist Card
  specCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  specCardDesktop: {
    maxWidth: 420,
  },
  specTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  specAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgSecondary,
  },
  specInfo: {
    flex: 1,
    gap: 2,
  },
  specName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  specRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  specRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  specStars: {
    flexDirection: 'row',
    gap: 1,
  },
  specRatingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  specReviews: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  specTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  specTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.statusBg.info,
  },
  specTagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  specBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  specPriceBlock: {
    gap: 2,
  },
  specPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  specAvail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  specBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  specBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Tab Bar
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
    position: 'relative',
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
  tabBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Inputs
  inputGroup: {
    gap: Spacing.xs,
  },
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  inputFocused: {
    borderColor: Colors.brandPrimary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
  },
  inputInner: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.statusError,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.md,
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

  // Request Card
  reqCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  reqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  reqTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  reqBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  reqBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  reqDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  reqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  reqMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  reqPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },

  // Empty State
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  emptyCtaText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
