import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Input from "@/components/ui/Input";
import { colors, radiusValue } from "@/lib/theme";
import { formatFileSize } from "./chatUtils";

interface PendingFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ChatComposerProps {
  text: string;
  onChangeText: (t: string) => void;
  pendingFiles: PendingFile[];
  sending: boolean;
  uploading: boolean;
  isClosed: boolean;
  dragOver: boolean;
  onSend: () => void;
  onAttachFile: () => void;
  onRemovePendingFile: (index: number) => void;
  onWebFileDrop: (file: File) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
}

export default function ChatComposer({
  text,
  onChangeText,
  pendingFiles,
  sending,
  uploading,
  isClosed,
  dragOver,
  onSend,
  onAttachFile,
  onRemovePendingFile,
  onWebFileDrop,
  onDragOver,
  onDragLeave,
}: ChatComposerProps) {
  return (
    <>
      {/* Request closed banner */}
      {isClosed && (
        <View className="border-t px-4 py-3" style={{ backgroundColor: colors.yellowSoft, borderTopColor: colors.warning }}>
          <Text className="text-sm text-center" style={{ color: colors.primary }}>
            Заявка закрыта. Чат доступен только для чтения.
          </Text>
        </View>
      )}

      {/* Pending files preview strip */}
      {pendingFiles.length > 0 && (
        <View className="flex-row flex-wrap px-3 py-2 border-t border-border bg-surface2">
          {pendingFiles.map((f, i) => (
            <View
              key={i}
              className="flex-row items-center bg-white border border-border rounded-lg px-2 py-1 mr-2 mb-1"
            >
              <FontAwesome name="file-o" size={13} color={colors.primary} />
              <Text className="text-xs mx-1 max-w-[90px]" style={{ color: colors.text }} numberOfLines={1}>
                {f.name}
              </Text>
              <Text className="text-xs mr-1" style={{ color: colors.textSecondary }}>{formatFileSize(f.size)}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRemovePendingFile(i)}
                accessibilityLabel={`Удалить файл ${f.name}`}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <FontAwesome name="times" size={11} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Input bar */}
      {!isClosed && (
        <View
          className="flex-row items-end border-t border-border px-3 py-2 bg-white"
          style={dragOver ? { backgroundColor: colors.accentSoft } as object : undefined}
          {...(Platform.OS === "web" ? {
            onDragOver: (e: React.DragEvent) => { e.preventDefault(); onDragOver(); },
            onDragLeave: () => onDragLeave(),
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              onDragLeave();
              const file = e.dataTransfer.files[0];
              if (file) onWebFileDrop(file);
            },
          } as object : {})}
        >
          {dragOver && Platform.OS === "web" && (
            <View
              className="absolute inset-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.05)", zIndex: 10 }}
              pointerEvents="none"
            >
              <Text className="text-sm font-medium text-text-dim">Перетащите файл сюда</Text>
            </View>
          )}

          {/* Attach button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Прикрепить файл (PDF, JPG, PNG — до 10 МБ, не более 3)"
            onPress={onAttachFile}
            disabled={pendingFiles.length >= 3 || sending}
            className="w-11 h-11 items-center justify-center mr-1"
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <FontAwesome
              name="paperclip"
              size={20}
              color={pendingFiles.length >= 3 ? colors.border : colors.textSecondary}
            />
          </Pressable>

          {/* Text input */}
          <Input
            accessibilityLabel="Введите сообщение"
            placeholder="Введите сообщение..."
            value={text}
            onChangeText={onChangeText}
            multiline
            style={{ flex: 1 }}
            containerStyle={{ borderRadius: radiusValue.xl, minHeight: 40, maxHeight: 120 }}
          />

          {/* Send button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отправить сообщение"
            onPress={onSend}
            disabled={(!text.trim() && pendingFiles.length === 0) || sending}
            className="w-11 h-11 items-center justify-center ml-2"
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            {sending || uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <FontAwesome
                name="send"
                size={20}
                color={(text.trim() || pendingFiles.length > 0) ? colors.primary : colors.textSecondary}
              />
            )}
          </Pressable>
        </View>
      )}
    </>
  );
}
