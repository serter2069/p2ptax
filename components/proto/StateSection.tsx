import React, { createContext, useContext } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { getPageById } from '../../constants/pageRegistry';
import { ProtoNavHeader, ProtoNavFooter } from './ProtoNav';

// Context so all StateSections get pageId without prop drilling
const PageIdContext = createContext<string>('');
export const PageIdProvider = PageIdContext.Provider;

interface StateSectionProps {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
  pageId?: string;
}

export function StateSection({ title, children, maxWidth = 430, pageId: pageIdProp }: StateSectionProps) {
  const contextPageId = useContext(PageIdContext);
  const pageId = pageIdProp || contextPageId;
  const page = pageId ? getPageById(pageId) : undefined;
  const webProps = Platform.OS === 'web' ? { 'data-state-name': title } : {};

  return (
    <View {...webProps} style={styles.section}>
      <View style={styles.labelRow}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{title}</Text>
        </View>
        <View style={styles.line} />
      </View>
      <View style={[styles.content, { maxWidth }]}>
        <View style={styles.phone}>
          {page && <ProtoNavHeader variant={page.nav} activeTab={page.activeTab} />}
          <View style={styles.phoneBody}>
            {children}
          </View>
          {page && <ProtoNavFooter variant={page.nav} activeTab={page.activeTab} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  labelBadge: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  labelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
  },
  phone: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    minHeight: 200,
  },
  phoneBody: {
    flex: 1,
  },
});
