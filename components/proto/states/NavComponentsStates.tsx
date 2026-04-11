import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar, ProtoBurger } from '../NavComponents';

// ---------------------------------------------------------------------------
// Layout helper
// ---------------------------------------------------------------------------
function useLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return { isDesktop, width };
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function DemoSection({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.demoSection}>
      <Text style={s.demoTitle}>{title}</Text>
      {description ? <Text style={s.demoDesc}>{description}</Text> : null}
      <View style={s.demoContent}>
        {children}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 1. Header Variants
// ---------------------------------------------------------------------------
function HeaderShowcase() {
  return (
    <DemoSection
      title="ProtoHeader"
      description="Header variants: guest (public pages), auth (logged-in), back (detail/sub-pages)"
    >
      <View style={s.variantCard}>
        <Text style={s.variantLabel}>variant="guest"</Text>
        <ProtoHeader variant="guest" />
      </View>
      <View style={s.spacer} />
      <View style={s.variantCard}>
        <Text style={s.variantLabel}>variant="auth"</Text>
        <ProtoHeader variant="auth" />
      </View>
      <View style={s.spacer} />
      <View style={s.variantCard}>
        <Text style={s.variantLabel}>variant="back"</Text>
        <ProtoHeader variant="back" backTitle="Заявки" />
      </View>
    </DemoSection>
  );
}

// ---------------------------------------------------------------------------
// 2. Tab Bar — all tabs highlighted
// ---------------------------------------------------------------------------
function TabBarShowcase() {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <DemoSection
      title="ProtoTabBar"
      description="Mobile bottom tab bar. Each tab is interactive — tap to highlight."
    >
      <View style={s.variantCard}>
        <Text style={s.variantLabel}>Client tabs — active: {activeTab}</Text>
        <ProtoTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </DemoSection>
  );
}

// ---------------------------------------------------------------------------
// 3. Burger Menu — closed and open states
// ---------------------------------------------------------------------------
function BurgerShowcase() {
  const [open, setOpen] = useState(false);
  return (
    <DemoSection
      title="ProtoBurger"
      description="Tablet/desktop slide-out drawer. Tap the menu icon to toggle."
    >
      <View style={s.burgerDemo}>
        <ProtoBurger open={open} onToggle={() => setOpen((o) => !o)} />
      </View>
      <View style={s.spacer} />
      <View style={s.variantCard}>
        <Text style={s.variantLabel}>Burger always-open preview</Text>
        <View style={s.burgerStaticWrap}>
          <ProtoBurger open={true} />
        </View>
      </View>
    </DemoSection>
  );
}

// ---------------------------------------------------------------------------
// 4. Combined Navigation — full page shell example
// ---------------------------------------------------------------------------
function FullShellShowcase() {
  const { isDesktop, width } = useLayout();
  return (
    <DemoSection
      title="Full Page Shell"
      description="How header + content + tab bar combine in a real page (desktop vs mobile)"
    >
      <View style={s.shellPreview}>
        {/* Desktop header */}
        {isDesktop ? (
          <View style={s.desktopHeaderRow}>
            <Text style={s.desktopLogo}>Налоговик</Text>
            <View style={s.desktopNavLinks}>
              <Text style={s.desktopNavLink}>Главная</Text>
              <Text style={s.desktopNavLink}>Заявки</Text>
              <Text style={s.desktopNavLink}>Специалисты</Text>
              <Text style={s.desktopNavLink}>Тарифы</Text>
            </View>
            <View style={s.desktopHeaderRight}>
              <Feather name="bell" size={18} color={Colors.textMuted} />
              <Image source={{ uri: 'https://picsum.photos/seed/navuser/80/80' }} style={s.desktopAvatar} />
            </View>
          </View>
        ) : (
          <ProtoHeader variant="auth" />
        )}
        {/* Content placeholder */}
        <View style={s.shellContent}>
          <Feather name="monitor" size={32} color={Colors.textMuted} />
          <Text style={s.shellContentText}>
            {isDesktop ? 'Desktop layout — horizontal nav in header, no tab bar' : 'Mobile layout — header + bottom tab bar'}
          </Text>
          <Text style={s.shellContentWidth}>Viewport: {Math.round(width)}px</Text>
        </View>
        {/* Mobile tab bar only */}
        {!isDesktop && <ProtoTabBar activeTab="home" />}
      </View>
    </DemoSection>
  );
}

// ---------------------------------------------------------------------------
// 5. Admin Navigation
// ---------------------------------------------------------------------------
function AdminNavShowcase() {
  const [activeItem, setActiveItem] = useState('dashboard');
  const items = [
    { id: 'dashboard', icon: 'bar-chart-2' as const, label: 'Статистика' },
    { id: 'users', icon: 'users' as const, label: 'Пользователи' },
    { id: 'requests', icon: 'file-text' as const, label: 'Заявки' },
    { id: 'moderation', icon: 'shield' as const, label: 'Модерация' },
    { id: 'reviews', icon: 'star' as const, label: 'Отзывы' },
    { id: 'promotions', icon: 'gift' as const, label: 'Промо' },
  ];
  return (
    <DemoSection
      title="Admin Navigation"
      description="Horizontal tab bar used in admin section"
    >
      <View style={s.adminBar}>
        <Text style={s.adminLogo}>Налоговик Admin</Text>
        <View style={s.adminTabs}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={[s.adminTab, activeItem === item.id && s.adminTabActive]}
              onPress={() => setActiveItem(item.id)}
            >
              <Feather
                name={item.icon}
                size={16}
                color={activeItem === item.id ? Colors.brandPrimary : Colors.textMuted}
              />
              <Text style={[s.adminTabText, activeItem === item.id && s.adminTabTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </DemoSection>
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
        <HeaderShowcase />
        <TabBarShowcase />
        <BurgerShowcase />
        <FullShellShowcase />
        <AdminNavShowcase />
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
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 48,
  },

  // Demo section
  demoSection: {
    gap: Spacing.md,
  },
  demoTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  demoDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  demoContent: {
    gap: Spacing.lg,
  },

  // Variant card
  variantCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  variantLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },

  spacer: {
    height: Spacing.lg,
  },

  // Burger demo
  burgerDemo: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  burgerStaticWrap: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Full shell preview
  shellPreview: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  shellContent: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  shellContentText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  shellContentWidth: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Desktop header
  desktopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xl,
  },
  desktopLogo: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  desktopNavLinks: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  desktopNavLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  desktopHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: 'auto',
  },
  desktopAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
  },

  // Admin bar
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  adminLogo: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  adminTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  adminTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  adminTabActive: {
    backgroundColor: Colors.bgSecondary,
  },
  adminTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  adminTabTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
});
