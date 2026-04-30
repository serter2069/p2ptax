import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from "react-native";
import { Pencil } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  ApiError,
  AVATAR_MAX_BYTES,
  AVATAR_TOO_LARGE_TITLE,
  AVATAR_TOO_LARGE_MESSAGE,
  avatarUploadErrorMessage,
  uploadAvatarFile,
  uploadAvatarNative,
} from "@/lib/api";
import { colors } from "@/lib/theme";

interface AvatarUploaderProps {
  avatarUrl: string | null;
  avatarUploading: boolean;
  /**
   * Full display name (e.g. "Сергей Терещенко") used to derive initials
   * when no avatarUrl is set. Cyrillic-safe — uses plain `.toUpperCase()`,
   * never `toLocaleUpperCase('en')` (which would strip Cyrillic).
   *
   * Pattern mirrors components/ui/Avatar.tsx (Wave 3).
   */
  name?: string;
  /** Fallback identifier (typically email) when name is empty. */
  fallback?: string;
  /**
   * Called after successful upload with:
   *   url  — 7-day presigned URL for immediate display in <Image>
   *   key  — storage key (e.g. "avatars/uuid.jpg") that must be saved in the DB
   */
  onAvatarChange: (url: string, key: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}

/**
 * Cyrillic-safe initials extractor — IMPORTANT: use plain `.toUpperCase()`
 * (locale-agnostic). Never use `toLocaleUpperCase('en')` here — it would
 * strip Cyrillic ("С" → "C") and break Russian-language fallbacks.
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AvatarUploader({
  avatarUrl,
  avatarUploading,
  name,
  fallback,
  onAvatarChange,
  onUploadStart,
  onUploadEnd,
}: AvatarUploaderProps) {
  const trimmedName = (name ?? "").trim();
  const initials =
    getInitials(trimmedName) ||
    (fallback ? fallback.charAt(0).toUpperCase() : "") ||
    "?";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Wave 6 polish — fall back to initials when avatarUrl 404s (MinIO rotation,
  // deleted file, broken CDN). Without this, a stale URL renders a blank
  // circle with just the edit-pencil overlay. Reset on every avatarUrl change
  // so a successful re-upload is rendered immediately.
  const [hasImageError, setHasImageError] = useState(false);
  useEffect(() => {
    setHasImageError(false);
  }, [avatarUrl]);

  const uploadAvatar = async (file: File) => {
    // Pre-check size before any network call
    if (file.size > AVATAR_MAX_BYTES) {
      Alert.alert(AVATAR_TOO_LARGE_TITLE, AVATAR_TOO_LARGE_MESSAGE);
      return;
    }

    setErrorMessage(null);
    onUploadStart();
    try {
      const { url, key } = await uploadAvatarFile(file);
      onAvatarChange(url, key);
      setLastFile(null);
    } catch (e: unknown) {
      const status = e instanceof ApiError ? e.status : -1;
      const msg =
        e instanceof ApiError ? e.message : avatarUploadErrorMessage(-1);
      // Keep file for retry, but for 413 the file itself is the problem — don't offer retry.
      if (status === 413) {
        Alert.alert(AVATAR_TOO_LARGE_TITLE, AVATAR_TOO_LARGE_MESSAGE);
        setLastFile(null);
      } else {
        setLastFile(file);
        setErrorMessage(msg);
      }
    } finally {
      onUploadEnd();
    }
  };

  const handleAvatarPress = async () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click();
      return;
    }
    // Native: use expo-document-picker to pick an image from gallery/files
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const fileSize = asset.size ?? 0;
      if (fileSize > AVATAR_MAX_BYTES) {
        Alert.alert(AVATAR_TOO_LARGE_TITLE, AVATAR_TOO_LARGE_MESSAGE);
        return;
      }
      setErrorMessage(null);
      onUploadStart();
      try {
        const fullUrl = await uploadAvatarNative(
          asset.uri,
          asset.name,
          asset.mimeType ?? "image/jpeg",
          fileSize,
        );
        onAvatarChange(fullUrl);
      } catch (e: unknown) {
        const status = e instanceof ApiError ? e.status : -1;
        const msg =
          e instanceof ApiError ? e.message : avatarUploadErrorMessage(-1);
        if (status === 413) {
          Alert.alert(AVATAR_TOO_LARGE_TITLE, AVATAR_TOO_LARGE_MESSAGE);
        } else {
          setErrorMessage(msg);
        }
      } finally {
        onUploadEnd();
      }
    } catch {
      // picker cancelled or unavailable
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAvatar(file);
      e.target.value = "";
    }
  };

  const handleRetry = () => {
    if (lastFile) {
      void uploadAvatar(lastFile);
    }
  };

  return (
    <View className="items-center mb-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Фото профиля"
        onPress={handleAvatarPress}
        className="items-center"
      >
        {avatarUploading ? (
          <View
            className="rounded-full bg-surface2 items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : avatarUrl && !hasImageError ? (
          <View>
            <Image
              source={{ uri: avatarUrl }}
              accessibilityLabel="Profile photo"
              onError={() => setHasImageError(true)}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 2,
                borderColor: colors.border,
              }}
            />
            <View
              className="absolute bottom-0 right-0 bg-accent rounded-full items-center justify-center"
              style={{ width: 24, height: 24 }}
            >
              <Pencil size={12} color={colors.surface} />
            </View>
          </View>
        ) : (
          <View
            className="rounded-full bg-accent items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <Text className="text-white text-2xl font-bold">
              {initials}
            </Text>
          </View>
        )}
        <Text className="text-xs text-text-mute mt-2">
          {avatarUrl ? "Изменить фото" : "Нажмите, чтобы добавить фото"}
        </Text>
      </Pressable>

      {errorMessage ? (
        <View className="mt-3 items-center">
          <Text className="text-xs text-red-600 mb-2 text-center">
            {errorMessage}
          </Text>
          {lastFile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Повторить загрузку аватара"
              onPress={handleRetry}
              disabled={avatarUploading}
              className="px-4 py-2 rounded-full bg-blue-900"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text className="text-xs font-medium text-white">Повторить</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {Platform.OS === "web" && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}
    </View>
  );
}
