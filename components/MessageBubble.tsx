import { View, Text, Pressable } from "react-native";
import { ImageIcon, File, FileText, Download } from "lucide-react-native";
import { colors } from "@/lib/theme";

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
  onImagePress?: (url: string) => void;
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
  const imageFiles = files.filter((f) => isImage(f.mimeType));
  const docFiles = files.filter((f) => !isImage(f.mimeType));

  return (
    <View
      className={`mb-2 ${isOwn ? "items-end" : "items-start"}`}
    >
      <View
        className="px-3 py-2"
        style={{
          maxWidth: "80%",
          borderRadius: 16,
          backgroundColor: isOwn ? "#2256c2" : "#f1f5f9",
          ...(isOwn
            ? { borderBottomRightRadius: 4 }
            : { borderBottomLeftRadius: 4 }),
        }}
      >
        {/* Image thumbnails */}
        {imageFiles.map((img) => (
          <Pressable
            accessibilityRole="button"
            key={img.id}
            accessibilityLabel={`Изображение ${img.filename}`}
            onPress={() => onImagePress?.(img.url)}
            className="mb-1"
          >
            <View className="w-[200px] h-[200px] bg-surface2 rounded-xl items-center justify-center">
              <ImageIcon
                size={32}
                color={isOwn ? colors.surface : colors.textSecondary}
              />
              <Text
                className={`text-xs mt-1 ${isOwn ? "text-accent-soft" : "text-text-mute"}`}
                numberOfLines={1}
              >
                {img.filename}
              </Text>
            </View>
          </Pressable>
        ))}

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
              ? <FileText size={18} color={isOwn ? "#93c5fd" : colors.primary} />
              : <File size={18} color={isOwn ? "#93c5fd" : colors.primary} />
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
            <Download size={12} color={isOwn ? "#93c5fd" : colors.placeholder} />
          </Pressable>
        ))}

        {/* Text */}
        {text ? (
          <Text className="text-base" style={{ color: isOwn ? "#ffffff" : "#0f172a" }}>
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
