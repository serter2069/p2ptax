import { useRef, useCallback, useEffect, useState } from "react";
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
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface FileUploadSectionProps {
  files: AttachedFile[];
  disabled: boolean;
  onFilesChange: (files: AttachedFile[]) => void;
  /** Bearer token for authenticated upload. */
  authToken?: string | null;
  /**
   * Anonymous-session id. When provided AND `authToken` is empty, uploads
   * route through /api/upload/anon-documents and the file rows get a
   * 24-hour TTL on the server. When the visitor later submits the request
   * via OTP, the same sessionId is sent in `pendingFileSessionId` to claim
   * the files and clear the TTL.
   */
  anonSessionId?: string | null;
}

export default function FileUploadSection({
  files,
  disabled,
  onFilesChange,
  authToken,
  anonSessionId,
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

      // Anonymous path requires sessionId in the multipart body and skips
      // the Authorization header. Authenticated path keeps the original
      // /api/upload/documents endpoint.
      const isAnon = !authToken && !!anonSessionId;
      if (isAnon) formData.append("sessionId", anonSessionId!);
      const endpoint = isAnon ? "/api/upload/anon-documents" : "/api/upload/documents";

      const uploadRes = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = (await uploadRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          uploadRes.status === 413
            ? "Файл больше 100 МБ"
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
  }, [authToken, anonSessionId, onFilesChange]);

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

  // Drag-and-drop: RN-Web's <View> strips React's onDragOver/onDrop
  // synthetic-event props, so the drop zone never received native dragover
  // events. Wire DOM listeners ourselves once the host node mounts —
  // mirrors the pattern used in components/ui/FileUploadZone.tsx that
  // works fine in the chat composer.
  const dropZoneRef = useRef<HTMLElement | null>(null);
  const setDropZoneNode = useCallback((node: unknown) => {
    dropZoneRef.current = (node as HTMLElement | null) ?? null;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = dropZoneRef.current;
    if (!node || typeof node.addEventListener !== "function") return;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (!disabled) setHover(true);
    };
    const onDragOver = (e: DragEvent) => {
      // preventDefault on dragover is what tells the browser this is a
      // valid drop target — without it the browser refuses the drop.
      e.preventDefault();
      if (!disabled) setHover(true);
    };
    const onDragLeave = () => setHover(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setHover(false);
      if (disabled) return;
      const fl = e.dataTransfer?.files;
      if (!fl) return;
      Array.from(fl).forEach((file) => {
        if (filesRef.current.length >= MAX_FILES || file.size > MAX_FILE_SIZE) return;
        void uploadFile(file);
      });
    };

    node.addEventListener("dragenter", onDragEnter);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDrop);
    return () => {
      node.removeEventListener("dragenter", onDragEnter);
      node.removeEventListener("dragover", onDragOver);
      node.removeEventListener("dragleave", onDragLeave);
      node.removeEventListener("drop", onDrop);
    };
  }, [disabled, uploadFile]);

  const handleRemoveFile = (index: number) => {
    const next = filesRef.current.filter((_, i) => i !== index);
    onFilesChange(next);
    filesRef.current = next;
  };

  return (
    <View className="mb-4">
      {/* The 'Документы' header lives in the parent (Создать запрос
          renders it with hint copy). Other call-sites still show their
          own label above this component — keep the bare structure. */}
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
          ref={setDropZoneNode as never}
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
              PDF, JPG, PNG, DOC, DOCX — до 100 МБ каждый, не более 5 файлов
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
          accept="application/pdf,image/jpeg,image/png,image/webp,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,text/plain,text/csv,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar,application/x-7z-compressed"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}
    </View>
  );
}
