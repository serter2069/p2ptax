import { useRef, useState } from "react";
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
import {
  ApiError,
  AVATAR_MAX_BYTES,
  AVATAR_TOO_LARGE_TITLE,
  AVATAR_TOO_LARGE_MESSAGE,
  avatarUploadErrorMessage,
  uploadAvatarFile,
} from "@/lib/api";
import { colors } from "@/lib/theme";

interface AvatarUploaderProps {
  avatarUrl: string | null;
  avatarUploading: boolean;
  initials: string;
  onAvatarChange: (url: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}

export default function AvatarUploader({
  avatarUrl,
  avatarUploading,
  initials,
  onAvatarChange,
  onUploadStart,
  onUploadEnd,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadAvatar = async (file: File) => {
    // Pre-check size before any network call
    if (file.size > AVATAR_MAX_BYTES) {
      Alert.alert(AVATAR_TOO_LARGE_TITLE, AVATAR_TOO_LARGE_MESSAGE);
      return;
    }

    setErrorMessage(null);
    onUploadStart();
    try {
      const fullUrl = await uploadAvatarFile(file);
      onAvatarChange(fullUrl);
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

  const handleAvatarPress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
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
        ) : avatarUrl ? (
          <View>
            <Image
              source={{ uri: avatarUrl }}
              accessibilityLabel="Profile photo"
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
              {initials || "?"}
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
