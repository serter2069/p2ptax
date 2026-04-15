import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, AvatarSize } from './Avatar';
import { Colors } from '../constants/Colors';
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
    <TouchableOpacity
      onPress={handlePick}
      disabled={uploading}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Avatar name={name} imageUri={uri} size={size} />
      {uploading ? (
        <View style={[styles.overlay, { width: containerSize, height: containerSize, borderRadius: containerSize / 2 }]}>
          <ActivityIndicator color="#fff" size="small" />
        </View>
      ) : (
        <View style={styles.badge}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
