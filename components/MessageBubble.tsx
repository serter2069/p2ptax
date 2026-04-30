import { View, Text, Pressable, Image } from "react-native";
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
          backgroundColor: isOwn ? colors.primary : colors.surface2,
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
            accessibilityLabel={`Изображение ${img.filename}. Нажмите для просмотра.`}
            onPress={() => onImagePress?.(img.url, img.filename)}
            className="mb-1"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Image
              source={{ uri: img.url }}
              style={{ width: 200, height: 200, borderRadius: 12 }}
              resizeMode="cover"
              accessibilityLabel={img.filename}
              defaultSource={undefined}
              onError={() => {/* silent — fallback below not needed for already-fetched URLs */}}
            />
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
