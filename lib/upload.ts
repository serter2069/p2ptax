import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { client } from './api/client';

export interface UploadResult {
  url: string;
  signedUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Image picker (camera / gallery)
// ---------------------------------------------------------------------------
export async function pickImage(
  source: 'camera' | 'gallery' = 'gallery',
): Promise<ImagePicker.ImagePickerAsset | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }

  const launcher =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

// ---------------------------------------------------------------------------
// Document picker
// ---------------------------------------------------------------------------
export async function pickDocument(): Promise<DocumentPicker.DocumentPickerAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/*',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

// ---------------------------------------------------------------------------
// Upload avatar (POST /users/me/avatar)
// ---------------------------------------------------------------------------
export async function uploadAvatar(
  asset: ImagePicker.ImagePickerAsset,
): Promise<UploadResult> {
  const formData = new FormData();

  const uri = asset.uri;
  const filename = uri.split('/').pop() || 'avatar.jpg';
  const mimeType = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then((r) => r.blob());
    formData.append('file', blob, filename);
  } else {
    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
  }

  const res = await client.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return {
    url: res.data.avatarUrl,
    filename,
    size: asset.fileSize || 0,
    mimeType,
  };
}

// ---------------------------------------------------------------------------
// Upload chat attachment (POST /threads/:threadId/upload)
// ---------------------------------------------------------------------------
export async function uploadChatAttachment(
  threadId: string,
  asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
): Promise<UploadResult> {
  const formData = new FormData();

  const uri = asset.uri;
  const filename =
    'fileName' in asset
      ? (asset.fileName ?? uri.split('/').pop() ?? 'file')
      : (uri.split('/').pop() ?? 'file');
  const mimeType =
    asset.mimeType || 'application/octet-stream';
  const size = 'fileSize' in asset ? (asset.fileSize ?? 0) : ('size' in asset ? (asset.size ?? 0) : 0);

  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then((r) => r.blob());
    formData.append('file', blob, filename);
  } else {
    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
  }

  const res = await client.post(`/threads/${threadId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return {
    url: res.data.url,
    signedUrl: res.data.signedUrl,
    filename: res.data.name || filename,
    size,
    mimeType,
  };
}
