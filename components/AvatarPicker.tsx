import React, { useState } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar, AvatarSize } from './Avatar';
import { pickImage, uploadAvatar } from '../lib/upload';
import { toast } from '../lib/toast';

interface AvatarPickerProps {
  currentUri?: string;
  name?: string;
  size?: AvatarSize;
  onUploaded?: (url: string) => void;
}

export function AvatarPicker({
  currentUri,
  name,
  size = 'xl',
  onUploaded,
}: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [uri, setUri] = useState(currentUri);

  const handlePick = async () => {
    if (uploading) return;

    const asset = await pickImage('gallery');
    if (!asset) return;

    setUploading(true);
    try {
      const result = await uploadAvatar(asset);
      setUri(result.url);
      onUploaded?.(result.url);
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const containerSize = size === 'xl' ? 80 : size === 'lg' ? 64 : size === 'md' ? 44 : 32;

  return (
    <Pressable
      onPress={handlePick}
      disabled={uploading}
      className="relative self-center"
    >
      <Avatar name={name} imageUri={uri} size={size} />
      {uploading ? (
        <View
          className="absolute top-0 left-0 bg-black/40 items-center justify-center"
          style={{ width: containerSize, height: containerSize, borderRadius: containerSize / 2 }}
        >
          <ActivityIndicator color="#fff" size="small" />
        </View>
      ) : (
        <View className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full bg-brandPrimary items-center justify-center border-2 border-white">
          <Feather name="camera" size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}
