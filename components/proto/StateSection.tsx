import React, { useState, useCallback, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { getPageById, getNotesForState, getPageNotes } from '../../constants/pageRegistry';
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

function getFilePath(pageId: string): string {
  const stateFile = pageId
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return `components/proto/states/${stateFile}States.tsx`;
}

function buildStateCopyText(pageId: string, stateTitle: string): string {
  const page = getPageById(pageId);
  if (!page) {
    return `State: ${stateTitle}`;
  }
  const lines = [
    `Page: ${page.title}`,
    `State: ${stateTitle}`,
    `Route: ${page.route}`,
    `File: ${getFilePath(pageId)}`,
    `Showcase: /proto/states/${pageId}`,
    `Project: /Users/sergei/Documents/Projects/Ruslan/p2ptax`,
  ];

  // Include existing notes for this state
  const stateNotes = getNotesForState(pageId, stateTitle);
  const pageNotes = getPageNotes(pageId).filter((n) => !n.state);
  const allNotes = [...stateNotes, ...pageNotes];
  if (allNotes.length > 0) {
    lines.push('');
    lines.push('Notes:');
    allNotes.forEach((n) => lines.push(`- [${n.date}] ${n.text}`));
  }

  lines.push('');
  lines.push(`Task: update state "${stateTitle}" on page "${page.title}" (${page.route})`);
  return lines.join('\n');
}

export function StateSection({ title, children, maxWidth = 430, pageId: pageIdProp }: StateSectionProps) {
  const contextPageId = useContext(PageIdContext);
  const pageId = pageIdProp || contextPageId;
  const page = pageId ? getPageById(pageId) : undefined;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (Platform.OS === 'web' && pageId) {
      navigator.clipboard.writeText(buildStateCopyText(pageId, title)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }, [pageId, title]);

  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{title}</Text>
        </View>
        {pageId && (
          <Pressable onPress={handleCopy} style={styles.copyBtn}>
            <Feather
              name={copied ? 'check' : 'copy'}
              size={14}
              color={copied ? '#16a34a' : Colors.textMuted}
            />
          </Pressable>
        )}
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
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
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
