/**
 * Shared file utilities — icons, MIME helpers, formatting.
 * Single source of truth for all file-related logic across the app.
 */
import {
  File as FileIcon,
  FileImage,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileVideo,
  FileAudio,
  Download,
} from "lucide-react-native";

/** Application-wide file upload limits. */
export const SERVICE_LIMITS = {
  maxSizeMB: 10,
  maxCount: 10,
  allowedMime: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.oasis.opendocument.spreadsheet",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/vnd.rar",
    "application/x-7z-compressed",
  ],
} as const;

/** Returns the appropriate lucide icon component for a given MIME type. */
export function getFileIcon(
  mimeType: string
): typeof FileIcon {
  if (isImage(mimeType)) return FileImage;
  if (isPdf(mimeType)) return FileText;
  if (isDoc(mimeType)) return FileText;
  if (isSpreadsheet(mimeType)) return FileSpreadsheet;
  if (isArchive(mimeType)) return FileArchive;
  if (isVideo(mimeType)) return FileVideo;
  if (isAudio(mimeType)) return FileAudio;
  return FileIcon;
}

/** True for image/* MIME types. */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/** True for application/pdf. */
export function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/** True for Word documents (doc/docx). */
export function isDoc(mimeType: string): boolean {
  return (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

/** True for spreadsheet MIME types. */
export function isSpreadsheet(mimeType: string): boolean {
  return (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

/** True for archive MIME types. */
export function isArchive(mimeType: string): boolean {
  return (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed"
  );
}

/** True for video/* MIME types. */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

/** True for audio/* MIME types. */
export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

/**
 * Format a byte count into a human-readable string.
 * e.g. 1234567 → "1.2 МБ", 8192 → "8 КБ", 500 → "500 Б"
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }
  return `${bytes} Б`;
}

// Re-export lucide icons used in file components to avoid duplicate imports.
export { Download };
