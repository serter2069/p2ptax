import { useRef, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import { FileImage, File, X, Plus } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";

export interface AttachedFile {
  name: string;
  mimeType: string;
  size: number;
  uploadedUrl?: string;
  uploading?: boolean;
  error?: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface FileUploadSectionProps {
  files: AttachedFile[];
  disabled: boolean;
  onFilesChange: (files: AttachedFile[]) => void;
}

export default function FileUploadSection({
  files,
  disabled,
  onFilesChange,
}: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name;

    onFilesChange([
      ...files,
      { name: fileName, mimeType, size: file.size, uploading: true },
    ]);

    try {
      const token = await AsyncStorage.getItem("p2ptax_access_token");
      const formData = new FormData();
      formData.append("files", file);

      const uploadRes = await fetch(`${API_URL}/api/upload/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = (await uploadRes.json()) as { files: { url: string }[] };
      const uploadedUrl = uploadData.files[0]?.url;

      onFilesChange(
        files
          .concat([{ name: fileName, mimeType, size: file.size, uploading: true }])
          .map((f, i, arr) =>
            i === arr.length - 1 && f.name === fileName && f.uploading
              ? { ...f, uploading: false, uploadedUrl }
              : f
          )
      );
    } catch {
      onFilesChange(
        files
          .concat([{ name: fileName, mimeType, size: file.size, uploading: true }])
          .map((f, i, arr) =>
            i === arr.length - 1 && f.name === fileName && f.uploading
              ? { ...f, uploading: false, error: "Ошибка загрузки" }
              : f
          )
      );
    }
  }, [files, onFilesChange]);

  const handleAddFilePress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (files.length >= MAX_FILES || file.size > MAX_FILE_SIZE) {
      e.target.value = "";
      return;
    }
    void uploadFile(file);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <View className="mb-6">
      <Text className="text-sm font-medium text-text-base mb-1">Документы</Text>
      <Text className="text-xs text-text-mute mb-3">
        PDF, JPG, PNG — до 10 МБ каждый, не более 5 файлов
      </Text>

      {files.map((file, index) => (
        <View
          key={`file-${index}`}
          className="flex-row items-center bg-surface2 border border-border rounded-xl px-3 py-2.5 mb-2"
        >
          {file.mimeType === "application/pdf"
            ? <File size={18} color={file.error ? colors.error : colors.primary} />
            : <FileImage size={18} color={file.error ? colors.error : colors.primary} />
          }
          <View className="flex-1 mx-2">
            <Text className="text-sm text-text-base" numberOfLines={1}>
              {file.name}
            </Text>
            {file.uploading && (
              <Text className="text-xs text-text-mute">Загрузка...</Text>
            )}
            {file.error && (
              <Text className="text-xs text-danger">{file.error}</Text>
            )}
            {file.uploadedUrl && !file.uploading && (
              <Text className="text-xs text-success">Загружен</Text>
            )}
          </View>
          {file.uploading ? (
            <ActivityIndicator size="small" color={colors.placeholder} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Удалить файл"
              onPress={() => handleRemoveFile(index)}
              className="w-11 h-11 items-center justify-center"
            >
              <X size={14} color={colors.placeholder} />
            </Pressable>
          )}
        </View>
      ))}

      {files.length < MAX_FILES && !disabled && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Прикрепить файл"
          onPress={handleAddFilePress}
          className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl active:bg-surface2"
        >
          <Plus size={13} color={colors.accent} />
          <Text
            className="text-sm ml-2 font-medium"
            style={{ color: colors.warningInkStrong }}
          >
            + Прикрепить файл
          </Text>
        </Pressable>
      )}

      {Platform.OS === "web" && (
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}
    </View>
  );
}
