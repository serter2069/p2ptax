import React from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/Colors';

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingAlign = 'left' | 'center' | 'right';

export interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  align?: HeadingAlign;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const LEVEL_SIZE: Record<HeadingLevel, number> = {
  1: Typography.fontSize.display,
  2: Typography.fontSize['2xl'],
  3: Typography.fontSize.xl,
  4: Typography.fontSize.lg,
};

const LEVEL_WEIGHT: Record<HeadingLevel, { w: TextStyle['fontWeight']; family: string }> = {
  1: { w: Typography.fontWeight.bold, family: Typography.fontFamily.bold },
  2: { w: Typography.fontWeight.semibold, family: Typography.fontFamily.semibold },
  3: { w: Typography.fontWeight.semibold, family: Typography.fontFamily.semibold },
  4: { w: Typography.fontWeight.semibold, family: Typography.fontFamily.semibold },
};

export function Heading({ level, children, align = 'left', style, numberOfLines }: HeadingProps) {
  const { w, family } = LEVEL_WEIGHT[level];
  return (
    <RNText
      numberOfLines={numberOfLines}
      accessibilityRole="header"
      style={[
        {
          color: Colors.textPrimary,
          fontSize: LEVEL_SIZE[level],
          fontWeight: w,
          fontFamily: family,
          textAlign: align,
          lineHeight: Math.round(LEVEL_SIZE[level] * Typography.lineHeight.tight),
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
