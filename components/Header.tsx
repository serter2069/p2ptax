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

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
}

export function Header({ title, showBack = false, rightAction, onBackPress }: HeaderProps) {
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

          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>

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
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
});
