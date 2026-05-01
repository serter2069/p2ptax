import { useRef, useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import { FileImage, File, X, Upload } from "lucide-react-native";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";

export interface AttachedFile {
  name: string;
  mimeType: string;
  size: number;
  /** DB File record id returned by /api/upload/documents. */
  uploadedId?: string;
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
  /** Bearer token for authenticated upload. */
  authToken?: string | null;
}

export default function FileUploadSection({
  files,
  disabled,
  onFilesChange,
  authToken,
}: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Keep a mutable ref so upload callbacks always see the latest list.
  const filesRef = useRef(files);
  filesRef.current = files;
  const [hover, setHover] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name;

    // Add the file as uploading immediately.
    const withUploading: AttachedFile[] = [
      ...filesRef.current,
      { name: fileName, mimeType, size: file.size, uploading: true },
    ];
    onFilesChange(withUploading);
    filesRef.current = withUploading;

    try {
      const formData = new FormData();
      formData.append("files", file);

      const uploadRes = await fetch(`${API_URL}/api/upload/documents`, {
        method: "POST",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = (await uploadRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          uploadRes.status === 413
            ? "Файл больше 10 МБ"
            : uploadRes.status === 415
            ? "Неподдерживаемый формат"
            : uploadRes.status === 401
            ? "Необходима авторизация"
            : errData.error ?? "Ошибка загрузки файла"
        );
      }

      const uploadData = (await uploadRes.json()) as {
        files: { id?: string; url: string }[];
      };
      const uploaded = uploadData.files[0];

      // Patch the uploading entry in the latest list (use filesRef, not stale closure).
      const next = filesRef.current.map((f) =>
        f.name === fileName && f.uploading
          ? { ...f, uploading: false, uploadedId: uploaded?.id, uploadedUrl: uploaded?.url }
          : f
      );
      onFilesChange(next);
      filesRef.current = next;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка загрузки файла";
      const next = filesRef.current.map((f) =>
        f.name === fileName && f.uploading
          ? { ...f, uploading: false, error: msg }
          : f
      );
      onFilesChange(next);
      filesRef.current = next;
    }
  }, [authToken, onFilesChange]);

  const handleAddFilePress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (filesRef.current.length >= MAX_FILES || file.size > MAX_FILE_SIZE) return;
      void uploadFile(file);
    });
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    const dropped = Array.from(e.dataTransfer.files as FileList);
    dropped.forEach((file) => {
      if (filesRef.current.length >= MAX_FILES || file.size > MAX_FILE_SIZE) return;
      void uploadFile(file);
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (!disabled) setHover(true);
  };

  const handleDragLeave = () => setHover(false);

  const handleRemoveFile = (index: number) => {
    const next = filesRef.current.filter((_, i) => i !== index);
    onFilesChange(next);
    filesRef.current = next;
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-text-base mb-2">Документы</Text>

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
              <Text className="text-xs text-text-mute">Загрузка…</Text>
            )}
            {file.error && (
              <Text className="text-xs text-danger">{file.error}</Text>
            )}
            {file.uploadedUrl && !file.uploading && !file.error && (
              <Text className="text-xs text-text-mute">Загружен</Text>
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

      {files.length < MAX_FILES && !disabled && Platform.OS === "web" && (
        <View
          {...({
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
          } as object)}
          style={{
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: hover ? colors.accent : colors.border,
            borderRadius: 12,
            backgroundColor: hover ? "#eff6ff" : colors.surface2 ?? "#f8f9fb",
            padding: 24,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            cursor: "pointer",
          } as object}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Прикрепить файлы"
            onPress={handleAddFilePress}
            style={{ alignItems: "center" }}
          >
            <Upload size={32} color={hover ? colors.accent : colors.placeholder} />
            <Text
              className="text-sm font-medium mt-2"
              style={{ color: hover ? colors.accent : colors.text }}
            >
              Перетащите файлы или нажмите для выбора
            </Text>
            <Text className="text-xs text-text-mute mt-1">
              PDF, JPG, PNG — до 10 МБ каждый, не более 5 файлов
            </Text>
          </Pressable>
        </View>
      )}

      {files.length < MAX_FILES && !disabled && Platform.OS !== "web" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Прикрепить файл"
          onPress={handleAddFilePress}
          className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl active:bg-surface2"
          style={{ minHeight: 48 }}
        >
          <Upload size={16} color={colors.primary} />
          <Text className="text-sm ml-2 font-medium text-primary">
            Прикрепить файл
          </Text>
        </Pressable>
      )}

      {Platform.OS === "web" && (
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}
    </View>
  );
}
