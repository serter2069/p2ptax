import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/Colors';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?: string;
  imageUri?: string;
  size?: AvatarSize;
}

const SIZE_MAP: Record<AvatarSize, { container: number; font: number }> = {
  sm: { container: 32, font: 12 },
  md: { container: 44, font: 16 },
  lg: { container: 64, font: 22 },
  xl: { container: 80, font: 28 },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, imageUri, size = 'md' }: AvatarProps) {
  const dims = SIZE_MAP[size];

  const containerStyle = {
    width: dims.container,
    height: dims.container,
    borderRadius: dims.container / 2,
  };

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.base, containerStyle]}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';

  return (
    <View style={[styles.base, styles.fallback, containerStyle]}>
      <Text style={[styles.initials, { fontSize: dims.font }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: Colors.brandPrimary,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.bold,
  },
});
