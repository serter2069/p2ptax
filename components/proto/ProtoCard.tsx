import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import type { PageEntry } from '../../constants/pageRegistry';

interface ProtoCardProps {
  page: PageEntry;
}

const GROUP_COLORS: Record<string, string> = {
  Auth: '#6366F1',
  Onboarding: '#8B5CF6',
  Dashboard: '#1A5BA8',
  Specialist: '#059669',
  Public: '#D97706',
  Admin: '#DC2626',
};

// File path mapping for copy-to-clipboard
function getFilePath(page: PageEntry): string {
  const stateFile = page.id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return `components/proto/states/${stateFile}States.tsx`;
}

function buildCopyText(page: PageEntry): string {
  return [
    `Page: ${page.title}`,
    `Route: ${page.route}`,
    `Proto showcase: /proto/states/${page.id}`,
    `File: ${getFilePath(page)}`,
    `States: ${page.stateCount}`,
    `Group: ${page.group}`,
    `Project: /Users/sergei/Documents/Projects/Ruslan/p2ptax`,
  ].join('\n');
}

export function ProtoCard({ page }: ProtoCardProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const groupColor = GROUP_COLORS[page.group] || Colors.brandPrimary;

  const handleOpenNewTab = () => {
    if (Platform.OS === 'web') {
      window.open(`/proto/states/${page.id}`, '_blank');
    }
  };

  const handleTogglePreview = () => {
    setExpanded((v) => !v);
  };

  const handleCopy = useCallback(() => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(buildCopyText(page)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }, [page]);

  const webProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  return (
    <View
      style={[styles.card, hovered && styles.cardHovered]}
      {...(webProps as any)}
    >
      <View style={[styles.accent, { backgroundColor: groupColor }]} />
      <View style={styles.body}>
        {/* Header row: title + action buttons */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleOpenNewTab} activeOpacity={0.7} style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={2}>{page.title}</Text>
            <Text style={styles.openIcon}>&#8599;</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.7} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>{copied ? '\u2713' : '\u2398'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTogglePreview} activeOpacity={0.7} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>{expanded ? '\u25B2' : '\u25BC'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Route + meta */}
        <Text style={styles.route} numberOfLines={1}>{page.route}</Text>
        <View style={styles.footer}>
          <View style={styles.stateBadge}>
            <Text style={styles.stateCount}>{page.stateCount}</Text>
            <Text style={styles.stateLabel}>
              {page.stateCount === 1 ? 'состояние' : page.stateCount < 5 ? 'состояния' : 'состояний'}
            </Text>
          </View>
          <Text style={styles.filePath}>{getFilePath(page)}</Text>
        </View>

        {/* Iframe preview */}
        {expanded && Platform.OS === 'web' && (
          <View style={styles.previewWrap}>
            <iframe
              src={`/proto/states/${page.id}`}
              style={{
                width: '100%',
                height: 480,
                border: `1px solid ${Colors.border}`,
                borderRadius: BorderRadius.md,
                backgroundColor: '#fff',
              }}
              title={page.title}
            />
          </View>
        )}
      </View>
    </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  openIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 14,
    color: Colors.textMuted,
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
    gap: Spacing.sm,
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
  filePath: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    opacity: 0.6,
  },
  previewWrap: {
    marginTop: Spacing.md,
  },
});
