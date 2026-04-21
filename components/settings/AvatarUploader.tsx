import { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/lib/api";
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

  const uploadAvatar = async (file: File) => {
    onUploadStart();
    try {
      const token = await AsyncStorage.getItem("p2ptax_access_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/upload/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || "Не удалось загрузить фото");
      }

      const resData = (await res.json()) as { url: string };
      const fullUrl = resData.url.startsWith("http")
        ? resData.url
        : `${API_URL}${resData.url}`;
      onAvatarChange(fullUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки фото";
      Alert.alert("Ошибка", msg);
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
            className="rounded-full bg-slate-100 items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : avatarUrl ? (
          <View>
            <Image
              source={{ uri: avatarUrl }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 2,
                borderColor: colors.border,
              }}
            />
            <View
              className="absolute bottom-0 right-0 bg-blue-900 rounded-full items-center justify-center"
              style={{ width: 24, height: 24 }}
            >
              <FontAwesome name="pencil" size={12} color={colors.surface} />
            </View>
          </View>
        ) : (
          <View
            className="rounded-full bg-blue-900 items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <Text className="text-white text-2xl font-bold">
              {initials || "?"}
            </Text>
          </View>
        )}
        <Text className="text-xs text-slate-400 mt-2">
          {avatarUrl ? "Изменить фото" : "Нажмите, чтобы добавить фото"}
        </Text>
      </Pressable>
      <View className="mt-2 bg-blue-50 px-3 py-1 rounded-full">
        <Text className="text-xs font-medium text-blue-900">Специалист</Text>
      </View>

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
