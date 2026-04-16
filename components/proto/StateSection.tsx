import React, { createContext, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { getPageById } from '../../constants/pageRegistry';
import { ProtoNavHeader, ProtoNavFooter } from './ProtoNav';

// Context so all StateSections get pageId without prop drilling
const PageIdContext = createContext<string>('');
export const PageIdProvider = PageIdContext.Provider;

// Context for filtering which state to render
interface StateFilterContextValue {
  filter: string | undefined;
  /** Tracks whether any section has rendered yet (for "first only" mode) */
  claimFirst: () => boolean;
}
const StateFilterContext = createContext<StateFilterContextValue>({
  filter: undefined,
  claimFirst: () => true,
});
export const StateFilterProvider = StateFilterContext.Provider;

interface StateSectionProps {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
  pageId?: string;
}

export function StateSection({ title, children, maxWidth = 960, pageId: pageIdProp }: StateSectionProps) {
  const contextPageId = useContext(PageIdContext);
  const { filter, claimFirst } = useContext(StateFilterContext);
  const pageId = pageIdProp || contextPageId;
  const page = pageId ? getPageById(pageId) : undefined;
  const ref = useRef<View>(null);

  const windowHeight = Dimensions.get('window').height;
  const minHeight = Math.max(844, windowHeight);

  // Determine visibility
  const isMatch = filter
    ? title.toUpperCase() === filter.toUpperCase()
    : claimFirst(); // no filter → only first section renders

  useEffect(() => {
    if (Platform.OS === 'web' && ref.current) {
      // Set data attribute directly on DOM element for text/screenshot API
      (ref.current as unknown as HTMLElement).setAttribute('data-state-name', title);
    }
  }, [title]);

  if (!isMatch) return null;

  // Single-state mode: render without wrapper (no label, no phone frame)
  // Nav is handled by ProtoLayout — not duplicated here
  if (filter) {
    return (
      <View ref={ref} style={styles.singleState}>
        <View style={styles.phoneBody}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View ref={ref} style={styles.section}>
      <View style={styles.labelRow}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{title}</Text>
        </View>
        <View style={styles.line} />
      </View>
      <View style={[styles.content, { maxWidth }]}>
        <View style={[styles.phone, { minHeight }]}>
          <View style={styles.phoneBody}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
    marginBottom: 80,
  },
  singleState: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
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
  },
  phoneBody: {
    flex: 1,
  },
});
