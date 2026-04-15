import React from 'react';
import { View } from 'react-native';
import { SkeletonBox, SkeletonAvatar } from '../ui/Skeleton';

function MessageBubble({ isOwn }: { isOwn: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 16,
      }}
    >
      {!isOwn && <SkeletonAvatar size={32} />}
      <SkeletonBox
        width={isOwn ? 180 : 220}
        height={isOwn ? 40 : 56}
        borderRadius={16}
      />
    </View>
  );
}

export function ChatSkeleton() {
  return (
    <View style={{ flex: 1, paddingVertical: 16, gap: 16 }}>
      <MessageBubble isOwn={false} />
      <MessageBubble isOwn={true} />
      <MessageBubble isOwn={false} />
      <MessageBubble isOwn={true} />
      <MessageBubble isOwn={false} />
    </View>
  );
}
