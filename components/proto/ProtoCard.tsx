import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import type { ProtoPage } from '../../constants/protoRegistry';

interface ProtoCardProps {
  page: ProtoPage;
}

const GROUP_COLORS: Record<string, string> = {
  Auth: '#6366F1',
  Onboarding: '#8B5CF6',
  Dashboard: '#1A5BA8',
  Specialist: '#059669',
  Public: '#D97706',
  Admin: '#DC2626',
};

export function ProtoCard({ page }: ProtoCardProps) {
  const [hovered, setHovered] = useState(false);
  const groupColor = GROUP_COLORS[page.group] || Colors.brandPrimary;

  const handlePress = () => {
    if (Platform.OS === 'web') {
      window.open(`/proto/states/${page.id}`, '_blank');
    }
  };

  const webProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.card,
        hovered && styles.cardHovered,
      ]}
      {...(webProps as any)}
    >
      <View style={[styles.accent, { backgroundColor: groupColor }]} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{page.title}</Text>
        <Text style={styles.route} numberOfLines={1}>{page.route}</Text>
        <View style={styles.footer}>
          <View style={styles.stateBadge}>
            <Text style={styles.stateCount}>{page.stateCount}</Text>
            <Text style={styles.stateLabel}>
              {page.stateCount === 1 ? 'состояние' : page.stateCount < 5 ? 'состояния' : 'состояний'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadows.sm,
  },
  cardHovered: {
    borderColor: Colors.brandPrimary,
    ...Shadows.md,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  route: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  stateCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  stateLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
});
