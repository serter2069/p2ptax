import React from 'react';
import { View } from 'react-native';
import { SkeletonCard } from '../ui/Skeleton';

export function RequestListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} showAvatar lines={2} />
      ))}
    </View>
  );
}
