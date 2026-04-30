import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { UploadCloud, File as FileIcon, FileImage, X, Paperclip } from "lucide-react-native";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";

/**
 * One pending file tracked by the upload zone. Holds local metadata,
 * the original web `File` (so we can re-upload from the real binary
 * payload, not a blob URL) and the upload status / server response.
 */
export interface PendingFile {
  /** Local UUID — stable id used as React key and remove handle. */
  id: string;
  /** Local URI — blob: URL on web, file:// uri on native. */
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  /** Original browser File object — required for FormData on web. */
  webFile?: File;
  status: "pending" | "uploading" | "done" | "error";
  /** Returned by `/api/upload/documents` — DB id of the File row. */
  uploadedId?: string;
  /** Public URL of the stored object (presigned or path). */
  uploadedUrl?: string;
  /** Storage key (returned by /documents) — useful for resigning. */
  uploadedKey?: string;
  /** Idempotency token for /api/upload/chat-file uploads. */
  uploadedToken?: string;
  errorMessage?: string;
}

const DEFAULT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface FileUploadZoneProps {
  files: PendingFile[];
  onFilesChange: (files: PendingFile[]) => void;
  /** Default 5. */
  maxFiles?: number;
  /** Default 10 MB. */
  maxSizeMB?: number;
  /** Default = images + pdf + doc/docx. */
  allowedTypes?: string[];
  /** e.g. "/api/upload/documents" or "/api/upload/chat-file". */
  uploadEndpoint: string;
  /** Bearer token for the upload request. */
  authToken?: string | null;
  /**
   * compact=false (default) → big dashed drop-zone above the chip list
   *                            (request form variant).
   * compact=true            → just a paperclip button + chip strip
   *                            (chat composer variant).
   */
  compact?: boolean;
  disabled?: boolean;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildAcceptAttr(types: string[]): string {
  return types.join(",");
}

/**
 * FileUploadZone — shared multi-file upload control used by both the
 * request creation form (`compact=false`) and the chat composer
 * (`compact=true`).
 *
 * Behavior:
 *   - Files are uploaded immediately on pick / drop.
 *   - Each file shows status: pending → uploading → done | error.
 *   - On web the actual `File` object is sent in FormData (not blob URL).
 *   - Drag-and-drop listeners are attached via native DOM events on
 *     the underlying element (RN-Web's View props are unreliable).
 *   - `/api/upload/chat-file` uses an idempotency token + single file
 *     field. `/api/upload/documents` uses `files[]` and returns DB ids.
 */
export default function FileUploadZone({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
  allowedTypes = DEFAULT_TYPES,
  uploadEndpoint,
  authToken,
  compact = false,
  disabled = false,
}: FileUploadZoneProps) {
  const containerRef = useRef<View>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Latest files snapshot for callbacks invoked after a network round-trip.
  const filesRef = useRef(files);
  filesRef.current = files;

  const maxBytes = maxSizeMB * 1024 * 1024;
  const isChatEndpoint = uploadEndpoint.includes("/chat-file");

  // ---- Single-file upload (chat-file or documents) -----------------------
  const uploadOne = useCallback(
    async (pf: PendingFile) => {
      // Mark uploading (replace by id)
      const markUploading = filesRef.current.map((f) =>
        f.id === pf.id ? { ...f, status: "uploading" as const } : f
      );
      onFilesChange(markUploading);
      filesRef.current = markUploading;

      try {
        const formData = new FormData();
        const fieldName = isChatEndpoint ? "file" : "files";

        if (Platform.OS === "web" && pf.webFile) {
          formData.append(fieldName, pf.webFile, pf.name);
        } else {
          // Native: append using the {uri,name,type} shape fetch understands.
          formData.append(fieldName, {
            uri: pf.uri,
            name: pf.name,
            type: pf.mimeType,
          } as unknown as Blob);
        }

        let chatUploadToken: string | undefined;
        if (isChatEndpoint) {
          chatUploadToken = generateId();
          formData.append("uploadToken", chatUploadToken);
          // threadId is intentionally omitted — backend supports
          // _pending namespace; messages.ts later resolves the token.
        }

        const res = await fetch(`${API_URL}${uploadEndpoint}`, {
          method: "POST",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        });

        if (!res.ok) {
          throw new Error(
            res.status === 413
              ? `Файл больше ${maxSizeMB} МБ`
              : res.status === 415
              ? "Неподдерживаемый формат"
              : "Ошибка загрузки"
          );
        }

        let nextPatch: Partial<PendingFile>;
        if (isChatEndpoint) {
          const data = (await res.json()) as {
            uploadToken: string;
            fileUrl: string;
            fileName: string;
          };
          nextPatch = {
            status: "done",
            uploadedToken: data.uploadToken,
            uploadedUrl: data.fileUrl,
          };
        } else {
          const data = (await res.json()) as {
            files: { id?: string; url: string; key: string }[];
          };
          const uploaded = data.files[0];
          nextPatch = {
            status: "done",
            uploadedId: uploaded?.id,
            uploadedUrl: uploaded?.url,
            uploadedKey: uploaded?.key,
          };
        }

        const next = filesRef.current.map((f) =>
          f.id === pf.id ? { ...f, ...nextPatch } : f
        );
        onFilesChange(next);
        filesRef.current = next;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки";
        const next = filesRef.current.map((f) =>
          f.id === pf.id ? { ...f, status: "error" as const, errorMessage: msg } : f
        );
        onFilesChange(next);
        filesRef.current = next;
      }
    },
    [authToken, isChatEndpoint, maxSizeMB, onFilesChange, uploadEndpoint]
  );

  // ---- Validate + queue ---------------------------------------------------
  const validateAndQueue = useCallback(
    (
      candidates: {
        name: string;
        size: number;
        mimeType: string;
        uri: string;
        webFile?: File;
      }[]
    ) => {
      setGlobalError(null);
      const current = filesRef.current;
      const remainingSlots = maxFiles - current.length;
      if (remainingSlots <= 0) {
        setGlobalError(`Можно прикрепить максимум ${maxFiles} файлов`);
        return;
      }
      const accepted: PendingFile[] = [];
      for (const f of candidates) {
        if (accepted.length >= remainingSlots) {
          setGlobalError(`Можно прикрепить максимум ${maxFiles} файлов`);
          break;
        }
        if (f.size > maxBytes) {
          setGlobalError(`Файл "${f.name}" больше ${maxSizeMB} МБ`);
          continue;
        }
        if (
          allowedTypes.length > 0 &&
          f.mimeType &&
          !allowedTypes.includes(f.mimeType)
        ) {
          setGlobalError(`"${f.name}" — неподдерживаемый формат`);
          continue;
        }
        accepted.push({
          id: generateId(),
          uri: f.uri,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          webFile: f.webFile,
          status: "pending",
        });
      }
      if (accepted.length === 0) return;
      const next = [...current, ...accepted];
      onFilesChange(next);
      filesRef.current = next;
      // Kick off uploads concurrently — each updates state via filesRef.
      for (const a of accepted) {
        void uploadOne(a);
      }
    },
    [allowedTypes, maxBytes, maxFiles, maxSizeMB, onFilesChange, uploadOne]
  );

  // ---- Web: hidden <input type=file> -------------------------------------
  const openWebPicker = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const onWebInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list || list.length === 0) return;
      const incoming = Array.from(list).map((f) => ({
        webFile: f,
        name: f.name,
        size: f.size,
        mimeType: f.type || "application/octet-stream",
        uri: URL.createObjectURL(f),
      }));
      validateAndQueue(incoming);
      e.target.value = "";
    },
    [validateAndQueue]
  );

  // ---- Web: drag-and-drop on the underlying DOM node ---------------------
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== "function") return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      // Only collapse overlay when leaving the container entirely.
      if (!node.contains(e.relatedTarget as Node)) setIsDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const list = e.dataTransfer?.files;
      if (!list || list.length === 0) return;
      const incoming = Array.from(list).map((f) => ({
        webFile: f,
        name: f.name,
        size: f.size,
        mimeType: f.type || "application/octet-stream",
        uri: URL.createObjectURL(f),
      }));
      validateAndQueue(incoming);
    };

    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDrop);
    return () => {
      node.removeEventListener("dragover", onDragOver);
      node.removeEventListener("dragleave", onDragLeave);
      node.removeEventListener("drop", onDrop);
    };
  }, [disabled, validateAndQueue]);

  // ---- Native: expo-document-picker --------------------------------------
  const openNativePicker = useCallback(async () => {
    if (disabled) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        multiple: maxFiles > 1,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const incoming = res.assets.map((a) => ({
        name: a.name,
        size: a.size ?? 0,
        mimeType: a.mimeType ?? "application/octet-stream",
        uri: a.uri,
      }));
      validateAndQueue(incoming);
    } catch {
      setGlobalError("Не удалось выбрать файл");
    }
  }, [allowedTypes, disabled, maxFiles, validateAndQueue]);

  const handleRemove = useCallback(
    (id: string) => {
      const next = filesRef.current.filter((f) => f.id !== id);
      onFilesChange(next);
      filesRef.current = next;
    },
    [onFilesChange]
  );

  const canAddMore = files.length < maxFiles && !disabled;

  // ---- Chip list (shared between compact + full) -------------------------
  const renderChips = () => {
    if (files.length === 0) return null;
    return (
      <View style={{ gap: 8, marginTop: compact ? 0 : 12 }}>
        {files.map((f) => {
          const isPdf = f.mimeType === "application/pdf";
          const isError = f.status === "error";
          return (
            <View
              key={f.id}
              className="flex-row items-center bg-surface2 border border-border rounded-xl px-3 py-2.5"
            >
              {isPdf ? (
                <FileIcon size={18} color={isError ? colors.error : colors.primary} />
              ) : (
                <FileImage size={18} color={isError ? colors.error : colors.primary} />
              )}
              <View className="flex-1 mx-2">
                <Text className="text-sm text-text-base" numberOfLines={1}>
                  {f.name}
                </Text>
                {f.status === "uploading" || f.status === "pending" ? (
                  <Text className="text-xs text-text-mute">Загрузка…</Text>
                ) : f.status === "error" ? (
                  <Text className="text-xs text-danger">
                    {f.errorMessage ?? "Ошибка"}
                  </Text>
                ) : (
                  <Text className="text-xs text-text-mute">
                    {(f.size / 1024).toFixed(0)} КБ · загружен
                  </Text>
                )}
              </View>
              {f.status === "uploading" || f.status === "pending" ? (
                <ActivityIndicator size="small" color={colors.placeholder} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Удалить файл"
                  onPress={() => handleRemove(f.id)}
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

  // ---- Compact variant: paperclip + chips + drag overlay -----------------
  if (compact) {
    return (
      <View ref={containerRef} style={{ position: "relative" }}>
        {Platform.OS === "web" && (
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={buildAcceptAttr(allowedTypes)}
            style={{ display: "none" }}
            onChange={onWebInputChange}
          />
        )}

        {/* Drag-over overlay */}
        {isDragOver && Platform.OS === "web" && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              backgroundColor: "rgba(59,130,246,0.08)",
              borderWidth: 2,
              borderColor: colors.primary,
              borderStyle: "dashed",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
            pointerEvents="none"
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
              Отпустите чтобы прикрепить
            </Text>
          </View>
        )}

        {/* Chip strip — only shown when there are files */}
        {files.length > 0 && (
          <View className="px-2 py-1">{renderChips()}</View>
        )}

        {/* Paperclip button — caller is responsible for placing this row */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Прикрепить файл (до ${maxSizeMB} МБ, не более ${maxFiles})`}
          onPress={Platform.OS === "web" ? openWebPicker : openNativePicker}
          disabled={!canAddMore}
          className="w-11 h-11 items-center justify-center"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Paperclip
            size={20}
            color={!canAddMore ? colors.border : colors.textSecondary}
          />
        </Pressable>

        {globalError ? (
          <Text className="text-xs text-danger mt-1 px-2">{globalError}</Text>
        ) : null}
      </View>
    );
  }

  // ---- Full drop-zone variant (form) -------------------------------------
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
    <View ref={containerRef} className="mb-4">
      <Text className="text-sm font-medium text-text-base mb-1">Документы</Text>
      <Text className="text-xs text-text-mute mb-3">
        До {maxSizeMB} МБ каждый, не более {maxFiles} файлов
      </Text>

      {canAddMore && Platform.OS === "web" && (
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
          style={dropZoneStyle}
        >
          <UploadCloud
            size={28}
            color={isDragOver ? colors.primary : colors.placeholder}
          />
          <Text className="text-sm text-text-base mt-2 font-medium text-center">
            {isDragOver
              ? "Отпустите чтобы прикрепить"
              : "Перетащите файлы сюда или нажмите для выбора"}
          </Text>
        </div>
      )}

      {canAddMore && Platform.OS !== "web" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Прикрепить документ"
          onPress={openNativePicker}
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
          multiple={maxFiles > 1}
          accept={buildAcceptAttr(allowedTypes)}
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
