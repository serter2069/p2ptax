import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UploadCloud, File as FileIcon, FileImage, X, Paperclip } from "lucide-react-native";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";

export interface AttachedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedId?: string;
  uploadedUrl?: string;
  uploadedKey?: string;
  uploading?: boolean;
  error?: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIMES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPT_ATTR = "application/pdf,image/jpeg,image/png";

interface FileDropZoneProps {
  files: AttachedFile[];
  disabled?: boolean;
  onFilesChange: (files: AttachedFile[]) => void;
}

interface FileLikePayload {
  // Browser File object on web; { uri, name, size, type } shape on native picker.
  raw: globalThis.File | { uri: string; name: string; size: number; mimeType: string };
  name: string;
  size: number;
  mimeType: string;
  uri: string;
}

/**
 * FileDropZone — multi-file attachment control.
 *
 * Mobile (<640px): "Прикрепить документ" button + chips with remove.
 * Desktop (>=640px): dashed drag-and-drop zone, click to open file picker, chips.
 *
 * Limits: max 5 files, max 10MB each, types: PDF/JPG/PNG.
 */
export default function FileDropZone({
  files,
  disabled = false,
  onFilesChange,
}: FileDropZoneProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640 && Platform.OS === "web";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const filesRef = useRef(files);
  filesRef.current = files;

  const uploadOne = useCallback(
    async (payload: FileLikePayload) => {
      // Append placeholder
      const placeholder: AttachedFile = {
        uri: payload.uri,
        name: payload.name,
        size: payload.size,
        mimeType: payload.mimeType,
        uploading: true,
      };
      const start = [...filesRef.current, placeholder];
      onFilesChange(start);
      filesRef.current = start;

      try {
        const token = await AsyncStorage.getItem("p2ptax_access_token");
        const formData = new FormData();
        if (Platform.OS === "web") {
          formData.append("files", payload.raw as Blob);
        } else {
          // React Native: append using uri shape that fetch understands.
          formData.append("files", {
            uri: payload.uri,
            name: payload.name,
            type: payload.mimeType,
          } as unknown as Blob);
        }

        const res = await fetch(`${API_URL}/api/upload/documents`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok) {
          throw new Error(res.status === 413 ? "Файл слишком большой" : "Ошибка загрузки");
        }

        const data = (await res.json()) as {
          files: { id?: string; url: string; key: string; filename: string; size: number; mimeType: string }[];
        };
        const uploaded = data.files[0];

        const next = filesRef.current.map((f) =>
          f.uri === payload.uri && f.uploading
            ? {
                ...f,
                uploading: false,
                uploadedId: uploaded?.id,
                uploadedUrl: uploaded?.url,
                uploadedKey: uploaded?.key,
              }
            : f
        );
        onFilesChange(next);
        filesRef.current = next;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки";
        const next = filesRef.current.map((f) =>
          f.uri === payload.uri && f.uploading ? { ...f, uploading: false, error: msg } : f
        );
        onFilesChange(next);
        filesRef.current = next;
      }
    },
    [onFilesChange]
  );

  const validateAndQueue = useCallback(
    (incoming: FileLikePayload[]) => {
      setGlobalError(null);
      const current = filesRef.current;
      const remainingSlots = MAX_FILES - current.length;
      if (remainingSlots <= 0) {
        setGlobalError(`Можно прикрепить максимум ${MAX_FILES} файлов`);
        return;
      }
      const accepted: FileLikePayload[] = [];
      for (const f of incoming) {
        if (accepted.length >= remainingSlots) {
          setGlobalError(`Можно прикрепить максимум ${MAX_FILES} файлов`);
          break;
        }
        if (f.size > MAX_FILE_SIZE) {
          setGlobalError(`Файл "${f.name}" больше 10 МБ`);
          continue;
        }
        if (f.mimeType && !ACCEPTED_MIMES.includes(f.mimeType)) {
          setGlobalError(`"${f.name}" — неподдерживаемый формат (PDF, JPG, PNG)`);
          continue;
        }
        accepted.push(f);
      }
      for (const a of accepted) {
        void uploadOne(a);
      }
    },
    [uploadOne]
  );

  // Web: open native picker
  const openWebPicker = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Web: <input type=file> change
  const onWebInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list || list.length === 0) return;
      const incoming: FileLikePayload[] = Array.from(list).map((f) => ({
        raw: f,
        name: f.name,
        size: f.size,
        mimeType: f.type || "application/octet-stream",
        uri: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      }));
      validateAndQueue(incoming);
      e.target.value = "";
    },
    [validateAndQueue]
  );

  // Web: drag handlers
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  }, [disabled]);
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  }, [disabled]);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      const list = e.dataTransfer?.files;
      if (!list || list.length === 0) return;
      const incoming: FileLikePayload[] = Array.from(list).map((f) => ({
        raw: f,
        name: f.name,
        size: f.size,
        mimeType: f.type || "application/octet-stream",
        uri: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      }));
      validateAndQueue(incoming);
    },
    [disabled, validateAndQueue]
  );

  // Native: open expo-document-picker
  const openNativePicker = useCallback(async () => {
    if (disabled) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_MIMES,
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const incoming: FileLikePayload[] = res.assets.map((a) => ({
        raw: {
          uri: a.uri,
          name: a.name,
          size: a.size ?? 0,
          mimeType: a.mimeType ?? "application/octet-stream",
        },
        name: a.name,
        size: a.size ?? 0,
        mimeType: a.mimeType ?? "application/octet-stream",
        uri: a.uri,
      }));
      validateAndQueue(incoming);
    } catch {
      setGlobalError("Не удалось выбрать файл");
    }
  }, [disabled, validateAndQueue]);

  const handleRemove = useCallback(
    (idx: number) => {
      const next = filesRef.current.filter((_, i) => i !== idx);
      onFilesChange(next);
      filesRef.current = next;
    },
    [onFilesChange]
  );

  const canAddMore = files.length < MAX_FILES && !disabled;

  // Render: chips list (shared)
  const renderChips = () => {
    if (files.length === 0) return null;
    return (
      <View className="mt-3" style={{ gap: 8 }}>
        {files.map((f, i) => {
          const isPdf = f.mimeType === "application/pdf";
          return (
            <View
              key={`${f.uri}-${i}`}
              className="flex-row items-center bg-surface2 border border-border rounded-xl px-3 py-2.5"
            >
              {isPdf ? (
                <FileIcon size={18} color={f.error ? colors.error : colors.primary} />
              ) : (
                <FileImage size={18} color={f.error ? colors.error : colors.primary} />
              )}
              <View className="flex-1 mx-2">
                <Text className="text-sm text-text-base" numberOfLines={1}>
                  {f.name}
                </Text>
                {f.uploading ? (
                  <Text className="text-xs text-text-mute">Загрузка…</Text>
                ) : f.error ? (
                  <Text className="text-xs text-danger">{f.error}</Text>
                ) : f.uploadedUrl ? (
                  <Text className="text-xs text-text-mute">
                    {(f.size / 1024).toFixed(0)} КБ · загружен
                  </Text>
                ) : (
                  <Text className="text-xs text-text-mute">{(f.size / 1024).toFixed(0)} КБ</Text>
                )}
              </View>
              {f.uploading ? (
                <ActivityIndicator size="small" color={colors.placeholder} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Удалить файл"
                  onPress={() => handleRemove(i)}
                  className="w-9 h-9 items-center justify-center"
                  hitSlop={8}
                >
                  <X size={16} color={colors.placeholder} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // ---- Desktop drag-and-drop zone ----
  if (isDesktop) {
    const dropZoneStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: isDragOver ? colors.primary : colors.border,
      borderRadius: 12,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDragOver ? colors.accentSoft : colors.surface2,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "border-color 120ms ease, background-color 120ms ease",
      opacity: disabled ? 0.5 : 1,
    };

    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1">Документы</Text>
        <Text className="text-xs text-text-mute mb-3">
          PDF, JPG, PNG — до 10 МБ каждый, не более {MAX_FILES} файлов
        </Text>

        {canAddMore && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Перетащите файлы или нажмите для выбора"
            onClick={openWebPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openWebPicker();
              }
            }}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={dropZoneStyle}
          >
            <UploadCloud
              size={28}
              color={isDragOver ? colors.primary : colors.placeholder}
            />
            <Text className="text-sm text-text-base mt-2 font-medium text-center">
              Перетащите файлы сюда или нажмите для выбора
            </Text>
            <Text className="text-xs text-text-mute mt-1 text-center">
              PDF, JPG, PNG · до 10 МБ
            </Text>
          </div>
        )}

        {/* hidden input — we set inline style not className to avoid RN-Web double-input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          style={{ display: "none" }}
          onChange={onWebInputChange}
        />

        {globalError ? (
          <Text className="text-xs text-danger mt-2">{globalError}</Text>
        ) : null}

        {renderChips()}
      </View>
    );
  }

  // ---- Mobile / native ----
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-text-base mb-1">Документы</Text>
      <Text className="text-xs text-text-mute mb-3">
        PDF, JPG, PNG — до 10 МБ каждый, не более {MAX_FILES} файлов
      </Text>

      {canAddMore && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Прикрепить документ"
          onPress={Platform.OS === "web" ? openWebPicker : openNativePicker}
          className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl bg-surface2 active:bg-white"
          style={{ minHeight: 48, opacity: disabled ? 0.5 : 1 }}
          disabled={disabled}
        >
          <Paperclip size={16} color={colors.primary} />
          <Text className="text-sm ml-2 font-medium text-text-base">
            Прикрепить документ
          </Text>
        </Pressable>
      )}

      {Platform.OS === "web" && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          style={{ display: "none" }}
          onChange={onWebInputChange}
        />
      )}

      {globalError ? (
        <Text className="text-xs text-danger mt-2">{globalError}</Text>
      ) : null}

      {renderChips()}
    </View>
  );
}
