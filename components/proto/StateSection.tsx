import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';

interface StateSectionProps {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function StateSection({ title, children, maxWidth = 430 }: StateSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{title}</Text>
        </View>
        <View style={styles.line} />
      </View>
      <View style={[styles.content, { maxWidth }]}>
        <View style={styles.phone}>
          {children}
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
    gap: Spacing.md,
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
    color: '#FFFFFF',
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
});
