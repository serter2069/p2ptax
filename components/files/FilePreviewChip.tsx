import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { X } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { getFileIcon, isImage, formatFileSize } from "@/lib/files";

export interface FileChipFile {
  name: string;
  size: number;
  mimeType: string;
  /** Public URL — if provided and isImage, shows thumbnail. */
  url?: string;
  /** Upload status. */
  status?: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

interface FilePreviewChipProps {
  file: FileChipFile;
  /** Called when the X button is pressed. */
  onRemove?: () => void;
  /** Called when the chip body is pressed. */
  onClick?: () => void;
  /** compact=true renders as a horizontal pill (chat style). */
  compact?: boolean;
}

/**
 * Unified file chip used in upload zones and message file lists.
 *
 * Full (compact=false): row card with icon/thumbnail, name, size/status, remove.
 * Compact (compact=true): horizontal pill — icon, truncated name, remove.
 */
export default function FilePreviewChip({
  file,
  onRemove,
  onClick,
  compact = false,
}: FilePreviewChipProps) {
  const { name, size, mimeType, url, status, errorMessage } = file;
  const isBusy = status === "uploading" || status === "pending";
  const isErr = status === "error";
  const showThumb = isImage(mimeType) && !!url;
  const Icon = getFileIcon(mimeType);
  const iconColor = isErr ? colors.error : colors.primary;

  if (compact) {
    return (
      <Pressable
        onPress={onClick}
        disabled={!onClick}
        className="flex-row items-center bg-surface2 border border-border rounded-full pl-2 pr-1 py-1"
        style={{ maxWidth: 220 }}
        accessibilityRole={onClick ? "button" : "none"}
        accessibilityLabel={name}
      >
        {showThumb ? (
          <Image
            source={{ uri: url }}
            style={{ width: 20, height: 20, borderRadius: 4 }}
            accessibilityLabel={name}
          />
        ) : (
          <Icon size={14} color={iconColor} />
        )}
        <Text
          className="text-xs text-text-base ml-1.5 flex-shrink"
          numberOfLines={1}
          style={{ maxWidth: 140 }}
        >
          {name}
        </Text>
        {isBusy ? (
          <ActivityIndicator
            size="small"
            color={colors.placeholder}
            style={{ marginLeft: 4, marginRight: 4 }}
          />
        ) : onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Удалить ${name}`}
            onPress={onRemove}
            className="w-6 h-6 items-center justify-center ml-1"
            hitSlop={6}
          >
            <X size={12} color={isErr ? colors.error : colors.placeholder} />
          </Pressable>
        ) : null}
      </Pressable>
    );
  }

  // Full card variant
  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      className="flex-row items-center bg-surface2 border border-border rounded-xl px-3 py-2.5"
      accessibilityRole={onClick ? "button" : "none"}
      accessibilityLabel={name}
    >
      {showThumb ? (
        <Image
          source={{ uri: url }}
          style={{ width: 44, height: 44, borderRadius: 8 }}
          accessibilityLabel={name}
        />
      ) : (
        <Icon size={18} color={iconColor} />
      )}
      <View className="flex-1 mx-2">
        <Text className="text-sm text-text-base" numberOfLines={1}>
          {name}
        </Text>
        {isBusy ? (
          <Text className="text-xs text-text-mute">Загрузка…</Text>
        ) : isErr ? (
          <Text className="text-xs text-danger">
            {errorMessage ?? "Ошибка загрузки"}
          </Text>
        ) : (
          <Text className="text-xs text-text-mute">{formatFileSize(size)}</Text>
        )}
      </View>
      {isBusy ? (
        <ActivityIndicator size="small" color={colors.placeholder} />
      ) : onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Удалить файл"
          onPress={onRemove}
          className="w-9 h-9 items-center justify-center"
          hitSlop={8}
        >
          <X size={16} color={colors.placeholder} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
