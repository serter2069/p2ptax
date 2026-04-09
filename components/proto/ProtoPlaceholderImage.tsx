// Placeholder image component for proto pages
// Shows a colored rectangle with an icon indicating what type of image goes here
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius } from '../../constants/Colors';

type ImageType = 'avatar' | 'photo' | 'document' | 'illustration' | 'banner';

interface Props {
  type?: ImageType;
  width?: number | string;
  height?: number;
  label?: string;
  borderRadius?: number;
  iconSize?: number;
}

const ICON_MAP: Record<ImageType, keyof typeof Feather.glyphMap> = {
  avatar: 'user',
  photo: 'image',
  document: 'file-text',
  illustration: 'layout',
  banner: 'image',
};

const BG_MAP: Record<ImageType, string> = {
  avatar: '#E8F0FE',
  photo: '#F0F4F8',
  document: '#FEF3E2',
  illustration: '#E8F5E9',
  banner: '#F4F0FE',
};

const ICON_COLOR_MAP: Record<ImageType, string> = {
  avatar: '#5B8AC4',
  photo: '#7A8FA6',
  document: '#C49A4A',
  illustration: '#5DA06A',
  banner: '#8B7ABF',
};

export function ProtoPlaceholderImage({
  type = 'photo',
  width,
  height = 120,
  label,
  borderRadius: br,
  iconSize,
}: Props) {
  const isAvatar = type === 'avatar';
  const defaultWidth = isAvatar ? height : '100%';
  const finalWidth = width ?? defaultWidth;
  const finalRadius = br ?? (isAvatar ? 9999 : BorderRadius.lg);
  const finalIconSize = iconSize ?? (isAvatar ? Math.round(height * 0.4) : 28);

  return (
    <View
      style={[
        s.container,
        {
          width: finalWidth as any,
          height,
          borderRadius: finalRadius,
          backgroundColor: BG_MAP[type],
        },
      ]}
    >
      <Feather name={ICON_MAP[type]} size={finalIconSize} color={ICON_COLOR_MAP[type]} />
      {label ? <Text style={[s.label, { color: ICON_COLOR_MAP[type] }]}>{label}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
