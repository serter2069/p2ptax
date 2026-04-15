import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/Colors';
import { pickImage, pickDocument, uploadChatAttachment, UploadResult } from '../lib/upload';
import { toast } from '../lib/toast';

interface FileAttachmentProps {
  threadId: string;
  onFileUploaded: (result: UploadResult) => void;
}

export function FileAttachment({ threadId, onFileUploaded }: FileAttachmentProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handlePickImage = async () => {
    if (uploading) return;
    const asset = await pickImage('gallery');
    if (!asset) return;

    setPreview(asset.uri);
    setUploading(true);
    try {
      const result = await uploadChatAttachment(threadId, asset);
      onFileUploaded(result);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setPreview(null);
    }
  };

  const handlePickDocument = async () => {
    if (uploading) return;
    const asset = await pickDocument();
    if (!asset) return;

    // Show preview for images from document picker
    if (asset.mimeType?.startsWith('image/')) {
      setPreview(asset.uri);
    }

    setUploading(true);
    try {
      const result = await uploadChatAttachment(threadId, asset);
      onFileUploaded(result);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setPreview(null);
    }
  };

  return (
    <View style={styles.container}>
      {preview && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: preview }} style={styles.preview} />
          {uploading && (
            <View style={styles.previewOverlay}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          )}
        </View>
      )}

      {uploading && !preview && (
        <View style={styles.uploadingBadge}>
          <ActivityIndicator color={Colors.brandPrimary} size="small" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={uploading}
          style={styles.btn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="image-outline"
            size={22}
            color={uploading ? Colors.textMuted : Colors.brandPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePickDocument}
          disabled={uploading}
          style={styles.btn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="document-attach-outline"
            size={22}
            color={uploading ? Colors.textMuted : Colors.brandPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  btn: {
    padding: Spacing.sm,
  },
  previewContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  preview: {
    width: 48,
    height: 48,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  uploadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});
