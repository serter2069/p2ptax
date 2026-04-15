import React from 'react';
import { View } from 'react-native';
import { SkeletonBox, SkeletonCard } from '../ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      {/* Stat cards row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E0F2FE',
              gap: 8,
            }}
          >
            <SkeletonBox height={12} width="60%" borderRadius={4} />
            <SkeletonBox height={28} width="40%" borderRadius={4} />
          </View>
        ))}
      </View>

      {/* List items */}
      <SkeletonCard showAvatar lines={2} />
      <SkeletonCard showAvatar lines={2} />
    </View>
  );
}
