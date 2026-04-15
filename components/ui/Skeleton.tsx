import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

const PULSE_DURATION = 1200;

function usePulse() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: PULSE_DURATION / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}

// --- SkeletonBox ---

export interface SkeletonBoxProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonBoxProps) {
  const opacity = usePulse();

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: Colors.borderLight,
          opacity,
        },
        style,
      ]}
    />
  );
}

// --- SkeletonText ---

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
  style?: ViewStyle;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 14,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={[{ gap: 10 }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

// --- SkeletonAvatar ---

export interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonAvatar({ size = 48, style }: SkeletonAvatarProps) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

// --- SkeletonCard ---

export interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  style,
}: SkeletonCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.bgCard,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: Colors.borderLight,
          gap: 12,
        },
        style,
      ]}
    >
      {showAvatar && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonAvatar size={40} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox height={14} width="50%" borderRadius={4} />
            <SkeletonBox height={12} width="30%" borderRadius={4} />
          </View>
        </View>
      )}
      <SkeletonText lines={lines} />
    </View>
  );
}
