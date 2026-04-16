import React from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/Colors';

export type TextVariant = 'body' | 'muted' | 'caption' | 'label';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextAlign = 'left' | 'center' | 'right';

export interface TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  align?: TextAlign;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
}

function variantStyle(variant: TextVariant): TextStyle {
  switch (variant) {
    case 'body':
      return { fontSize: Typography.fontSize.base, color: Colors.textPrimary };
    case 'muted':
      return { fontSize: Typography.fontSize.base, color: Colors.textSecondary };
    case 'caption':
      return { fontSize: Typography.fontSize.sm, color: Colors.textSecondary };
    case 'label':
      return {
        fontSize: Typography.fontSize.sm,
        color: Colors.textPrimary,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
      };
  }
}

function weightStyle(weight: TextWeight): TextStyle {
  return {
    fontWeight: Typography.fontWeight[weight],
    fontFamily: Typography.fontFamily[weight],
  };
}

export function Text({
  variant = 'body',
  weight,
  align,
  children,
  style,
  numberOfLines,
  selectable,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        variantStyle(variant),
        weight ? weightStyle(weight) : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
