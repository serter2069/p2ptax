import { View, Text, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
        className={`rounded-2xl px-3 py-2 ${
          isOwn ? "bg-blue-900" : "bg-slate-50"
        }`}
        style={{ maxWidth: "80%" }}
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
            <View className="w-[200px] h-[200px] bg-slate-200 rounded-xl items-center justify-center">
              <FontAwesome
                name="image"
                size={32}
                color={isOwn ? colors.surface : colors.textSecondary}
              />
              <Text
                className={`text-xs mt-1 ${isOwn ? "text-blue-200" : "text-slate-400"}`}
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
              isOwn ? "bg-blue-800" : "bg-slate-100"
            }`}
          >
            <FontAwesome
              name={file.mimeType === "application/pdf" ? "file-pdf-o" : "file-o"}
              size={18}
              color={isOwn ? "#93c5fd" : colors.primary}
            />
            <View className="ml-2 flex-1">
              <Text
                className={`text-sm ${isOwn ? "text-white" : "text-slate-900"}`}
                numberOfLines={1}
              >
                {file.filename}
              </Text>
              <Text
                className={`text-xs ${isOwn ? "text-blue-200" : "text-slate-400"}`}
              >
                {formatFileSize(file.size)}
              </Text>
            </View>
            <FontAwesome
              name="download"
              size={12}
              color={isOwn ? "#93c5fd" : colors.placeholder}
            />
          </Pressable>
        ))}

        {/* Text */}
        {text ? (
          <Text className={`text-base ${isOwn ? "text-white" : "text-slate-900"}`}>
            {text}
          </Text>
        ) : null}
      </View>

      {/* Time */}
      <Text className="text-xs text-slate-400 mt-1 px-1">
        {formatTime(createdAt)}
      </Text>
    </View>
  );
}
