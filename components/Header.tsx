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

export interface BreadcrumbItem {
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

  const titleStyle = isMobile ? styles.titleCentered : styles.titleLeft;

  return (
    <View style={styles.container}>
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
      ) : (
        // Desktop/tablet: back (if needed) | left-aligned title | right spacer + action
        <>
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Text style={styles.backIcon}>{'←'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.titleArea}>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <View style={styles.breadcrumbRow}>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 ? (
                      <Text style={styles.breadcrumbSep}>{' / '}</Text>
                    ) : null}
                    {crumb.route ? (
                      <TouchableOpacity onPress={() => router.push(crumb.route as any)} activeOpacity={0.7}>
                        <Text style={styles.breadcrumbLink}>{crumb.label}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.breadcrumbCurrent}>{crumb.label}</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : null}
            <Text style={titleStyle} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={styles.rightWide}>
            {rightAction ?? null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
  },
  titleArea: {
    flex: 1,
  },
  titleCentered: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  titleLeft: {
    textAlign: 'left',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: Spacing.sm,
  },
  breadcrumbLink: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.medium,
  },
  breadcrumbSep: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  breadcrumbCurrent: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  rightWide: {
    marginLeft: 'auto' as any,
    alignItems: 'flex-end',
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
});
