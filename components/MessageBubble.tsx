import { View, Text, Pressable, Image, Modal, TouchableOpacity } from "react-native";
import { useState } from "react";
import { File, FileText, Download, X } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { API_URL } from "@/lib/api";

/**
 * Resolve a stored attachment URL to a fully-qualified URL the platform
 * <Image>/<a> can fetch. Backend now presigns to absolute https URLs,
 * but we keep the relative fallback so legacy bubbles (and the brief
 * window between deploy + DB rewrite) still render.
 */
function resolveAttachmentUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface MessageBubbleProps {
  text: string;
  createdAt: string;
  isOwn: boolean;
  files?: FileAttachment[];
  onFilePress?: (file: FileAttachment) => void;
  onImagePress?: (url: string, filename: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export default function MessageBubble({
  text,
  createdAt,
  isOwn,
  files = [],
  onFilePress,
  onImagePress,
}: MessageBubbleProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const imageFiles = files.filter((f) => isImage(f.mimeType));
  const docFiles = files.filter((f) => !isImage(f.mimeType));

  const handleImagePress = (url: string, filename: string) => {
    // url is already resolved (caller passed `resolvedUri`). Forwarded as-is.
    if (onImagePress) {
      onImagePress(url, filename);
    } else {
      setLightboxUrl(url);
    }
  };

  return (
    <View
      className={`mb-2 ${isOwn ? "items-end" : "items-start"}`}
    >
      {/* Inline lightbox modal */}
      <Modal
        visible={lightboxUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUrl(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLightboxUrl(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" }}
        >
          {lightboxUrl ? (
            <Image
              source={{ uri: lightboxUrl }}
              style={{ width: "90%", height: "70%", resizeMode: "contain" }}
              accessibilityLabel="Просмотр изображения"
            />
          ) : null}
          <TouchableOpacity
            onPress={() => setLightboxUrl(null)}
            style={{ position: "absolute", top: 48, right: 16, padding: 8 }}
            accessibilityLabel="Закрыть"
            accessibilityRole="button"
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View
        className="px-3 py-2"
        style={{
          maxWidth: "80%",
          borderRadius: 16,
          backgroundColor: isOwn ? colors.primary : colors.surface2,
          ...(isOwn
            ? { borderBottomRightRadius: 4 }
            : { borderBottomLeftRadius: 4 }),
        }}
      >
        {/* Image thumbnails */}
        {imageFiles.map((img) => {
          const resolvedUri = resolveAttachmentUrl(img.url);
          return (
            <Pressable
              accessibilityRole="button"
              key={img.id}
              accessibilityLabel={`Изображение ${img.filename}. Нажмите для просмотра.`}
              onPress={() => handleImagePress(resolvedUri, img.filename)}
              className="mb-2"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <Image
                source={{ uri: resolvedUri }}
                style={{ width: 200, height: 200, borderRadius: 12 }}
                resizeMode="cover"
                accessibilityLabel={img.filename}
              />
            </Pressable>
          );
        })}

        {/* Document files */}
        {docFiles.map((file) => (
          <Pressable
            accessibilityRole="button"
            key={file.id}
            accessibilityLabel={`Файл ${file.filename}`}
            onPress={() => onFilePress?.(file)}
            className={`flex-row items-center rounded-lg p-2 mb-1 ${
              isOwn ? "bg-accent" : "bg-surface2"
            }`}
          >
            {file.mimeType === "application/pdf"
              ? <FileText size={18} color={isOwn ? colors.blue300 : colors.primary} />
              : <File size={18} color={isOwn ? colors.blue300 : colors.primary} />
            }
            <View className="ml-2 flex-1">
              <Text
                className={`text-sm ${isOwn ? "text-white" : "text-text-base"}`}
                numberOfLines={1}
              >
                {file.filename}
              </Text>
              <Text
                className={`text-xs ${isOwn ? "text-accent-soft" : "text-text-mute"}`}
              >
                {formatFileSize(file.size)}
              </Text>
            </View>
            <Download size={12} color={isOwn ? colors.blue300 : colors.placeholder} />
          </Pressable>
        ))}

        {/* Text */}
        {text ? (
          <Text className="text-base" style={{ color: isOwn ? colors.surface : colors.text }}>
            {text}
          </Text>
        ) : null}
      </View>

      {/* Time */}
      <Text className="text-xs text-text-mute mt-1 px-1">
        {formatTime(createdAt)}
      </Text>
    </View>
  );
}
