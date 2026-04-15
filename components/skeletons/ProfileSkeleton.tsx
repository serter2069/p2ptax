import React from 'react';
import { View } from 'react-native';
import { SkeletonAvatar, SkeletonBox, SkeletonText } from '../ui/Skeleton';

export function ProfileSkeleton() {
  return (
    <View style={{ padding: 16, gap: 20, alignItems: 'center' }}>
      {/* Avatar */}
      <SkeletonAvatar size={80} />

      {/* Name + subtitle */}
      <View style={{ alignItems: 'center', gap: 8, width: '100%' }}>
        <SkeletonBox height={20} width="45%" borderRadius={4} />
        <SkeletonBox height={14} width="30%" borderRadius={4} />
      </View>

      {/* Info block */}
      <View style={{ width: '100%', gap: 16 }}>
        <SkeletonText lines={2} lineHeight={16} />
        <SkeletonBox height={1} width="100%" borderRadius={0} />
        <SkeletonText lines={3} lineHeight={16} />
      </View>
    </View>
  );
}
