import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import type { NavVariant } from '../../constants/pageRegistry';
import { ProtoNavHeader, ProtoNavFooter } from './ProtoNav';

interface ProtoLayoutProps {
  title: string;
  route: string;
  nav?: NavVariant;
  children: React.ReactNode;
}

export function ProtoLayout({ title, route, nav, children }: ProtoLayoutProps) {
  const handleBack = () => {
    if (Platform.OS === 'web') {
      window.open('/proto', '_self');
    }
  };

  const showNav = nav && nav !== 'none';

  return (
    <View style={styles.container}>
      {showNav && <ProtoNavHeader variant={nav!} />}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>{'<'}</Text>
          <Text style={styles.backLabel}>Индекс</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.route}>{route}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
      {showNav && <ProtoNavFooter variant={nav!} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    gap: 4,
  },
  backIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },
  backLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  route: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerRight: {
    width: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing['3xl'],
    paddingBottom: 64,
  },
});
