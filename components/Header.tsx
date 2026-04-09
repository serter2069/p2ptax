import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../constants/Colors';
import { useBreakpoints } from '../hooks/useBreakpoints';

interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
  breadcrumbs?: BreadcrumbItem[];
}

export function Header({ title, showBack = false, rightAction, onBackPress, breadcrumbs }: HeaderProps) {
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // On desktop/tablet, align title left (sidebar handles branding)
  // On mobile, keep centered layout
  const titleStyle = isMobile ? styles.titleCentered : styles.titleLeft;

  return (
    <View style={styles.container}>
      {/* Breadcrumbs row (desktop only, if provided) */}
      {breadcrumbs && breadcrumbs.length > 0 && !isMobile ? (
        <View style={styles.breadcrumbsRow}>
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Text style={styles.backIcon}>{'←'}</Text>
            </TouchableOpacity>
          )}
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 ? (
                  <Text style={styles.breadcrumbSeparator}>/</Text>
                ) : null}
                {isLast || !crumb.route ? (
                  <Text style={styles.breadcrumbCurrent}>{crumb.label}</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push(crumb.route as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.breadcrumbLink}>{crumb.label}</Text>
                  </TouchableOpacity>
                )}
              </React.Fragment>
            );
          })}
          <View style={styles.rightWide}>
            {rightAction ?? null}
          </View>
        </View>
      ) : null}

      {/* Title row */}
      {isMobile ? (
        // Mobile: left spacer | centered title | right action
        <>
          <View style={styles.left}>
            {showBack && (
              <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top:12,bottom:12,left:12,right:12}}>
                <Text style={styles.backIcon}>{'←'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.right}>
            {rightAction ?? null}
          </View>
        </>
      ) : !breadcrumbs || breadcrumbs.length === 0 ? (
        // Desktop/tablet without breadcrumbs: back (if needed) | left-aligned title | right spacer + action
        <>
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Text style={styles.backIcon}>{'←'}</Text>
            </TouchableOpacity>
          )}

          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.rightWide}>
            {rightAction ?? null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  // Mobile layout pieces
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
  },
  // Wide layout: pushes actions to the far right
  rightWide: {
    marginLeft: 'auto' as any,
    alignItems: 'flex-end',
  },
  // Breadcrumbs
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
    gap: Spacing.xs,
  },
  breadcrumbSeparator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginHorizontal: 2,
  },
  breadcrumbLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  breadcrumbCurrent: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Title variants
  titleCentered: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  titleLeft: {
    flex: 1,
    textAlign: 'left',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
});
