import React from 'react';
import { View, Text, Image } from 'react-native';

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
        className="overflow-hidden items-center justify-center"
        style={containerStyle}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';

  return (
    <View
      className="overflow-hidden items-center justify-center bg-brandPrimary"
      style={containerStyle}
    >
      <Text className="text-white font-bold" style={{ fontSize: dims.font }}>
        {initials}
      </Text>
    </View>
  );
}
